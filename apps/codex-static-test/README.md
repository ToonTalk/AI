# Codex Local Apps v16

This folder uses **one shared Python helper** for both pages:

- `codex_static_test.html` — the general tool-test harness, fixed so `showPayload` is defined.
- `agents_think.html` — the kid-friendly "How Agents Think" app.
- `codex_local_helper.py` — the single shared local helper.

The helper is the same program the apps call at `http://127.0.0.1:8787`. Keeping one copy is cleaner: fixes and new local tools only need to be added once.

## Run

PowerShell window 1:

```powershell
cd C:\Users\toont\Documents\AI\apps\codex-local-apps-v16
$env:CODEX_HOME = "C:\Users\toont\.codex"
python codex_local_helper.py
```

PowerShell window 2:

```powershell
cd C:\Users\toont\Documents\AI\apps\codex-local-apps-v16
python -m http.server 8000
```

Open either page:

```text
http://127.0.0.1:8000/agents_think.html
http://127.0.0.1:8000/codex_static_test.html
```

In `codex_static_test.html`, click **Check helper** and confirm helper version `0.16`.
