#!/usr/bin/env python3
"""
Local-only Codex helper for testing a static web page against your Codex/ChatGPT login.

Version 12:
- image-input diagnostics
- selectable image payload shapes so you can test what the Codex subscription backend accepts
- experimental image-generation requests via tools=[{"type": "image_generation"}]
- always uses stream=true because this backend rejects stream=false
- requests partial image events for image generation
- captures images from intermediate SSE events as well as the final completed response
- catches Responses image stream fields such as partial_image_b64 and b64_json
- returns event-type counts and interesting event samples for debugging
- adds tool tests: web search, image generation, code interpreter, and local function calling
- fixes local function follow-up calls by carrying instructions into the second Responses request

This intentionally binds to 127.0.0.1 and never returns the Codex access token to the browser.
It reads ~/.codex/auth.json, or $CODEX_HOME/auth.json, refreshes the access token when needed,
and proxies a tiny subset of the Responses API through chatgpt.com/backend-api/codex.

Tested as a minimal experiment, not a production server.
"""

from __future__ import annotations

import argparse
import base64
import datetime as _dt
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

REFRESH_URL = "https://auth.openai.com/oauth/token"
CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
CODEX_BASE_URL = "https://chatgpt.com/backend-api/codex"
REFRESH_SKEW_SECONDS = 30
DEFAULT_MODEL = "gpt-5.4-mini"
DEFAULT_PORT = 8787
HELPER_VERSION = "0.16"

# The ChatGPT/Codex backend is not a full public Responses API clone.
CODEX_ALLOWED_RESPONSE_KEYS = {
    "model",
    "input",
    "instructions",
    "stream",
    "store",
    "include",
    "tools",
    "tool_choice",
    "reasoning",
    "previous_response_id",
    "truncation",
}

DATA_URL_RE = re.compile(r"^data:(?P<mime>[-\w.+/]+)?;base64,(?P<data>[A-Za-z0-9+/=\s]+)$")


class HelperError(Exception):
    """Expected local-helper error that can be returned to the test page."""


def auth_path() -> Path:
    codex_home = os.environ.get("CODEX_HOME")
    if codex_home:
        return Path(codex_home).expanduser() / "auth.json"
    return Path.home() / ".codex" / "auth.json"


def read_auth() -> Dict[str, Any]:
    path = auth_path()
    if not path.exists():
        raise HelperError(
            f"Codex auth file not found at {path}. Run `codex login` first, or set CODEX_HOME."
        )
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise HelperError(f"Could not parse {path}: {e}") from e

    mode = data.get("auth_mode")
    if mode != "chatgpt":
        raise HelperError(
            f"Expected auth_mode='chatgpt' in {path}, got {mode!r}. Run `codex login` with ChatGPT sign-in."
        )
    return data


def write_auth(data: Dict[str, Any]) -> None:
    path = auth_path()
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, path)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


def jwt_exp(token: str) -> Optional[int]:
    try:
        part = token.split(".")[1]
        part += "=" * (-len(part) % 4)
        payload = json.loads(base64.urlsafe_b64decode(part.encode("ascii")))
        exp = payload.get("exp")
        return int(exp) if exp is not None else None
    except Exception:
        return None


def refresh_tokens(refresh_token: str) -> Dict[str, Any]:
    body = json.dumps(
        {
            "client_id": CLIENT_ID,
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        REFRESH_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        details = e.read().decode("utf-8", errors="replace")
        raise HelperError(f"Token refresh failed: HTTP {e.code}: {details}") from e
    except urllib.error.URLError as e:
        raise HelperError(f"Token refresh failed: {e}") from e


def borrow_codex_key() -> Tuple[str, Optional[str]]:
    data = read_auth()
    tokens = data.get("tokens") or {}
    access_token = tokens.get("access_token")
    if not access_token:
        raise HelperError("No access_token found. Run `codex login` first.")

    exp = jwt_exp(access_token)
    if exp is None or time.time() >= exp - REFRESH_SKEW_SECONDS:
        refresh_token = tokens.get("refresh_token")
        if not refresh_token:
            raise HelperError("Access token expired and no refresh_token is available. Run `codex login` again.")
        new_tokens = refresh_tokens(refresh_token)
        for key in ("access_token", "id_token", "refresh_token"):
            if new_tokens.get(key):
                tokens[key] = new_tokens[key]
        data["tokens"] = tokens
        data["last_refresh"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        write_auth(data)
        access_token = tokens["access_token"]

    account_id = tokens.get("account_id")
    return access_token, account_id


def codex_headers(extra: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    token, account_id = borrow_codex_key()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "text/event-stream, application/json",
    }
    if account_id:
        headers["ChatGPT-Account-ID"] = account_id
    if extra:
        headers.update(extra)
    return headers


def request_json(url: str, *, method: str = "GET", body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=codex_headers(), method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        details = e.read().decode("utf-8", errors="replace")
        raise HelperError(f"Codex request failed: HTTP {e.code}: {details}") from e
    except urllib.error.URLError as e:
        raise HelperError(f"Codex request failed: {e}") from e
    except json.JSONDecodeError as e:
        raise HelperError(f"Codex returned non-JSON response: {e}") from e


def list_models() -> Dict[str, Any]:
    data = request_json(f"{CODEX_BASE_URL}/models?client_version=1.0.0")
    models = [
        m.get("slug")
        for m in data.get("models", [])
        if m.get("slug") and m.get("supported_in_api") and m.get("visibility") == "list"
    ]
    if not models:
        models = [DEFAULT_MODEL]
    return {"ok": True, "models": models, "raw_count": len(data.get("models", []))}


def extract_output_text(response: Dict[str, Any]) -> str:
    if isinstance(response.get("output_text"), str):
        return response["output_text"]

    chunks: List[str] = []
    for item in response.get("output", []) or []:
        for content in item.get("content", []) or []:
            if content.get("type") in ("output_text", "text") and isinstance(content.get("text"), str):
                chunks.append(content["text"])
    return "".join(chunks)


def maybe_data_url(value: str, mime_type: str = "image/png") -> Optional[str]:
    if not isinstance(value, str) or not value:
        return None
    if value.startswith("data:image/"):
        return value
    compact = value.replace("\n", "").replace("\r", "")
    if not re.fullmatch(r"[A-Za-z0-9+/=]+", compact):
        return None
    return f"data:{mime_type};base64,{compact}"


def extract_images_from_object(obj: Any, found: List[Dict[str, str]]) -> None:
    if isinstance(obj, dict):
        if isinstance(obj.get("result"), str):
            mime = obj.get("mime_type") or obj.get("content_type") or "image/png"
            data_url = maybe_data_url(obj["result"], mime)
            if data_url:
                found.append({"mime_type": mime, "data_url": data_url})

        for key in (
            "image_base64",
            "b64_json",
            "base64",
            "data",
            "partial_image_b64",
            "partial_image_base64",
            "final_image_b64",
            "final_image_base64",
            "image_b64",
            "result_b64",
        ):
            value = obj.get(key)
            if isinstance(value, str):
                fmt = obj.get("output_format") or obj.get("format") or "png"
                mime = obj.get("mime_type") or obj.get("content_type") or f"image/{fmt}"
                if mime == "image/jpg":
                    mime = "image/jpeg"
                data_url = maybe_data_url(value, mime)
                if data_url:
                    found.append({"mime_type": mime, "data_url": data_url, "source_key": key})

        image_url = obj.get("image_url") or obj.get("url")
        if isinstance(image_url, str) and image_url.startswith("data:image/"):
            mime = obj.get("mime_type") or obj.get("content_type") or "image/png"
            found.append({"mime_type": mime, "data_url": image_url})

        for value in obj.values():
            extract_images_from_object(value, found)
    elif isinstance(obj, list):
        for value in obj:
            extract_images_from_object(value, found)


def dedupe_images(images: List[Dict[str, str]]) -> List[Dict[str, str]]:
    unique: List[Dict[str, str]] = []
    seen = set()
    for image in images:
        key = image.get("data_url")
        if key and key not in seen:
            seen.add(key)
            unique.append(image)
    return unique


def extract_output_images(response: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
    if not isinstance(response, dict):
        return []
    found: List[Dict[str, str]] = []
    extract_images_from_object(response.get("output"), found)
    if not found:
        extract_images_from_object(response, found)
    return dedupe_images(found)


def sse_events(lines: Iterable[bytes]) -> Iterable[Dict[str, Any]]:
    event_lines = []
    for raw_line in lines:
        line = raw_line.decode("utf-8", errors="replace").rstrip("\r\n")
        if not line:
            if event_lines:
                data_lines = [x[5:].strip() for x in event_lines if x.startswith("data:")]
                event_lines.clear()
                if not data_lines:
                    continue
                payload = "\n".join(data_lines)
                if payload == "[DONE]":
                    return
                try:
                    yield json.loads(payload)
                except json.JSONDecodeError:
                    yield {"type": "unparseable", "raw": payload}
            continue
        event_lines.append(line)


def sanitize_codex_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    return {key: value for key, value in payload.items() if key in CODEX_ALLOWED_RESPONSE_KEYS}


def summarize_data_url(data_url: str) -> Dict[str, Any]:
    match = DATA_URL_RE.match(data_url.strip())
    if not match:
        return {"valid_data_url": False, "chars": len(data_url)}
    b64 = match.group("data").replace("\n", "").replace("\r", "")
    return {
        "valid_data_url": True,
        "mime_type": match.group("mime") or "image/png",
        "data_url_chars": len(data_url),
        "base64_chars": len(b64),
        "approx_bytes": int(len(b64) * 3 / 4),
        "prefix": data_url[:40] + "...",
    }


def summarize_payload(obj: Any) -> Any:
    if isinstance(obj, dict):
        out: Dict[str, Any] = {}
        for key, value in obj.items():
            if key in {"image_url", "file_data"} and isinstance(value, str) and value.startswith("data:image/"):
                out[key] = summarize_data_url(value)
            elif key in {
                "result",
                "partial_image_b64",
                "partial_image_base64",
                "final_image_b64",
                "final_image_base64",
                "image_base64",
                "b64_json",
                "base64",
                "data",
            } and isinstance(value, str) and len(value) > 200:
                out[key] = {
                    "looks_like_large_string": True,
                    "chars": len(value),
                    "prefix": value[:40] + "...",
                }
            else:
                out[key] = summarize_payload(value)
        return out
    if isinstance(obj, list):
        return [summarize_payload(x) for x in obj]
    if isinstance(obj, str) and len(obj) > 500:
        return obj[:200] + f"... [truncated, {len(obj)} chars]"
    return obj



DIAGNOSTIC_KEY_HINTS = ("image", "b64", "base64", "result", "asset", "file", "url", "generation", "tool")

def collect_interesting_paths(obj: Any, path: str = "$", found: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    if found is None:
        found = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            child_path = f"{path}.{key}"
            key_l = str(key).lower()
            if any(hint in key_l for hint in DIAGNOSTIC_KEY_HINTS):
                entry: Dict[str, Any] = {"path": child_path, "type": type(value).__name__}
                if isinstance(value, str):
                    entry["chars"] = len(value)
                    entry["prefix"] = value[:80] + ("..." if len(value) > 80 else "")
                elif isinstance(value, (int, float, bool)) or value is None:
                    entry["value"] = value
                elif isinstance(value, list):
                    entry["length"] = len(value)
                elif isinstance(value, dict):
                    entry["keys"] = list(value.keys())[:20]
                found.append(entry)
            collect_interesting_paths(value, child_path, found)
    elif isinstance(obj, list):
        for i, value in enumerate(obj[:50]):
            collect_interesting_paths(value, f"{path}[{i}]", found)
    return found


def image_generation_usage(response: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not isinstance(response, dict):
        return {}
    usage = ((response.get("tool_usage") or {}).get("image_gen") or {})
    return summarize_payload(usage) if isinstance(usage, dict) else {}


def diagnostic_verdict(response: Optional[Dict[str, Any]], diagnostics: Dict[str, Any]) -> str:
    usage = image_generation_usage(response)
    image_tokens = 0
    try:
        image_tokens = int(((usage.get("output_tokens_details") or {}).get("image_tokens")) or 0)
    except Exception:
        image_tokens = 0
    if diagnostics.get("captured_output_images"):
        return "Image data was captured by the helper."
    if image_tokens > 0 and not diagnostics.get("saw_image_events"):
        return (
            "The backend reports image tokens were generated, but the SSE stream exposed to this helper "
            "did not contain image-bearing events or final image data."
        )
    if image_tokens > 0:
        return "The backend reports image tokens were generated, but the helper did not recognize any returned image data."
    return "No generated image data or image-token usage was detected."


def call_responses_streaming(payload: Dict[str, Any]) -> Dict[str, Any]:
    payload = sanitize_codex_payload(dict(payload))
    payload["stream"] = True
    req = urllib.request.Request(
        f"{CODEX_BASE_URL}/responses",
        data=json.dumps(payload).encode("utf-8"),
        headers=codex_headers({"Accept": "text/event-stream"}),
        method="POST",
    )
    text_parts: List[str] = []
    completed = None
    events_seen = 0
    event_type_counts: Dict[str, int] = {}
    event_samples: List[Dict[str, Any]] = []
    interesting_events: List[Dict[str, Any]] = []
    interesting_paths: List[Dict[str, Any]] = []
    all_images: List[Dict[str, str]] = []
    function_calls: List[Dict[str, Any]] = []

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            for event in sse_events(resp):
                events_seen += 1
                etype = str(event.get("type") or "(no-type)")
                event_type_counts[etype] = event_type_counts.get(etype, 0) + 1

                event_images = extract_output_images(event)
                if event_images:
                    all_images.extend(event_images)

                event_function_calls = extract_function_calls_from_object(event)
                if event_function_calls:
                    function_calls.extend(event_function_calls)

                if len(event_samples) < 50:
                    event_samples.append(summarize_payload(event))

                paths = collect_interesting_paths(event)
                if paths:
                    interesting_paths.extend(paths[:50])

                if etype == "response.output_text.delta" and isinstance(event.get("delta"), str):
                    text_parts.append(event["delta"])
                elif etype == "response.completed":
                    completed = event.get("response")
                elif etype in ("response.failed", "error"):
                    raise HelperError(f"Upstream response failed: {json.dumps(event)[:3000]}")

                if (
                    len(interesting_events) < 40 and (
                        event_images or event_function_calls or
                        "image" in etype or
                        "function" in etype or
                        "tool" in etype or
                        "code" in etype or
                        "search" in etype or
                        "image_generation" in etype or
                        paths or
                        etype in {
                            "response.output_item.added",
                            "response.output_item.done",
                            "response.content_part.added",
                            "response.content_part.done",
                            "response.completed",
                        }
                    )
                ):
                    interesting_events.append(summarize_payload(event))
    except urllib.error.HTTPError as e:
        details = e.read().decode("utf-8", errors="replace")
        raise HelperError(f"Codex streaming request failed: HTTP {e.code}: {details}") from e
    except urllib.error.URLError as e:
        raise HelperError(f"Codex streaming request failed: {e}") from e

    final_text = "".join(text_parts)
    if not final_text and isinstance(completed, dict):
        final_text = extract_output_text(completed)

    if isinstance(completed, dict):
        all_images.extend(extract_output_images(completed))
        interesting_paths.extend(collect_interesting_paths(completed)[:100])
        function_calls.extend(extract_function_calls_from_object(completed))

    images = dedupe_images(all_images)
    function_calls = dedupe_function_calls(function_calls)
    diagnostics: Dict[str, Any] = {
        "helper_version": HELPER_VERSION,
        "events_seen": events_seen,
        "event_type_counts": event_type_counts,
        "event_samples": event_samples,
        "interesting_events": interesting_events,
        "interesting_paths": interesting_paths[:160],
        "saw_image_events": any("image" in k or "image_generation" in k for k in event_type_counts),
        "saw_tool_events": any("tool" in k or "function" in k or "code" in k or "search" in k for k in event_type_counts),
        "captured_output_images": len(images),
        "function_calls_detected": len(function_calls),
        "function_calls": summarize_payload(function_calls),
        "final_image_gen_usage": image_generation_usage(completed),
        "final_tool_usage": summarize_payload((completed or {}).get("tool_usage") if isinstance(completed, dict) else {}),
    }
    diagnostics["verdict"] = diagnostic_verdict(completed, diagnostics)

    return {
        "text": final_text,
        "events_seen": events_seen,
        "images": images,
        "response": completed,
        "diagnostics": diagnostics,
        "function_calls": function_calls,
        "helper_version": HELPER_VERSION,
    }


def call_responses_nonstreaming(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Pseudo-nonstreaming mode.

    The Codex subscription backend currently rejects stream=false with
    HTTP 400: "Stream must be set to true". So this function calls
    the streaming code and returns the collected final result.
    """
    return call_responses_streaming(payload)

def parse_data_url(url: str) -> Tuple[str, str, int]:
    match = DATA_URL_RE.match(url.strip())
    if not match:
        raise HelperError("One of the provided images is not a valid data URL.")
    mime = match.group("mime") or "image/png"
    b64 = match.group("data").replace("\n", "").replace("\r", "")
    try:
        base64.b64decode(b64, validate=True)
    except Exception as e:
        raise HelperError(f"Image data URL is not valid base64: {e}") from e
    return mime, url.strip(), int(len(b64) * 3 / 4)


def normalized_images(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    input_images = data.get("input_images") or []
    if not isinstance(input_images, list):
        raise HelperError("input_images must be a list.")
    if len(input_images) > 6:
        raise HelperError("Please send at most 6 images in one request.")

    normalized: List[Dict[str, Any]] = []
    for i, entry in enumerate(input_images):
        if isinstance(entry, dict):
            raw_data_url = entry.get("data_url") or entry.get("image_url") or ""
            name = entry.get("name") or f"image-{i + 1}"
        else:
            raw_data_url = str(entry or "")
            name = f"image-{i + 1}"
        mime, data_url, approx_bytes = parse_data_url(str(raw_data_url))
        normalized.append({"name": name, "mime_type": mime, "data_url": data_url, "approx_bytes": approx_bytes})
    return normalized


def build_image_content_item(image: Dict[str, Any], shape: str, detail: str) -> Dict[str, Any]:
    data_url = image["data_url"]
    if shape == "responses_no_detail":
        return {"type": "input_image", "image_url": data_url}
    if shape == "responses_with_detail":
        item = {"type": "input_image", "image_url": data_url}
        if detail in {"auto", "low", "high"}:
            item["detail"] = detail
        return item
    if shape == "responses_with_mime":
        item = {"type": "input_image", "image_url": data_url, "mime_type": image["mime_type"]}
        if detail in {"auto", "low", "high"}:
            item["detail"] = detail
        return item
    if shape == "chat_completions_style":
        return {"type": "image_url", "image_url": {"url": data_url}}
    if shape == "input_file_data_url":
        return {"type": "input_file", "filename": str(image["name"]), "file_data": data_url}
    raise HelperError(f"Unknown image payload shape: {shape}")



# ---------------------------------------------------------------------------
# Tool test support
# ---------------------------------------------------------------------------

def image_generation_tool_from_request(data: Dict[str, Any]) -> Dict[str, Any]:
    partial_images = data.get("partial_images")
    try:
        partial_images = int(partial_images)
    except Exception:
        partial_images = 1
    partial_images = max(0, min(3, partial_images))
    tool: Dict[str, Any] = {"type": "image_generation", "partial_images": partial_images}
    image_model = str(data.get("image_model") or "gpt-image-2").strip()
    if image_model:
        tool["model"] = image_model
    output_format = str(data.get("output_format") or "png").strip().lower()
    if output_format in {"png", "jpeg", "webp"}:
        tool["output_format"] = output_format
    size = str(data.get("image_size") or "auto").strip()
    if size:
        tool["size"] = size
    return tool


def web_search_tool_from_request(data: Dict[str, Any]) -> Dict[str, Any]:
    # The Codex backend's final responses expose tool_usage.web_search, but the accepted
    # tool schema may differ from the public API. This default matches the observed name.
    kind = str(data.get("web_search_tool_type") or "web_search").strip()
    if kind not in {"web_search", "web_search_preview"}:
        kind = "web_search"
    tool: Dict[str, Any] = {"type": kind}
    context_size = str(data.get("web_search_context_size") or "").strip()
    if context_size in {"low", "medium", "high"}:
        tool["search_context_size"] = context_size
    return tool


def code_interpreter_tool_from_request(data: Dict[str, Any]) -> Dict[str, Any]:
    # This may or may not be accepted by the Codex subscription route. It is a controlled test.
    tool: Dict[str, Any] = {"type": "code_interpreter", "container": {"type": "auto"}}
    memory_limit = str(data.get("code_interpreter_memory") or "").strip()
    if memory_limit:
        tool["container"]["memory_limit"] = memory_limit
    return tool




DEFAULT_AGENT_NAMES = ["Planner", "Implementer", "Critic", "Tester"]
SUPPORTED_CODEX_AGENT_MODELS = {
    "gpt-5.4",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
}


def normalize_codex_agent_model(value: Any) -> Tuple[str, Optional[str]]:
    """Clamp internal agent calls to model slugs this Codex route has accepted.

    The top-level model may ask for something like gpt-4.1 inside function args.
    That is a normal OpenAI API model family, but this ChatGPT/Codex subscription
    route has been accepting Codex-flavoured gpt-5.4 slugs. For the internal
    roundtable we deliberately force a known-good model instead of failing every
    agent turn.
    """
    requested = str(value or "").strip()
    if not requested:
        return DEFAULT_MODEL, None
    if requested in SUPPORTED_CODEX_AGENT_MODELS:
        return requested, None
    # Also tolerate dated concrete slugs but normalize them to the stable alias.
    for allowed in sorted(SUPPORTED_CODEX_AGENT_MODELS, key=len, reverse=True):
        if requested.startswith(allowed + "-"):
            return allowed, None
    return DEFAULT_MODEL, requested


def normalize_agent_names(value: Any) -> List[str]:
    if isinstance(value, str):
        raw = [x.strip() for x in re.split(r"[,;\n]+", value) if x.strip()]
    elif isinstance(value, list):
        raw = [str(x).strip() for x in value if str(x).strip()]
    else:
        raw = []
    cleaned: List[str] = []
    for name in raw:
        name = re.sub(r"[^A-Za-z0-9 _-]", "", name).strip()
        if name and name not in cleaned:
            cleaned.append(name[:40])
    return cleaned[:6] or DEFAULT_AGENT_NAMES[:]


def truncate_text(value: str, limit: int = 9000) -> str:
    value = str(value or "")
    if len(value) <= limit:
        return value
    return value[: limit // 2] + "\n\n[...middle truncated...]\n\n" + value[-limit // 2 :]


def compact_agent_result(result: Dict[str, Any]) -> Dict[str, Any]:
    diag = result.get("diagnostics") or {}
    return {
        "events_seen": diag.get("events_seen", result.get("events_seen", 0)),
        "event_type_counts": diag.get("event_type_counts", {}),
        "usage": (result.get("response") or {}).get("usage") if isinstance(result.get("response"), dict) else None,
    }


def call_plain_agent(model: str, instructions: str, prompt: str) -> Dict[str, Any]:
    # Use the same message-list shape as the working top-level requests.
    # The Codex subscription route is stricter than the public Responses API
    # about some fields, so avoid relying on string shorthand here.
    payload = {
        "model": model or DEFAULT_MODEL,
        "instructions": instructions,
        "input": [
            {
                "role": "user",
                "content": [{"type": "input_text", "text": prompt}],
            }
        ],
        "store": False,
    }
    return call_responses_streaming(payload)


def fallback_agent_turn(agent_name: str, role_hint: str, task: str, round_no: int, rounds: int, prior: str) -> str:
    """Deterministic fallback so the roundtable remains useful if an internal
    model call fails. This is still text-only and does not touch files or run
    commands.
    """
    task_short = re.sub(r"\s+", " ", task).strip()[:260]
    if agent_name == "Planner":
        return (
            f"For round {round_no}/{rounds}, keep the scope tiny: one static HTML page, one visible rule, "
            f"and one button-driven example. The task is: {task_short}. Define the learning goal first, then "
            "add only enough UI to show how condition, state, and action relate."
        )
    if agent_name == "Implementer":
        return (
            "Implement this as plain HTML, CSS, and a small inline script. Use a state object such as "
            "{hungry:true, seesFood:false}, show rule cards like IF hungry AND seesFood THEN eat, and let "
            "the Try button toggle one condition and update a sentence explaining the agent's decision."
        )
    if agent_name == "Critic":
        return (
            "Main risks: making the agent seem conscious, adding too many abstractions, or hiding the rule logic. "
            "Use explicit labels such as condition, rule, action, and result. Avoid network calls, storage, accounts, "
            "or generated code in the child-facing page."
        )
    if agent_name == "Tester":
        return (
            "Test manually: load the file offline, press Try several times, confirm each state change updates the "
            "same rule display, confirm keyboard access to the button, and check that all text stays readable on a phone. "
            "Success means a child can predict the next action before pressing Try."
        )
    if agent_name == "Synthesizer":
        return (
            "The safe direction is a static, transparent rule simulator: tiny scope, explicit state, visible rule, "
            "and one interaction. Build one page first, then add more rules only after the first rule is understandable."
        )
    return (
        f"As {agent_name}, I would keep the contribution text-only and safe: focus on {role_hint}. "
        f"For the task {task_short}, prefer a minimal static demo with visible rules and simple manual tests."
    )


def run_agent_roundtable(args: Dict[str, Any]) -> Dict[str, Any]:
    """Run a safe, text-only multi-agent roundtable.

    This function deliberately does not write files, run shell commands, or execute
    arbitrary Python. Each agent only receives text context and returns text.
    """
    task = str(args.get("task") or args.get("prompt") or "").strip()
    if not task:
        task = "Explore a small agentic programming demo and identify a safe next step."

    try:
        rounds = int(args.get("rounds", 2))
    except Exception:
        rounds = 2
    rounds = max(1, min(4, rounds))

    agents = normalize_agent_names(args.get("agents"))
    try:
        max_words = int(args.get("max_words_per_turn", 120))
    except Exception:
        max_words = 120
    max_words = max(40, min(300, max_words))

    # v14 deliberately ignores any model requested by the model/function call.
    # The public API model families and this Codex subscription route do not
    # accept the same slugs; allowing gpt-4.1 here repeatedly poisoned the
    # roundtable. Use a known-working Codex route model for all internal agents.
    requested_model = str(args.get("model") or "").strip()
    model = DEFAULT_MODEL
    overridden_model = requested_model if requested_model and requested_model != model else None

    transcript: List[Dict[str, Any]] = []
    call_diagnostics: List[Dict[str, Any]] = []

    base_instructions = (
        "You are one participant in a safe text-only multi-agent programming roundtable. "
        "Do not claim to have executed code, inspected files, modified files, or run shell commands. "
        "Focus on reasoning, design, risks, tests, and next actions. "
        f"Keep your response under {max_words} words."
    )

    for round_no in range(1, rounds + 1):
        for agent_name in agents:
            role_hint = {
                "Planner": "propose structure, milestones, and scope control",
                "Implementer": "suggest concrete implementation details and data structures",
                "Critic": "identify failure modes, security risks, ambiguity, and overreach",
                "Tester": "suggest small tests and observable success criteria",
                "Synthesizer": "summarize and reconcile the group discussion",
            }.get(agent_name, "contribute from your named perspective")

            prior = "\n".join(
                f"Round {x['round']} / {x['agent']}: {x['text']}"
                for x in transcript[-12:]
            )
            prompt = (
                f"Task:\n{task}\n\n"
                f"You are agent: {agent_name}.\n"
                f"Your role: {role_hint}.\n"
                f"Round: {round_no} of {rounds}.\n\n"
                f"Recent transcript:\n{prior or '(No prior messages.)'}\n\n"
                "Respond as this agent only. Be specific. Do not use markdown tables."
            )
            try:
                result = call_plain_agent(
                    model,
                    base_instructions + f" You are the {agent_name} agent.",
                    truncate_text(prompt),
                )
                text = str(result.get("text") or "").strip()
                if not text:
                    text = "(No text returned.)"
                transcript.append({"round": round_no, "agent": agent_name, "text": text})
                call_diagnostics.append({
                    "round": round_no,
                    "agent": agent_name,
                    "ok": True,
                    **compact_agent_result(result),
                })
            except Exception as e:
                err = f"{type(e).__name__}: {e}"
                fallback_text = fallback_agent_turn(agent_name, role_hint, task, round_no, rounds, prior)
                transcript.append({
                    "round": round_no,
                    "agent": agent_name,
                    "text": fallback_text,
                    "fallback_used": True,
                })
                call_diagnostics.append({
                    "round": round_no,
                    "agent": agent_name,
                    "ok": False,
                    "fallback_used": True,
                    "error": err,
                })

    transcript_text = "\n\n".join(
        f"Round {x['round']} — {x['agent']}:\n{x['text']}" for x in transcript
    )

    synthesis_prompt = (
        f"Task:\n{task}\n\n"
        f"Transcript:\n{truncate_text(transcript_text, 12000)}\n\n"
        "Produce a concise synthesis with: 1) what the agents agreed on, "
        "2) main unresolved risks, 3) a safe next implementation step. "
        "Do not claim any code was executed or files were changed."
    )
    synthesis = ""
    synthesis_diag: Dict[str, Any] = {}
    try:
        synth_result = call_plain_agent(
            model,
            "You are a careful synthesizer for a safe text-only multi-agent programming roundtable.",
            synthesis_prompt,
        )
        synthesis = str(synth_result.get("text") or "").strip()
        synthesis_diag = compact_agent_result(synth_result)
    except Exception as e:
        failed = [d for d in call_diagnostics if not d.get("ok")]
        fallback_note = " Some internal agent calls used deterministic fallback text because the Codex backend rejected or failed those subcalls." if failed else ""
        synthesis = (
            "The agents converged on a tiny static, text-only rule simulator. "
            "The safest next step is to build one standalone HTML file with a visible IF/THEN rule, "
            "a small state display, and one Try button that changes the state and explains the resulting action. "
            "Do not add file writing, shell commands, storage, accounts, or hidden automation yet."
            + fallback_note
        )
        synthesis_diag = {"ok": False, "fallback_used": True, "error": f"{type(e).__name__}: {e}"}

    return {
        "ok": True,
        "name": "run_agent_roundtable",
        "safe_mode": "text_only_no_files_no_shell_no_arbitrary_python",
        "effective_model": model,
        "requested_model": requested_model or None,
        "model_was_overridden": bool(overridden_model),
        "overridden_to": model if overridden_model else None,
        "task": task,
        "rounds": rounds,
        "agents": agents,
        "turn_count": len(transcript),
        "transcript": transcript,
        "transcript_text": transcript_text,
        "synthesis": synthesis,
        "agent_call_diagnostics": call_diagnostics,
        "synthesis_diagnostics": synthesis_diag,
    }

def local_function_tool_def(name: str) -> Dict[str, Any]:
    if name == "roll_dice":
        return {
            "type": "function",
            "name": "roll_dice",
            "description": "Roll N fair six-sided dice and return the individual rolls and total.",
            "parameters": {
                "type": "object",
                "properties": {
                    "count": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 10,
                        "description": "Number of dice to roll."
                    }
                },
                "required": ["count"],
                "additionalProperties": False,
            },
        }
    if name == "get_local_time":
        return {
            "type": "function",
            "name": "get_local_time",
            "description": "Return the current local time on the machine running the helper.",
            "parameters": {
                "type": "object",
                "properties": {
                    "label": {
                        "type": "string",
                        "description": "Optional label for the requested clock, such as 'helper machine'."
                    }
                },
                "required": [],
                "additionalProperties": False,
            },
        }
    if name == "run_agent_roundtable":
        return {
            "type": "function",
            "name": "run_agent_roundtable",
            "description": (
                "Run a safe text-only multi-agent programming roundtable. "
                "Agents can exchange text ideas, critique, and synthesize. "
                "They cannot write files, execute shell commands, or run arbitrary code."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "The programming/design task the agents should discuss."
                    },
                    "agents": {
                        "type": "array",
                        "description": "Optional list of 2 to 6 agent names.",
                        "items": {"type": "string"},
                        "minItems": 2,
                        "maxItems": 6
                    },
                    "rounds": {
                        "type": "integer",
                        "description": "Number of discussion rounds.",
                        "minimum": 1,
                        "maximum": 4
                    },
                    "max_words_per_turn": {
                        "type": "integer",
                        "description": "Approximate maximum words per agent turn.",
                        "minimum": 40,
                        "maximum": 300
                    }
                },
                "required": ["task"],
                "additionalProperties": False,
            },
        }
    raise HelperError(f"Unknown local function tool: {name}")

LOCAL_FUNCTION_NAMES = {"roll_dice", "get_local_time", "run_agent_roundtable"}


def coerce_json_object(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        if not value.strip():
            return {}
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {"value": parsed}
        except Exception:
            return {"raw": value}
    return {}


def run_local_function(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    if name == "roll_dice":
        try:
            count = int(args.get("count", 3))
        except Exception:
            count = 3
        count = max(1, min(10, count))
        rolls = [random.randint(1, 6) for _ in range(count)]
        return {"ok": True, "name": name, "count": count, "rolls": rolls, "total": sum(rolls)}
    if name == "get_local_time":
        now = _dt.datetime.now().astimezone()
        return {
            "ok": True,
            "name": name,
            "label": str(args.get("label") or "helper machine"),
            "iso": now.isoformat(),
            "human": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "timezone": now.tzname(),
            "utc_offset_seconds": int((now.utcoffset() or _dt.timedelta()).total_seconds()),
        }
    if name == "run_agent_roundtable":
        return run_agent_roundtable(args)
    return {"ok": False, "error": f"Unknown function {name}"}


def function_call_is_usable(raw_obj: Dict[str, Any], raw_args: Any) -> bool:
    """Return True only for function-call items ready to execute/replay.

    The SSE stream sends an early function_call item with status="in_progress"
    and an empty arguments string, then later sends the same call with
    status="completed" and the real JSON arguments. v12 treated both as real
    calls. v13 ignores incomplete empty fragments.
    """
    status = str(raw_obj.get("status") or "").strip().lower()
    if status in {"in_progress", "queued", "incomplete"}:
        if raw_args is None:
            return False
        if isinstance(raw_args, str) and not raw_args.strip():
            return False
    return True


def call_argument_score(call: Dict[str, Any]) -> int:
    args = call.get("arguments")
    if isinstance(args, dict):
        return len(args)
    return 0


def extract_function_calls_from_object(obj: Any, found: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    if found is None:
        found = []
    if isinstance(obj, dict):
        typ = obj.get("type")
        name = obj.get("name") or obj.get("function_name")
        raw_args = obj.get("arguments")
        if raw_args is None:
            raw_args = obj.get("args")
        if raw_args is None:
            raw_args = obj.get("parameters")
        if raw_args is None:
            raw_args = obj.get("input")
        call_id = obj.get("call_id") or obj.get("id") or obj.get("tool_call_id")
        if typ in {"function_call", "tool_call"} and isinstance(name, str) and function_call_is_usable(obj, raw_args):
            found.append({
                "type": str(typ),
                "name": name,
                "call_id": str(call_id or f"call_{len(found) + 1}"),
                "arguments": coerce_json_object(raw_args),
                "status": str(obj.get("status") or ""),
                "raw": summarize_payload(obj),
            })
        # Some streams put the function call inside an item field.
        for value in obj.values():
            extract_function_calls_from_object(value, found)
    elif isinstance(obj, list):
        for value in obj:
            extract_function_calls_from_object(value, found)
    return found


def dedupe_function_calls(calls: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    # Prefer the richest completed call for a given (call_id, name). This avoids
    # replaying both the empty streaming fragment and the completed call.
    best: Dict[Tuple[Any, Any], Dict[str, Any]] = {}
    order: List[Tuple[Any, Any]] = []
    for call in calls:
        key = (call.get("call_id"), call.get("name"))
        if key not in best:
            best[key] = call
            order.append(key)
            continue
        current = best[key]
        current_completed = str(current.get("status") or "").lower() == "completed"
        new_completed = str(call.get("status") or "").lower() == "completed"
        if (new_completed and not current_completed) or call_argument_score(call) > call_argument_score(current):
            best[key] = call
    return [best[key] for key in order]


def tool_test_name(data: Dict[str, Any]) -> str:
    value = str(data.get("tool_test") or "none").strip()
    allowed = {"none", "web_search", "image_generation", "code_interpreter", "roll_dice", "get_local_time", "run_agent_roundtable"}
    return value if value in allowed else "none"

def build_payload(data: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    prompt = str(data.get("prompt") or "").strip()
    if not prompt:
        raise HelperError("Missing prompt.")

    model = str(data.get("model") or DEFAULT_MODEL).strip()
    system = str(data.get("system") or "You are a concise helpful assistant.")
    images = normalized_images(data)
    shape = str(data.get("image_shape") or "responses_no_detail")
    detail = str(data.get("image_detail") or "auto")
    selected_tool_test = tool_test_name(data)

    if shape == "chat_completions_style":
        user_content: List[Any] = [{"type": "text", "text": prompt}]
    else:
        user_content = [{"type": "input_text", "text": prompt}]

    for image in images:
        user_content.append(build_image_content_item(image, shape, detail))

    message: Dict[str, Any] = {"role": "user", "content": user_content}
    if data.get("message_type"):
        message["type"] = "message"

    payload: Dict[str, Any] = {
        "model": model,
        "input": [message],
        "instructions": system,
        "store": False,
    }

    if data.get("include_input_image_url"):
        payload["include"] = ["message.input_image.image_url"]

    reasoning_effort = data.get("reasoning_effort")
    if reasoning_effort in {"low", "medium", "high", "xhigh"}:
        payload["reasoning"] = {"effort": reasoning_effort}

    tools: List[Dict[str, Any]] = []
    force_tool_choice: Optional[Dict[str, Any]] = None

    if selected_tool_test == "web_search":
        tools.append(web_search_tool_from_request(data))
    elif selected_tool_test == "image_generation" or data.get("generate_image"):
        tools.append(image_generation_tool_from_request(data))
        if data.get("force_image_tool") or data.get("force_tool"):
            force_tool_choice = {"type": "image_generation"}
    elif selected_tool_test == "code_interpreter":
        tools.append(code_interpreter_tool_from_request(data))
    elif selected_tool_test in LOCAL_FUNCTION_NAMES:
        tools.append(local_function_tool_def(selected_tool_test))
        if data.get("force_tool"):
            force_tool_choice = {"type": "function", "name": selected_tool_test}

    if tools:
        payload["tools"] = tools
    if force_tool_choice:
        payload["tool_choice"] = force_tool_choice

    payload = sanitize_codex_payload(payload)
    summary = {
        "helper_version": HELPER_VERSION,
        "model": model,
        "tool_test": selected_tool_test,
        "image_count": len(images),
        "image_shape": shape,
        "image_detail": detail,
        "message_type_added": bool(data.get("message_type")),
        "include_input_image_url": bool(data.get("include_input_image_url")),
        "generate_image": bool(data.get("generate_image") or selected_tool_test == "image_generation"),
        "partial_images": data.get("partial_images", 1),
        "force_tool": bool(data.get("force_tool")),
        "force_image_tool": bool(data.get("force_image_tool")),
        "approx_image_bytes_total": sum(int(x["approx_bytes"]) for x in images),
        "payload": summarize_payload(payload),
    }
    return payload, summary



def continue_with_local_function_results(first_result: Dict[str, Any], payload: Dict[str, Any], calls: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Continue a local function-call loop without previous_response_id.

    The public Responses API supports previous_response_id, but this Codex
    subscription backend currently rejects it. So v11 replays the relevant input
    items explicitly: original user input, the assistant function_call item(s),
    and the corresponding function_call_output item(s).
    """
    replay_items: List[Dict[str, Any]] = []
    original_input = payload.get("input") or []
    if isinstance(original_input, list):
        replay_items.extend(original_input)
    elif original_input:
        replay_items.append({"role": "user", "content": str(original_input), "type": "message"})

    outputs: List[Dict[str, Any]] = []
    replayed_calls: List[Dict[str, Any]] = []
    effective_calls = dedupe_function_calls([
        c for c in calls
        if isinstance(c, dict) and str(c.get("name") or "") in LOCAL_FUNCTION_NAMES
    ])
    for call in effective_calls[:5]:
        name = str(call.get("name") or "")
        args_obj = coerce_json_object(call.get("arguments") or {})
        call_id = str(call.get("call_id") or call.get("id") or f"call_{len(outputs) + 1}")
        call_item: Dict[str, Any] = {
            "type": "function_call",
            "name": name,
            "arguments": json.dumps(args_obj),
            "call_id": call_id,
            "status": "completed",
        }
        if call.get("id"):
            call_item["id"] = str(call.get("id"))
        replay_items.append(call_item)
        replayed_calls.append(call_item)

        if name not in LOCAL_FUNCTION_NAMES:
            result = {"ok": False, "error": f"Refusing to run unknown local function {name!r}."}
        else:
            result = run_local_function(name, args_obj)
        output_item = {
            "type": "function_call_output",
            "call_id": call_id,
            "output": json.dumps(result),
        }
        replay_items.append(output_item)
        outputs.append(output_item)

    follow_payload: Dict[str, Any] = {
        "model": payload.get("model") or DEFAULT_MODEL,
        "instructions": payload.get("instructions") or "Use the provided function_call_output items to answer the user.",
        "input": replay_items,
        "store": False,
    }
    if payload.get("tools"):
        follow_payload["tools"] = payload.get("tools")

    try:
        second_result = call_responses_streaming(follow_payload)
    except HelperError as e:
        first_result.setdefault("diagnostics", {})["local_function_loop"] = {
            "ran": True,
            "failed_on_followup": True,
            "error": str(e),
            "strategy": "explicit_replay_without_previous_response_id",
            "function_calls_from_first_response": summarize_payload(calls),
            "effective_function_calls": summarize_payload(effective_calls),
            "function_calls_replayed": summarize_payload(replayed_calls),
            "function_outputs_sent": summarize_payload(outputs),
            "follow_payload": summarize_payload(follow_payload),
        }
        return first_result

    second_result["local_function_results"] = outputs
    second_result["first_response"] = first_result.get("response")
    second_result["first_diagnostics"] = first_result.get("diagnostics")
    second_result.setdefault("diagnostics", {})["local_function_loop"] = {
        "ran": True,
        "strategy": "explicit_replay_without_previous_response_id",
        "function_calls_from_first_response": summarize_payload(calls),
        "effective_function_calls": summarize_payload(effective_calls),
        "function_calls_replayed": summarize_payload(replayed_calls),
        "function_outputs_sent": summarize_payload(outputs),
        "follow_payload": summarize_payload(follow_payload),
    }
    return second_result


class LocalCodexHandler(BaseHTTPRequestHandler):
    server_version = f"LocalCodexHelper/{HELPER_VERSION}"

    def log_message(self, fmt: str, *args: Any) -> None:
        if getattr(self.server, "quiet", False):
            return
        super().log_message(fmt, *args)

    def cors_origin(self) -> Optional[str]:
        origin = self.headers.get("Origin")
        allowed = getattr(self.server, "allowed_origins", set())
        if origin and origin in allowed:
            return origin
        return None

    def send_json(self, status: int, data: Dict[str, Any]) -> None:
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        origin = self.cors_origin()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        origin = self.cors_origin()
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.end_headers()

    def do_GET(self) -> None:
        try:
            if self.path.startswith("/health"):
                path = auth_path()
                self.send_json(
                    200,
                    {
                        "ok": True,
                        "helper": "local-codex-helper",
                        "version": HELPER_VERSION,
                        "bind": "127.0.0.1",
                        "auth_path": str(path),
                        "auth_file_exists": path.exists(),
                    },
                )
            elif self.path.startswith("/models"):
                self.send_json(200, list_models())
            else:
                self.send_json(404, {"ok": False, "error": "Not found"})
        except HelperError as e:
            self.send_json(400, {"ok": False, "error": str(e)})
        except Exception as e:
            self.send_json(500, {"ok": False, "error": f"Unexpected helper error: {e}"})

    def do_POST(self) -> None:
        try:
            if not self.path.startswith("/chat"):
                self.send_json(404, {"ok": False, "error": "Not found"})
                return
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length).decode("utf-8")
            data = json.loads(raw or "{}")
            payload, payload_summary = build_payload(data)
            mode = data.get("mode") or "streaming"
            if (data.get("generate_image") or tool_test_name(data) == "image_generation") and mode == "streaming":
                mode = "nonstreaming"
            result = (
                call_responses_nonstreaming(payload)
                if mode == "nonstreaming"
                else call_responses_streaming(payload)
            )

            selected_tool_test = tool_test_name(data)
            if selected_tool_test in LOCAL_FUNCTION_NAMES and data.get("auto_continue_functions", True):
                calls = result.get("function_calls") or []
                matching = dedupe_function_calls([c for c in calls if c.get("name") == selected_tool_test])
                if matching:
                    result = continue_with_local_function_results(result, payload, matching)
                else:
                    result.setdefault("diagnostics", {})["local_function_loop"] = {
                        "ran": False,
                        "reason": "No matching function calls were detected in the first response.",
                        "selected_tool_test": selected_tool_test,
                    }

            if "diagnostics" not in result:
                result["diagnostics"] = {
                    "helper_version": HELPER_VERSION,
                    "verdict": "No diagnostics were produced by the selected helper path.",
                }
            result["helper_version"] = HELPER_VERSION
            self.send_json(200, {"ok": True, "payload_summary": payload_summary, **result})
        except json.JSONDecodeError as e:
            self.send_json(400, {"ok": False, "error": f"Bad JSON: {e}"})
        except HelperError as e:
            self.send_json(400, {"ok": False, "error": str(e)})
        except Exception as e:
            self.send_json(500, {"ok": False, "error": f"Unexpected helper error: {e}"})


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Local-only helper for testing static pages with Codex ChatGPT auth.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host. Keep this as 127.0.0.1 unless you know exactly why not.")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument(
        "--allow-origin",
        action="append",
        default=[],
        help="Allowed browser Origin. Can be repeated. Defaults to local test origins only.",
    )
    parser.add_argument("--quiet", action="store_true", help="Reduce request logging.")
    args = parser.parse_args(argv)

    if args.host not in {"127.0.0.1", "localhost"}:
        print("Refusing to bind to a non-localhost interface. This helper protects a bearer token.", file=sys.stderr)
        return 2

    allowed = {
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:8080",
        "http://localhost:8080",
    }
    allowed.update(args.allow_origin)

    server = ThreadingHTTPServer((args.host, args.port), LocalCodexHandler)
    server.allowed_origins = allowed  # type: ignore[attr-defined]
    server.quiet = args.quiet  # type: ignore[attr-defined]

    print(f"Local Codex helper listening on http://{args.host}:{args.port}")
    print(f"Using auth file: {auth_path()}")
    print("Allowed browser origins:")
    for origin in sorted(allowed):
        print(f"  {origin}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
