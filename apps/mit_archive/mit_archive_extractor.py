import os
import sys
import json
import re

# Reconfigure stdout to use utf-8
sys.stdout.reconfigure(encoding='utf-8')

root_dir = r"C:\Users\toont\Documents\MIT-AI-Lab"
output_dir = r"C:\Users\toont\.gemini\antigravity\scratch\mit_archive"
scratch_dir = r"C:\Users\toont\.gemini\antigravity\scratch"
os.makedirs(output_dir, exist_ok=True)
output_json_path = os.path.join(output_dir, "mit_archive.json")

def clean_text(text):
    # Strip binary garbage and control chars except tabs, newlines, and carriage returns
    # Also strip \x7f-\x9f to prevent parsing errors and clean up layout control characters
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    # Remove backspace-underlines or bolding tricks like "char\x08char"
    cleaned = re.sub(r'.\x08', '', cleaned)
    # Strip trailing whitespace on each line
    lines = [line.rstrip() for line in cleaned.splitlines()]
    return "\n".join(lines).strip()

def clean_printable_ascii_only(binary_data):
    # Extracts printable ASCII blocks from binary files (like ar8.letter)
    chars = []
    for b in binary_data:
        if 32 <= b <= 126 or b == 10 or b == 9 or b == 13:
            chars.append(chr(b))
        else:
            chars.append(' ')
    text = "".join(chars)
    text = re.sub(r' {4,}', ' ', text)
    return text

def clean_compiled_document(data_bytes):
    # If the file starts with 5 0xff bytes, skip the 6150 byte binary header
    if data_bytes.startswith(b'\xff\xff\xff\xff\xff'):
        data_bytes = data_bytes[6150:]
    # 1. Replace \x82 followed by any byte with a space
    cleaned = re.sub(b'\x82.', b' ', data_bytes)
    # 2. Strip XGP command \x81\x20 followed by two bytes
    cleaned = re.sub(b'\x81\x20..', b'', cleaned)
    # 3. Strip other \x81 commands (followed by one byte)
    cleaned = re.sub(b'\x81.', b'', cleaned)
    
    # Decode with latin1
    return cleaned.decode('latin1', errors='ignore')

def parse_rmail_content(content, folder_rel):
    # Splits an RMAIL or MAIL file into individual messages
    messages = []
    cleaned = clean_text(content)
    
    raw_blocks = re.split(r'\n{2,}(?=Date:|From:|MSG:|MSG:\*MSG|[A-Z0-9\-]+@[A-Z0-9\-]+\s+\d{2}/\d{2}/\d{2})', cleaned)
    if len(raw_blocks) <= 1:
        raw_blocks = re.split(r'\n(?=Date:)', cleaned)
        
    msg_id_counter = 1
    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue
            
        lines = block.splitlines()
        msg_date = ""
        msg_from = ""
        msg_to = ""
        msg_subject = ""
        body_lines = []
        
        in_headers = True
        
        its_header_match = re.match(r'^([A-Z0-9\-]+)@([A-Z0-9\-]+)\s+(\d{2}/\d{2}/\d{2})\s*(\d{2}:\d{2}:\d{2})?(.*)$', lines[0].strip(), re.IGNORECASE)
        if its_header_match:
            sender = its_header_match.group(1)
            host = its_header_match.group(2)
            date_str = its_header_match.group(3)
            time_str = its_header_match.group(4) or ""
            subj_extra = its_header_match.group(5) or ""
            
            msg_from = f"{sender} at MIT-{host}"
            msg_date = f"{date_str} {time_str}".strip()
            msg_subject = subj_extra.replace("Re:", "").strip() or "Journal Entry"
            lines = lines[1:]
            
        for line in lines:
            line_str = line.strip()
            if in_headers:
                if line.startswith("Date:") or line.startswith("Date :"):
                    msg_date = line.split(":", 1)[1].strip()
                elif line.startswith("From:"):
                    msg_from = line.split(":", 1)[1].strip()
                elif line.startswith("To:"):
                    msg_to = line.split(":", 1)[1].strip()
                elif line.startswith("Subject:"):
                    msg_subject = line.split(":", 1)[1].strip()
                elif line_str == "" or not (any(line.startswith(h) for h in ["Date:", "Date :", "From:", "To:", "Subject:", "Message-id:", "CC:", "cc:", "Message-ID:", "Reply-To:", "Received:", "DISTRIB:", "EXPIRES:", "MSG:"])):
                    in_headers = False
                    body_lines.append(line)
            else:
                body_lines.append(line)
                
        body = "\n".join(body_lines).strip()
        
        if not msg_from and not msg_date:
            first_line = lines[0].strip() if lines else ""
            journal_match = re.match(r'^([A-Z0-9\-]+)@([A-Z0-9\-]+)\s+(\d{2}/\d{2}/\d{2})\s+(\d{2}:\d{2}:\d{2})?', first_line, re.IGNORECASE)
            if journal_match:
                msg_from = f"{journal_match.group(1)} at MIT-{journal_match.group(2)}"
                msg_date = f"{journal_match.group(3)} {journal_match.group(4) or ''}".strip()
                msg_subject = "Journal entry / Note"
                body = "\n".join(lines[1:]).strip()
                
        if body or msg_from or msg_subject:
            if not msg_subject:
                first_body_line = body.splitlines()[0] if body.splitlines() else ""
                msg_subject = first_body_line[:50] + "..." if len(first_body_line) > 50 else first_body_line or "No Subject"
            
            messages.append({
                "id": f"mail_{folder_rel.replace(os.sep, '_')}_{msg_id_counter}",
                "folder": folder_rel,
                "date": msg_date or "Unknown Date",
                "from": msg_from or "Unknown Sender",
                "to": msg_to or "Ken Kahn",
                "subject": msg_subject,
                "body": body
            })
            msg_id_counter += 1
            
    return messages

def parse_letters_file(binary_data, folder_rel):
    # Splits by .begin_address and extracts letters cleanly
    text = clean_printable_ascii_only(binary_data)
    parts = re.split(r'\.begin_address', text, flags=re.IGNORECASE)
    
    letters = []
    for idx, part in enumerate(parts[1:]):
        if not re.search(r'\.end_address', part, re.IGNORECASE):
            continue
        
        addr_part, rest = re.split(r'\.end_address', part, maxsplit=1, flags=re.IGNORECASE)
        addr = addr_part.strip()
        
        # Clean address lines, keeping newlines
        addr_lines = [line.strip() for line in addr.splitlines() if line.strip()]
        addr_clean = "\n".join(addr_lines)
        
        greeting = ""
        body = ""
        
        if re.search(r'\.begin_text', rest, re.IGNORECASE):
            greeting_part, body_rest = re.split(r'\.begin_text', rest, maxsplit=1, flags=re.IGNORECASE)
            greeting = greeting_part.strip()
            if re.search(r'\.end_text', body_rest, re.IGNORECASE):
                body = re.split(r'\.end_text', body_rest, maxsplit=1, flags=re.IGNORECASE)[0].strip()
            else:
                body = body_rest.strip()
        else:
            greeting = rest.strip()
            
        greeting = re.sub(r'\s+', ' ', greeting).strip()
        greeting = re.sub(r'^\s*[\.\-\*]+', '', greeting).strip()
        
        body_clean = re.sub(r'^\s*[\.\-\*]+', '', body).strip()
        body_clean = re.sub(r'\n\s+', '\n', body_clean)
        
        letters.append({
            "id": f"letter_{folder_rel.replace(os.sep, '_')}_{idx+1}",
            "folder": folder_rel,
            "recipient": addr_clean,
            "salutation": greeting or "Dear Recipient,",
            "body": body_clean
        })
        
    return letters

def parse_doc_file(content, filename, folder_rel):
    # Cleans up PUB documents and extracts headers/titles
    cleaned = clean_text(content)
    
    title = None
    
    # Custom titles for known files in the archive to give a premium presentation
    custom_titles = {
        "2500.1": "Turtle Terminal (TT2500) Logo Drawing Procedures",
        "film.3": "Historical CRT and TV Film Recording Calibration Log (1979)",
        "film.tests": "Historical CRT and TV Film Recording Calibration Log (1979)",
        "ts.7": "Mechanizing Temporal Knowledge (Research Draft)",
        "ts.paper": "Mechanizing Temporal Knowledge (Research Paper)",
        "fan.zine": "Science Fiction Fanzine Revival Announcement (NYEKAS)",
        "fannie.scrab": "Interactive Scrabble Game Layout (Fannie)",
        "fancy.196": "Fancy Document Print Layout & Formatting Rules",
        "care.1": "MIT-AI systems to MacLisp File Transfer Log (1)",
        "cared.1": "DecSystem-20 to Tape Backup Commands Script (cared)",
        "caref.3": "MacLisp Actor System File Transfer Log (3)",
        "carer.6": "MacLisp Actor Environment File Transfer Log (6)",
        "carfas.2": "Compiled FASL Files Transfer Script Log (2)",
        "carfsd.1": "Compiled FASL Files Transfer Script Log (1)"
    }
    
    fn_lower = filename.lower()
    if fn_lower in custom_titles:
        title = custom_titles[fn_lower]
        
    # Heuristic 1: Look for .every heading([fb]Title[fr], ...
    if not title:
        heading_match = re.search(r'\.every heading\(\[fb\]([^\[\]]+)\[fr\]', cleaned, re.IGNORECASE)
        if heading_match:
            title = heading_match.group(1).strip()
        
    # Heuristic 2: Look for [fb]Title[fr] centered/large in first 2000 chars
    if not title:
        fb_match = re.search(r'\[fb\]([^\[\]\(\)\n]+)\[fr\]', cleaned[:2000])
        if fb_match:
            cand = fb_match.group(1).strip()
            if len(cand) < 100 and "draft" not in cand.lower() and "bibliography" not in cand.lower():
                title = cand
                
    # Heuristic 3: Look for .ce or .once center followed by title in first 2000 chars
    if not title:
        ce_match = re.search(r'\.ce\s*\n([^\n]+)', cleaned[:2000], re.IGNORECASE)
        if ce_match:
            title = ce_match.group(1).strip()
            
    # Heuristic 4: Existing line check in first 30 lines
    if not title:
        lines = cleaned.splitlines()
        for line in lines[:30]:
            line_strip = line.strip()
            if line_strip.startswith('.sec '):
                title = line_strip[5:].strip()
                break
            elif "title" in line_strip.lower() or "draft" in line_strip.lower():
                title = line_strip
                break
                
    if not title or len(title) > 120 or title.strip().startswith(('.', ';')):
        title = filename
            
    return {
        "id": f"doc_{folder_rel.replace(os.sep, '_')}_{filename.replace('.', '_')}",
        "filename": filename,
        "folder": folder_rel,
        "title": title,
        "body": cleaned
    }

def get_lisp_category(filename):
    lower_file = filename.lower()
    ani_prefixes = ['cindy.', 'choose.', 'cpoint.', 'sugest.', 'sugrel.', 'sumcom.', 
                    'cosug.', 'dichar.', 'decla2.', 'declar.', 'diani', 'panim', 'pnut']
    if any(lower_file.startswith(prefix) for prefix in ani_prefixes):
        return "Ani"
    diag_prefixes = ['diagrm.', 'diagrm_92']
    if any(lower_file.startswith(prefix) for prefix in diag_prefixes):
        return "Diagrammer"
    return "Director"

def get_lisp_description(filename, content, category):
    lower_file = filename.lower()
    
    prefix_map = {
        "#comp": "MacLisp actor compilation engine. Translates high-level actor behavior rules into optimized MacLisp functions.",
        "#save": "State preservation utility. Handles checkpointing, serializing, and saving the current state of Director's simulation.",
        "$demos": "Demonstration selector script. Loads and coordinates various predefined animation scripts and visual demos for Director.",
        "-aques": "Director interrupt handler and question-prompting utility. Disables standard system interrupts to prevent session corruption.",
        "-ques": "Director interrupt handler and question-prompting utility. Disables standard system interrupts to prevent session corruption.",
        "4hex": "Director visual utility for 4-coordinate hex grids. Sets up coordinate offsets and distance functions.",
        "_lisp_": "MacLisp environment initialization script. Sets up compilation flags, package settings, and loads basic system utility files.",
        "abbrev": "MacLisp abbreviation expansion system. Maps short command mnemonics to full functions for interactive development.",
        "actcom": "Actor comparison utility. Analyzes differences in behavior definitions and states between two distinct actor models.",
        "action": "Ani planning executor. Interprets planning structures and invokes corresponding actor behaviors within Director.",
        "actors": "Core actor class definitions. Implements fundamental behavior protocols, message passing, and properties for Director actors.",
        "aface": "Visual face actor definitions. Implements rendering routines for facial expressions and mouth movements.",
        "anima": "Core animation engine scheduler and event loop. Manages timer ticks and parallel message scheduling for Director.",
        "animov": "Movie projection utility. Sets up movie file pathways and coordinates playback frames on visual terminals.",
        "aninit": "Ani subsystem bootstrap loader. Initializes the Ani planner on top of the Director actor system.",
        "apoly": "Polygon drawing utilities. Implements mathematical vector rendering for multi-sided geometric shapes.",
        "ask": "The fundamental 'ask' macro. Implements context switching for messages sent between actors.",
        "body": "Visual anatomy manager. Coordinates rendering and movement for sub-parts of composite character bodies.",
        "bparts": "Visual anatomy manager. Coordinates rendering and movement for sub-parts of composite character bodies.",
        "box": "Diagrammer box primitives. Defines properties, bounding coordinates, and labels for diagram nodes.",
        "cc": "Compiler helper routines. Manages fast assembly-level code paths for actor interactions.",
        "char": "Ani character behavior database. Binds character descriptors (e.g. evil, shy) to procedural rule templates.",
        "chocho": "Ani decision engine. Collects suggestions, resolves constraints, and picks scene execution methods.",
        "chomet": "Ani decision engine. Collects suggestions, resolves constraints, and picks scene execution methods.",
        "choose": "Ani decision engine. Collects suggestions, resolves constraints, and picks scene execution methods.",
        "cindy": "Ani script defining character behaviors and constraints for the Cinderella animation.",
        "circs": "Circle drawing package. Employs turtle graphic vectors to draw curved shapes and circles.",
        "color": "Color TV driver settings. Sets background properties and color mapping vectors for CRT monitors.",
        "compar": "Character comparison planner. Analyzes traits of scene characters to determine optimal visual positioning.",
        "convey": "Ani presentation planner. Translates high-level character emotions and goals into suggestive physical motions.",
        "cosug": "Co-suggestion collector. Gathers, weighs, and aggregates planning suggestions from different character roles.",
        "cp": "Choice point utility. Manages backtracking markers and decision states during story generation.",
        "cpoint": "Ani choice-point backtracking manager. Resolves scene planning conflicts by restoring previous search frames.",
        "csumry": "Co-suggestion summary engine. Groups visual suggestions by character action categories to simplify optimization.",
        "datest": "Ani testing module. Loads experimental scene rules and validates constraint satisfaction solvers.",
        "decla2": "MacLisp compiler declaration flags. Optimizes function mappings and prevents double expansion of macros.",
        "declar": "MacLisp compiler declaration flags. Optimizes function mappings and prevents double expansion of macros.",
        "diagrm": "Diagrammer core engine. A constraint-based layout manager for drawing boxes, links, and text diagrams.",
        "dichar": "Ani visual character models. Bridges planning-level character roles with their Director representation.",
        "diani": "The core ANI story planner and constraint satisfaction engine.",
        "diguse": "Diagrammer demonstration script. Illustrates how to build interactive diagrams and route connection links.",
        "direct": "Director startup initialization. Defines system variables, paths, and starts the command listener.",
        "disact": "Display activity routines. Defines visual actor motions like walking, jumping, nodding, and gesturing.",
        "disply": "Ani rendering manager. Directs the active display of character changes, movements, and frame sequences.",
        "dl": "Director bootstrap loader. Coordinates Fasloading of required files on MacLisp/ITS systems.",
        "dscrp": "Descriptor planning definitions. Houses semantic definitions and suggestions for character attributes (e.g. good, ugly).",
        "dump": "Memory dump utility. Serializes the running Director or Ani environment to speed up subsequent load times.",
        "dumpa": "Memory dump utility. Serializes the running Director or Ani environment to speed up subsequent load times.",
        "elemnt": "Planning elements database. Defines comparison metrics and value mappings used by the Ani choice system.",
        "emote": "Emotion planning database. Maps character emotions to corresponding visual behaviors and movement modifications.",
        "face": "Face and visual geometry tests. Experiments with hierarchical sub-part coordinate relations in Director.",
        "lface": "Face and visual geometry tests. Experiments with hierarchical sub-part coordinate relations in Director.",
        "fastd": "Optimized Director environment setup. Loads high-speed mathematical routines and turtle graphics drivers.",
        "fdirct": "Optimized Director environment setup. Loads high-speed mathematical routines and turtle graphics drivers.",
        "fill": "Boundary filling library. Implements seed-fill and scanline algorithms to color closed vector areas.",
        "film": "Film recording driver. Manages camera triggering, frame rate configurations (e.g. 12 fps), and terminal sync.",
        "foo": "Testing scratchpad. Contains temporary function overrides used for debugging the Director event loop.",
        "gcirc": "Graphics circle package. Optimized rendering routines for vector circle shapes.",
        "glosug": "Global suggestion consolidator. Processes overarching scene constraints and coordinates character actions.",
        "gobble": "Text buffer formatting utilities. Adjusts console output margins, line lengths, and terminal page widths.",
        "ngob": "Text buffer formatting utilities. Adjusts console output margins, line lengths, and terminal page widths.",
        "goodys": "General Lisp utility library. Houses list operations, mathematical macros, and basic I/O helpers.",
        "help": "Director interactive help system. Resolves documentation requests and displays topic guides.",
        "inter": "Director command interpreter. Parses user command lines and executes corresponding actor movements.",
        "interf": "Ani-Director interface layer. Translates planning-level symbol relations into physical coordinates.",
        "ken.complr": "MacLisp compiler optimization configuration. Directs compiler properties for compiling Director files.",
        "ken.direct": "Ken Kahn's Director customizer. Tailors warning prompts and command line completion behaviors.",
        "ken.lisp": "Custom Lisp utilities. Collection of convenience macros and editor wrappers for Lisp development.",
        "ken.tags": "Source tag index file. Enables fast search and navigation across Lisp file definitions in the editor.",
        "lisp.": "ITS MacLisp initialization profile. Sets terminal types, who-line flags, and custom editor keybindings.",
        "lispm": "Lisp Machine configuration. Customizes ZWEI editor behavior and configures compatibility functions.",
        "lispq": "Compiler comment evaluator. Directs the Lisp parser to ignore label forms while recording position tags.",
        "lmd": "Lisp Machine compatibility loader. Resolves package namespaces and system driver paths.",
        "load": "System loading script. Defines load orders and performs Fasloads of all core source files.",
        "loops": "Iteration macro utilities. Implements structural loops and control flow structures for actor code.",
        "magic": "Dynamic color inks package. Coordinates cyclic color cycling of vectors to produce animations.",
        "movie": "Movie recording package. Captures and replays vector frame sequences on CRT terminals.",
        "mquick": "Fast loading optimizer. Speeds up loading of compiled functions by bypassing non-essential warnings.",
        "mrmach": "Mr. Machine demo. An interactive simulation of a mechanical toy demonstrating part hierarchy.",
        "nodes": "Decision tree node definitions. Represents choice points and backtrace routes in Ani's planner.",
        "nts.ngob": "Console formatting helpers. Text margin modifiers and tab calculators for clean console presentation.",
        "object": "Director graphics class. Implements physical coordinate states, movement headings, and turtle geometry.",
        "opdat": "Opcode data table. Lists numeric instructions and compilation macros for Lisp compilation.",
        "option": "Layout options solver. Modifies visual spread behaviors and grid alignments.",
        "panim": "MacLisp system definitions and setup for Director's actor-based animation.",
        "perfor": "Performer actor class. An advanced subclass of graphic objects with customizable movement rates.",
        "place": "Ani spatial positioning manager. Computes layout positions and movement duration estimates.",
        "pnut": "Ani helper functions and utilities for layout and list processing.",
        "poly": "Polygon actor definition. Coordinates multi-point vector rendering for custom user shapes.",
        "postpo": "Ani postponement manager. Decides if a constraint choice should be deferred for later resolution.",
        "prereq": "Constraint prerequisite solver. Evaluates if scene conditions are met, unmet, or unknown.",
        "qq": "Backquote macro expansion package. Provides compiler-level support for templates and macros.",
        "rb": "Red-Black tree or visual drawing test. Implements structured balance heuristics for node rendering.",
        "redef": "Dynamic redefinition helper. Permits renaming and reloading of functions during active simulations.",
        "relate": "Scene relationship database. Specifies constraints and layout suggestions for character groupings.",
        "rotate": "Vector rotation package. Implements coordinate trigonometry for rotating shapes around anchors.",
        "run": "Director execution script. Sets up initial scenes, boots actors, and starts animation playback.",
        "runfd": "ITS Lisp execution wrapper. Main bootstrap script for loading Director on ITS machines.",
        "scene": "Ani scene structure definitions. Formulates tasks, timelines, and sub-scenes for story sequences.",
        "screen": "Director screen manager. Connects actor vector coordinates to the physical terminal display.",
        "snow": "Particle simulation demo. Uses actor-based movements to simulate falling snow flakes.",
        "some": "Root system node. Defines the top-level parent actor from which all other actors inherit.",
        "sugcon": "Convey suggestion consolidator. Analyzes suggested movement methods to select the most appropriate.",
        "sugest": "Ani descriptor suggestion processor. Interprets personality, relationship, and emotional descriptors.",
        "sugrel": "Ani relationship solver. Directs suggestion calculations based on character-to-character relations.",
        "sumcom": "Ani comparison consolidator. Integrates findings from character comparisons to influence scene choices.",
        "teach": "Interactive Director tutorial. Loads educational documents and commands for learning the system.",
        "test4": "Director test suite. Validates message passing protocols and frame rates.",
        "timer": "Profiling timer utility. Tracks microsecond performance of actor updates and graphics rendering.",
        "trans": "Animation transition package. Defines camera panning, fading, and scene-to-scene cuts.",
        "turt": "Logo turtle graphics wrapper. Implements turtle movement syntax (e.g. forward, pendown) for Director.",
        "tvxgp": "XGP printer and TV layout tool. Handles vector dumps to graphics printers.",
        "zwei": "Lisp Machine ZWEI customizations. Maps custom keyboard commands and auto-completion bindings.",
        "}^rsv": "Lisp system primitives. Low-level MacLisp extensions and performance overrides for Director."
    }

    # Match longest prefix first
    for prefix in sorted(prefix_map.keys(), key=len, reverse=True):
        if lower_file.startswith(prefix):
            return prefix_map[prefix]
            
    # Fallback to comments if comments exist and are readable
    comments = []
    lines = content.splitlines()
    for line in lines[:15]:
        line_strip = line.strip()
        if not line_strip:
            continue
        if line_strip.startswith(';'):
            comment_text = re.sub(r'^;+\s*', '', line_strip).strip()
            if comment_text and not comment_text.startswith('-*-') and 'compiled' not in comment_text.lower():
                comments.append(comment_text)
        elif line_strip.startswith("'(") and ';' in line_strip:
            comment_text = line_strip.split(';', 1)[1].strip()
            comments.append(comment_text)
            
    comment_desc = " ".join(comments[:2]).strip()
    comment_desc = re.sub(r'[\(\)\{\}\[\]"\'`]+', '', comment_desc).strip()
    
    if comment_desc and len(comment_desc) > 8:
        comment_desc = comment_desc[0].upper() + comment_desc[1:]
        if not comment_desc.endswith('.'):
            comment_desc += '.'
        return comment_desc
        
    return f"Source code for the {category} system ({filename})."

def parse_lisp_file(content, filename, folder_rel):
    # Reads Lisp files and extracts function definitions
    cleaned = clean_text(content)
    
    # Matches Zetalisp/MacLisp function/form declarations
    defs = re.findall(r'\((defun|define-function|define-form|define-receiver|define-handler|defmacro|define)\s+([a-zA-Z0-9\-\+\*\/\?\!\<\>\&\%\_]+|\([a-zA-Z0-9\-\+\*\/\?\!\<\>\&\%\_]+)', cleaned, re.IGNORECASE)
    
    functions = []
    for dtype, dname in defs:
        dname = dname.replace('(', '').strip()
        functions.append(dname)
        
    seen = set()
    functions = [x for x in functions if not (x in seen or seen.add(x))]
    
    category = get_lisp_category(filename)
    return {
        "id": f"lisp_{folder_rel.replace(os.sep, '_')}_{filename.replace('.', '_')}",
        "filename": filename,
        "folder": folder_rel,
        "category": category,
        "description": get_lisp_description(filename, cleaned, category),
        "functions": functions,
        "code": cleaned
    }

def is_lisp_file(filename, content):
    lower_file = filename.lower()
    if any(lower_file.endswith(ext) for ext in ['.lisp', '.lmlisp', '.llisp']):
        return True
    lisp_prefixes = ['cindy.', 'choose.', 'cpoint.', 'sugest.', 'sugrel.', 
                     'sumcom.', 'cosug.', 'dichar.', 'decla2.', 'declar.', 'diagrm.', 'diguse.']
    if any(lower_file.startswith(prefix) for prefix in lisp_prefixes):
        return True
    
    # Check content for common Lisp markers
    content_no_comments = re.sub(r';.*', '', content[:1000])
    if re.search(r'\((defun|define-function|define-form|define-receiver|define-handler|defmacro|define|setq|alloc|cond|defvar)\s', content_no_comments, re.IGNORECASE):
        return True
    return False

def main():
    print("Starting MIT AI Lab Archive Extractor...")
    
    archive = {
        "emails": [],
        "letters": [],
        "docs": [],
        "lisp_files": []
    }
    
    doc_bases = ['areax', 'newtp', 'ca', 'sigacm', 'art215', '$inter', '$panim', '$pnut', 'ts', 'thesis', 'logo', 'fan', 'film', '2500']
    doc_extensions = ['.doc', '.pub', '.tit', '.title', '.propos', '.paper', '.papers', '.zine', '.scrab']
    
    for dirpath, dirnames, files in os.walk(root_dir):
        if '.git' in dirpath:
            continue
            
        folder_rel = os.path.relpath(dirpath, root_dir)
        if folder_rel == '.':
            continue
            
        # Group potential document files by base name
        dir_doc_files = []
        dir_emails = []
        dir_letters = []
        dir_lisp = []
        
        for file in files:
            full_path = os.path.join(dirpath, file)
            lower_file = file.lower()
            
            # Skip compile remnants
            if lower_file.endswith(('.fasl', '.unfasl', '.lap')) or file == '_file_.(dir)':
                continue
                
            # Emails
            if lower_file.endswith(('.rmail', '.mail')) or file in ('ken.mail', 'ken.rmail', '}msgs}.ken'):
                dir_emails.append(file)
            # Letters
            elif lower_file.endswith('.letter'):
                dir_letters.append(file)
            else:
                # Is it Lisp?
                try:
                    with open(full_path, 'rb') as f:
                        head = f.read(1000).decode('latin1', errors='ignore')
                except:
                    head = ""
                    
                if is_lisp_file(file, head):
                    dir_lisp.append(file)
                else:
                    # Check if it is a document
                    base, ext = os.path.splitext(lower_file)
                    is_doc = False
                    if ext in doc_extensions:
                        is_doc = True
                    elif ext.startswith('.'):
                        ext_val = ext[1:]
                        if ext_val.isdigit() and (base in doc_bases or any(base.startswith(db) for db in doc_bases)):
                            is_doc = True
                    if is_doc:
                        dir_doc_files.append(file)

        # 1. Process Emails
        for file in dir_emails:
            full_path = os.path.join(dirpath, file)
            try:
                with open(full_path, 'r', errors='ignore') as f:
                    content = f.read()
                emails = parse_rmail_content(content, folder_rel)
                archive["emails"].extend(emails)
                print(f"  Parsed {len(emails)} emails from {folder_rel}/{file}")
            except Exception as e:
                print(f"  Error parsing email {folder_rel}/{file}: {e}")

        # 2. Process Letters
        for file in dir_letters:
            full_path = os.path.join(dirpath, file)
            try:
                with open(full_path, 'rb') as f:
                    binary_data = f.read()
                letters = parse_letters_file(binary_data, folder_rel)
                archive["letters"].extend(letters)
                print(f"  Parsed {len(letters)} letters from {folder_rel}/{file}")
            except Exception as e:
                print(f"  Error parsing letters {folder_rel}/{file}: {e}")

        # 3. Process Lisp files
        for file in dir_lisp:
            full_path = os.path.join(dirpath, file)
            try:
                with open(full_path, 'r', errors='ignore') as f:
                    content = f.read()
                lisp_info = parse_lisp_file(content, file, folder_rel)
                archive["lisp_files"].append(lisp_info)
                print(f"  Parsed Lisp file {folder_rel}/{file} ({lisp_info['category']}) with {len(lisp_info['functions'])} functions")
            except Exception as e:
                print(f"  Error parsing Lisp {folder_rel}/{file}: {e}")

        # 4. Process Documents (with raw source selection)
        groups = {}
        for file in dir_doc_files:
            base, ext = os.path.splitext(file.lower())
            groups.setdefault(base, []).append(file)
            
        for base, group_files in groups.items():
            numeric_files = []
            other_files = []
            for gf in group_files:
                _, ext = os.path.splitext(gf.lower())
                if ext[1:].isdigit():
                    numeric_files.append((int(ext[1:]), gf))
                else:
                    other_files.append(gf)
            
            best_file = None
            if numeric_files:
                numeric_files.sort()
                best_file = numeric_files[-1][1]
            elif other_files:
                other_files.sort(key=lambda x: (
                    0 if x.lower().endswith(('.doc', '.papers', '.propos', '.paper')) else
                    1 if x.lower().endswith('.pub') else 2
                ))
                best_file = other_files[0]
                
            if best_file:
                full_path = os.path.join(dirpath, best_file)
                try:
                    with open(full_path, 'rb') as f:
                        data_bytes = f.read()
                    
                    # Check if file has compiled formatting
                    is_compiled = b"\x82" in data_bytes or data_bytes.startswith(b"\x81") or data_bytes.startswith(b";") or best_file.lower().endswith(('.doc', '.papers', '.paper', '.propos'))
                    
                    if is_compiled:
                        # Clean justification and position tags
                        content = clean_compiled_document(data_bytes)
                    else:
                        content = data_bytes.decode('latin1', errors='ignore')
                        
                    doc_info = parse_doc_file(content, best_file, folder_rel)
                    archive["docs"].append(doc_info)
                    print(f"  Parsed document {folder_rel}/{best_file} (cleaned: {is_compiled})")
                except Exception as e:
                    print(f"  Error parsing document {folder_rel}/{best_file}: {e}")

    # 5. Ingest Clean Scratch Lisp files
    scratch_lisps = [
        ("diani_clean.txt", "diani.lisp"),
        ("panim_clean.txt", "panim.lisp"),
        ("pnut_clean.txt", "pnut.lisp"),
        ("diagrm_92_clean.txt", "diagrm_92.lisp")
    ]
    
    for src_name, dest_name in scratch_lisps:
        src_path = os.path.join(scratch_dir, src_name)
        if os.path.exists(src_path):
            try:
                with open(src_path, 'r', errors='ignore') as f:
                    content = f.read()
                lisp_info = parse_lisp_file(content, dest_name, "scratch")
                archive["lisp_files"].append(lisp_info)
                print(f"  Ingested scratch Lisp file {dest_name} ({lisp_info['category']}) with {len(lisp_info['functions'])} functions")
            except Exception as e:
                print(f"  Error ingesting scratch Lisp {src_name}: {e}")
        else:
            print(f"  Scratch Lisp source {src_name} not found")

    # Remove duplicate emails
    seen_emails = set()
    unique_emails = []
    for email in archive["emails"]:
        key = (email.get("from", "").strip(), email.get("date", "").strip(), email.get("subject", "").strip(), email.get("body", "").strip())
        if key not in seen_emails:
            seen_emails.add(key)
            unique_emails.append(email)
    archive["emails"] = unique_emails

    # Remove duplicate letters
    seen_letters = set()
    unique_letters = []
    for letter in archive["letters"]:
        key = (letter.get("recipient", "").strip(), letter.get("salutation", "").strip(), letter.get("body", "").strip())
        if key not in seen_letters:
            seen_letters.add(key)
            unique_letters.append(letter)
    archive["letters"] = unique_letters

    # Remove duplicate docs
    seen_docs = set()
    unique_docs = []
    for doc in archive["docs"]:
        key = (doc.get("filename", "").strip(), doc.get("title", "").strip(), doc.get("body", "").strip())
        if key not in seen_docs:
            seen_docs.add(key)
            unique_docs.append(doc)
    archive["docs"] = unique_docs

    # Remove duplicate lisp files
    seen_lisp = set()
    unique_lisp = []
    for lf in archive["lisp_files"]:
        key = (lf.get("filename", "").strip(), lf.get("code", "").strip())
        if key not in seen_lisp:
            seen_lisp.add(key)
            unique_lisp.append(lf)
    archive["lisp_files"] = unique_lisp

    # Re-index IDs to ensure sequential uniqueness
    for i, email in enumerate(archive["emails"]):
        email["id"] = f"mail_{email['folder'].replace(os.sep, '_')}_{i+1}"
    for i, letter in enumerate(archive["letters"]):
        letter["id"] = f"letter_{letter['folder'].replace(os.sep, '_')}_{i+1}"
    for i, doc in enumerate(archive["docs"]):
        doc["id"] = f"doc_{doc['folder'].replace(os.sep, '_')}_{doc['filename'].replace('.', '_')}"
    for i, lf in enumerate(archive["lisp_files"]):
        lf["id"] = f"lisp_{lf['folder'].replace(os.sep, '_')}_{lf['filename'].replace('.', '_')}"

    # Save the database
    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(archive, f, indent=2, ensure_ascii=False)
        
    # Save public database version (contains only Lisp files)
    public_dir = os.path.join(output_dir, "public")
    os.makedirs(public_dir, exist_ok=True)
    public_json_path = os.path.join(public_dir, "mit_archive_public.json")
    public_archive = {
        "lisp_files": archive["lisp_files"]
    }
    with open(public_json_path, 'w', encoding='utf-8') as f:
        json.dump(public_archive, f, indent=2, ensure_ascii=False)
        
    print(f"\nExtraction complete! Data saved to: {output_json_path}")
    print(f"Public database saved to: {public_json_path}")
    print(f"Summary:")
    print(f"  Emails: {len(archive['emails'])}")
    print(f"  Letters: {len(archive['letters'])}")
    print(f"  Documents: {len(archive['docs'])}")
    print(f"  Lisp files: {len(archive['lisp_files'])}")

if __name__ == '__main__':
    main()
