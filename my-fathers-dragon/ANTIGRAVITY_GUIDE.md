# My Father's Dragon: Antigravity Development Guide

This document contains everything you need to build the game using Google Antigravity. It includes step-by-step instructions for using the IDE, followed by the game spec formatted for Antigravity's planning mode.

---

## Part 1: Step-by-Step Antigravity Instructions

### Step 1: Set Up Your Workspace

1. **Launch Antigravity** and sign in with your Google account
2. **Create a new workspace:**
   - Click "Open Folder" or use File → Open Folder
   - Create a new folder called `my-fathers-dragon`
   - Select it as your workspace
3. **Check your configuration:**
   - Model should be set to **Gemini 3 Pro** (default)
   - Set mode to **Agent-assisted development** (recommended for first project)
   - Terminal Policy: **Auto** (lets agent run safe commands)

### Step 2: Configure Planning Mode

1. Look for the **Planning dropdown** in the Agent panel (usually top-right area)
2. Select **"Plan"** mode (not "Fast")
   - Plan mode makes the agent create a detailed task breakdown before executing
   - This is essential for a multi-asset project like this game
3. You should see the agent panel ready to accept prompts

### Step 3: Give the Initial Prompt

Copy and paste the prompt from Part 2 below into the agent chat. The agent will:
1. Read and analyze the spec
2. Create a Plan Artifact (Markdown document) breaking down all tasks
3. Show you the plan and ask for confirmation before proceeding

**Important:** Review the plan before approving. Make sure it includes:
- Image generation tasks
- Audio generation tasks  
- Code implementation tasks
- Testing tasks

### Step 4: Monitor Progress

As the agent works:
- **Agent Manager panel** shows active tasks and their status
- **Artifacts panel** stores generated plans, logs, and outputs
- **Editor panel** shows files being created
- **Browser panel** (if enabled) shows live testing

You can:
- Add comments on Artifacts to guide the agent
- Pause and adjust if something looks wrong
- Ask clarifying questions in the chat

### Step 5: Asset Generation

The agent should generate images and audio. Watch for:
- Images appearing in an `/assets` or `/images` folder
- Audio files in an `/audio` folder
- If generation fails, see Troubleshooting below

### Step 6: Code Integration & Testing

After assets are ready, the agent will:
1. Create the React component structure
2. Import and integrate assets
3. Test in the built-in browser
4. Fix any bugs it discovers

### Step 7: Export Your Game

Once complete:
1. The main game file will likely be `App.jsx` or `Game.jsx`
2. Test it yourself in the browser panel
3. Export/copy the code for use elsewhere

---

## Troubleshooting

### "Image generation isn't working"
Antigravity's image generation may have limitations. Fallback plan:
1. Open [Google AI Studio](https://aistudio.google.com) in your browser
2. Use the image generation feature there with prompts from the spec
3. Download images to your workspace `/assets` folder
4. Tell Antigravity agent: "I've added images to /assets. Please integrate them."

### "Audio generation isn't working"
Same fallback approach:
1. Use AI Studio or another tool to generate audio
2. Place files in `/audio` folder
3. Instruct agent to integrate existing files

### "Agent seems stuck or confused"
- Break the task into smaller pieces
- Try: "Let's pause the current plan. First, just create the game state management."
- Use the Artifacts panel to review what's been done

### "Code has bugs"
- The browser panel should catch many issues automatically
- You can also say: "Test the tiger scene - verify ribbons solve the puzzle"
- Share specific error messages with the agent

---

## Part 2: Prompt for Antigravity

Copy everything below this line and paste it into Antigravity:

---

# PROJECT: My Father's Dragon - Inventory Puzzle Game

## Overview

Build a point-and-click inventory puzzle game as a single-file React artifact. Based on Ruth Stiles Gannett's 1948 children's book "My Father's Dragon."

**Core mechanic:** Player selects items from inventory and uses them on scene elements to solve puzzles. No combat—every solution uses lateral thinking and creative item use.

**Design principle:** Solutions should make the player smile. Humor comes from the gap between threat severity (hungry lions) and solution absurdity (pink lollipops).

---

## Task Dependencies

Execute tasks in this order:

```
PHASE 1: Asset Generation (do first, in parallel)
├── Task 1A: Generate scene background images (5 images)
├── Task 1B: Generate character sprite sheets (4 sprites)
├── Task 1C: Generate inventory icons (8 icons)
├── Task 1D: Generate voice audio files (~15 files)
└── Task 1E: Generate sound effects (~8 files)

PHASE 2: Code Implementation (after Phase 1 complete)
├── Task 2A: Create game state management
├── Task 2B: Create UI components (SceneDisplay, Inventory, DialogueBox)
├── Task 2C: Implement scene logic and puzzle solutions
└── Task 2D: Integrate all assets

PHASE 3: Testing & Polish (after Phase 2 complete)
├── Task 3A: Test each puzzle scene works correctly
├── Task 3B: Test wrong-item responses display properly
└── Task 3C: Verify full game flow from start to ending
```

---

## PHASE 1A: Scene Background Images

Generate 6 images in **classic children's book illustration style**—warm watercolor washes with ink outlines, 1940s-50s picture book aesthetic.

| Filename | Dimensions | Prompt |
|----------|------------|--------|
| `scene_mud.png` | 800x400 | "Children's book illustration, 1940s watercolor style with ink outlines, warm lighting. A treacherous muddy jungle path, deep brown sucking muck stretching across the trail, hanging vines, dense tropical foliage on both sides, sense of danger but also adventure" |
| `scene_tigers.png` | 800x400 | "Children's book illustration, 1940s watercolor style with ink outlines. Seven Bengal tigers lounging lazily across a jungle path, bored aristocratic expressions, tails draped and flicking, golden afternoon light filtering through canopy, blocking the way forward" |
| `scene_lions.png` | 800x400 | "Children's book illustration, 1940s watercolor style with ink outlines. A pride of seven lions in a jungle clearing, their manes magnificently tangled and messy, embarrassed postures, looking away from viewer, warm golden light" |
| `scene_crocodiles.png` | 800x400 | "Children's book illustration, 1940s watercolor style with ink outlines. A wide jungle river, crocodile backs visible above water like stepping stones stretching across, each crocodile looking upward expectantly with vain expressions, lush riverbanks" |
| `scene_dragon.png` | 800x400 | "Children's book illustration, 1940s watercolor style with ink outlines. A small sad baby dragon with blue scales and golden wings, tied with rope to a wooden post, river dock setting, looking forlorn but hopeful, soft evening light" |
| `scene_ending.png` | 800x400 | "Children's book illustration, 1940s watercolor style with ink outlines. A small boy riding a baby dragon flying over a vast ocean at sunset, seen from behind, soaring through golden and pink clouds, sense of freedom and adventure, wide open sky" |

---

## PHASE 1B: Character Sprite Sheets

Generate 4 sprite sheets. Each shows ONE character with THREE expressions side-by-side horizontally.

| Filename | Dimensions | Prompt |
|----------|------------|--------|
| `sprite_tiger.png` | 300x100 | "Character portrait sprite sheet, three tiger head expressions side by side, children's book illustration style. Left: bored/haughty expression with half-closed eyes. Center: intrigued/curious with raised eyebrow. Right: delighted/laughing with open mouth. Bengal tiger, expressive, warm colors" |
| `sprite_lion.png` | 300x100 | "Character portrait sprite sheet, three lion head expressions side by side, children's book illustration style. Left: grumpy/embarrassed with furrowed brow, messy mane. Center: hopeful/pleading with big eyes. Right: proud/magnificent with groomed flowing mane, confident smile" |
| `sprite_crocodile.png` | 300x100 | "Character portrait sprite sheet, three crocodile head expressions side by side, children's book illustration style. Left: demanding/menacing with narrowed eyes. Center: considering/thoughtful with tilted head. Right: vain/preening admiring itself, pleased expression" |
| `sprite_boris.png` | 200x100 | "Character portrait sprite sheet, two baby dragon head expressions side by side, children's book illustration style. Left: sad/tired with drooping eyes, blue scales. Right: joyful/free with bright eyes and big smile, golden wing visible" |

---

## PHASE 1C: Inventory Icons

Generate 8 simple, clean icons. Style: flat illustration, clear silhouettes, warm colors, transparent or light background.

| Filename | Size | Description |
|----------|------|-------------|
| `icon_gum.png` | 48x48 | Pack of chewing gum, simple rectangular pack |
| `icon_lollipop.png` | 48x48 | Pink lollipop on white stick |
| `icon_rubberbands.png` | 48x48 | Bundle of colorful rubber bands |
| `icon_ribbon.png` | 48x48 | Colorful hair ribbon, loosely coiled |
| `icon_comb.png` | 48x48 | Wooden comb with teeth |
| `icon_brush.png` | 48x48 | Bristle brush with handle |
| `icon_jackknife.png` | 48x48 | Small folding knife, partially open |
| `icon_toothpaste.png` | 48x48 | Tube of toothpaste |

---

## PHASE 1D: Voice Audio Files

Generate spoken dialogue. Each file should be 3-15 seconds.

### Tigers (voice: bored British aristocrat, languid drawl, each word an effort)

| Filename | Line | Direction |
|----------|------|-----------|
| `tigers_intro.mp3` | "Another traveler. How tedious. We're not going to eat you—too much effort. But we're certainly not moving either." | Maximum ennui, world-weary |
| `tigers_success.mp3` | "Oh! Oh, this is divine. Reginald, look at my tail. LOOK AT IT." | Sudden delight, genuine excitement breaking through |
| `tigers_wrong.mp3` | "That's not remotely interesting. Do try again." | Dismissive, bored |

### Lions (voice: deep but insecure, fishing for compliments, dramatic sighs)

| Filename | Line | Direction |
|----------|------|-----------|
| `lions_intro.mp3` | "Don't look at us. DON'T. It's been three weeks since the grooming monkey quit and we are a DISASTER." | Dramatic, embarrassed, almost wailing |
| `lions_success.mp3` | "You. Small human. You have a GIFT. Go, go with our blessing. Tell no one you saw us like this." | Grateful, dignified, hushed conspiracy |
| `lions_wrong.mp3` | "How would THAT help our manes? Think, child, think!" | Exasperated, desperate |

### Crocodiles (voice: sibilant, gossipy, words slide together, hint of menace)

| Filename | Line | Direction |
|----------|------|-----------|
| `crocs_intro.mp3` | "Toll bridge. Nothing's free, little morsel. Make us beautiful and you may pass. Fail, and... well." | Menacing but vain, trailing off ominously |
| `crocs_success.mp3` | "BOING. Hehehehe. BOING BOING. Oh, the others will be SO jealous." | Childlike glee, giggling, delighted |
| `crocs_wrong.mp3` | "We don't HAVE hair. Honestly." | Cold, offended, dripping with disdain |

### Boris the Dragon (voice: young, small, slightly squeaky, breathless)

| Filename | Line | Direction |
|----------|------|-----------|
| `boris_intro.mp3` | "Oh! Are you here to rescue me? Please, please—but quietly! The boar is a light sleeper and a heavy biter." | Whispered, hopeful, urgent |
| `boris_success.mp3` | "I'm Boris. I can never thank you enough. Now—hold on tight. And don't let go." | Grateful, determined, building to excitement |
| `boris_warning.mp3` | "Careful! The rope creaked. Try something else first." | Alarmed whisper |

### Elmer/Narrator (voice: young boy 9-10, earnest, practical, slight wonder)

| Filename | Line | Direction |
|----------|------|-----------|
| `elmer_mud.mp3` | "The gum stuck to my shoes with a satisfying squish. Mother would not approve." | Matter-of-fact, hint of mischief |
| `elmer_ending.mp3` | "And that is how my father met the dragon. What happened next is another story entirely." | Warm, storytelling tone, sense of wonder |

---

## PHASE 1E: Sound Effects

Generate short sound effects (1-3 seconds each unless noted).

| Filename | Description |
|----------|-------------|
| `sfx_select.mp3` | Soft click and rustle, like picking something from a bag |
| `sfx_use.mp3` | Satisfying "doing something" sound, gentle and positive |
| `sfx_wrong.mp3` | Gentle comedic "nope" - not harsh, almost cute |
| `sfx_solved.mp3` | Warm chime, sense of accomplishment, magical |
| `sfx_transition.mp3` | Soft whoosh, scene change feeling |
| `sfx_snore.mp3` | Deep rumbling boar snore, 5 seconds, loopable |
| `sfx_rope_creak.mp3` | Tense rope creaking sound, warning |
| `sfx_splash.mp3` | Water splash for crocodile scene ambiance |

---

## PHASE 2A: Game State Management

Create a React state structure using useReducer:

```javascript
const initialState = {
  currentScene: 'mud', // 'mud' | 'tigers' | 'lions' | 'crocodiles' | 'dragon' | 'ending'
  inventory: ['gum', 'lollipops', 'rubberbands', 'ribbons', 'comb', 'brush', 'jackknife', 'toothpaste'],
  selectedItem: null,
  sceneFlags: {
    mud: false,           // crossed successfully?
    tigers: false,        // distracted?
    lions: false,         // groomed?
    crocodiles: false,    // bribed?
    dragon_lubricated: false,  // toothpaste applied?
    dragon: false         // freed?
  },
  dialogue: null,         // { text: string, speaker: string } or null
  animalMood: 'default',  // 'default' | 'interested' | 'happy' - for sprite selection
  audioEnabled: true
};

// Reducer handles: SELECT_ITEM, USE_ITEM, SET_DIALOGUE, CLEAR_DIALOGUE, 
// ADVANCE_SCENE, SET_MOOD, TOGGLE_AUDIO
```

---

## PHASE 2B: UI Components

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│              SCENE IMAGE (800x400)                  │
│    [Character sprite overlaid, position varies]     │
│    [Clickable hotspot over main interactive area]   │
├─────────────────────────────────────────────────────┤
│              DIALOGUE BOX (2-3 lines)               │
│    Speaker name + dialogue text                     │
│    [Click to dismiss / auto-advance]                │
├─────────────────────────────────────────────────────┤
│  INVENTORY BAR                                      │
│  [gum] [lolly] [bands] [ribbon] [comb] [brush]     │
│  [knife] [paste]                    [🔊 audio btn] │
└─────────────────────────────────────────────────────┘
```

### Component Specifications

**SceneDisplay:**
- Shows current scene background image
- Overlays character sprite (position based on scene)
- Sprite frame changes based on `animalMood` state
- Entire scene area is clickable (triggers USE_ITEM if item selected)
- Cursor changes when item is selected

**DialogueBox:**
- Shows speaker name in bold/different color
- Shows dialogue text below
- Click anywhere to dismiss
- Plays associated audio file when dialogue appears

**InventoryBar:**
- Horizontal row of item icons
- Click to select (highlights with border/glow)
- Click again to deselect
- Selected item follows cursor or shows as "held"
- Audio toggle button at end

---

## PHASE 2C: Scene Logic & Puzzle Solutions

### Scene: Mud
- **Correct item:** gum
- **On success:** Play `elmer_mud.mp3`, set `sceneFlags.mud = true`, after 2 seconds advance to tigers
- **Wrong items (all others):** Show funny failure text, no state change

Failure texts:
- jackknife: "Stabbing the mud seems unlikely to help."
- lollipop: "You consider making the mud sweeter. This is not a useful thought."
- ribbons: "Decorating mud. Bold choice. Ineffective, but bold."
- comb/brush: "You cannot groom your way out of this."
- rubberbands: "The mud does not care about elasticity."
- toothpaste: "Minty mud is still mud."

### Scene: Tigers
- **Correct item:** ribbons
- **On success:** Play `tigers_success.mp3`, mood → 'happy', set flag, advance after delay
- **On interact (no item or wrong item):** Play `tigers_intro.mp3` first time, then `tigers_wrong.mp3`

Failure texts:
- jackknife: "You brandish the tiny knife. Seven tigers stare at you. One yawns."
- gum: "They chew it once, make a face, and spit it out. 'Pedestrian.'"
- lollipop: "Tigers, unlike lions, have some dignity. They sniff and turn away."
- comb/brush: "Tigers groom themselves, thank you very much."

### Scene: Lions
- **Correct items:** comb OR brush OR lollipops (any works)
- **On success:** Play `lions_success.mp3`, mood → 'happy', set flag, advance
- **On interact first time:** Play `lions_intro.mp3`

Failure texts:
- ribbons: "They have no tails to speak of. Well, they do, but that's not the POINT."
- rubberbands: "Rubber bands for their manes? They look at you with profound disappointment."
- jackknife: "What are you going to do, give them a haircut? Actually... no. Just no."
- gum: "They try it. They hate it. 'This is a grooming emergency, not a snack break.'"

### Scene: Crocodiles
- **Correct item:** rubberbands
- **On success:** Play `crocs_success.mp3`, mood → 'happy', set flag, advance
- **On interact first time:** Play `crocs_intro.mp3`

Failure texts:
- comb: "We don't HAVE hair." (play `crocs_wrong.mp3`)
- brush: "Are you MOCKING us?" 
- ribbons: "Hmm. Pretty. But not enough. We want something... bouncier."
- lollipop: "We cannot lick. We only chomp. Think again."

### Scene: Dragon
- **Two-step puzzle:**
  1. First, use toothpaste → sets `dragon_lubricated = true`, dialogue: "You squeeze toothpaste along the rope. It glistens silently."
  2. Then, use jackknife → if lubricated, success! If not, play `boris_warning.mp3` and show warning
- **On interact first time:** Play `boris_intro.mp3`
- **On success:** Play `boris_success.mp3`, advance to ending

Failure texts:
- Using jackknife without toothpaste: "The rope creaks loudly. The boar snorts. You freeze. Try something else first."
- ribbons: "Boris appreciates the thought but would prefer to not be tied up at all."
- Any other item: "That won't cut the rope. You need something sharp... and quiet."

### Scene: Ending
- Display ending image
- Play `elmer_ending.mp3`
- Show text: "And so Elmer flew away on the dragon's back, over Wild Island and out across the wide blue sea. Boris asked where they were going. Elmer realized he had never thought that far ahead. But that is another story entirely."
- Show "Play Again" button (resets all state)

---

## PHASE 2D: Asset Integration

- Import all images as modules or embed as base64
- Create an `ASSETS` object mapping IDs to file paths
- Create an `AUDIO` object with preloaded Audio elements
- Sprite sheets: use CSS `background-position` to show correct frame based on mood
  - mood 'default' → position 0
  - mood 'interested' → position -100px  
  - mood 'happy' → position -200px

---

## PHASE 3: Testing Checklist

Test each scenario:

### Mud Scene
- [ ] Gum works, advances to tigers
- [ ] All other items show unique failure text
- [ ] Audio plays on success

### Tigers Scene
- [ ] Intro dialogue plays on first interaction
- [ ] Ribbons work, tigers become happy
- [ ] Sprite changes to delighted expression
- [ ] Wrong items show failure text

### Lions Scene
- [ ] Intro dialogue plays
- [ ] Comb works
- [ ] Brush works (alternative solution)
- [ ] Lollipops work (alternative solution)
- [ ] Sprite changes on success

### Crocodiles Scene
- [ ] Intro dialogue plays
- [ ] Rubber bands work
- [ ] Wrong items trigger comb/hair joke where appropriate

### Dragon Scene
- [ ] Intro dialogue plays
- [ ] Jackknife alone triggers warning
- [ ] Toothpaste first, then jackknife = success
- [ ] Boar snore ambient sound plays

### Ending
- [ ] Image displays
- [ ] Narration plays
- [ ] Play Again button works, resets game completely

### General
- [ ] Inventory selection/deselection works
- [ ] Audio toggle works
- [ ] Scene transitions are smooth
- [ ] No console errors

---

## Style Guidelines

**Visual:** Warm, storybook feeling. Use soft shadows, rounded corners, gentle animations.

**Typography:** Serif font for dialogue (Georgia, Libre Baskerville). Sans-serif for UI elements.

**Colors:**
- Background: warm cream (#FDF6E3)
- Text: deep brown (#3D2914)  
- Accent: forest green (#2D5016)
- Highlight: golden yellow (#F4C430)

**Animations:**
- Item selection: gentle bounce
- Scene transition: fade (0.5s)
- Dialogue appearance: fade in from bottom
- Sprite mood change: quick crossfade

---

## Final Deliverable

A single React component file (`Game.jsx`) that:
- Renders the complete game
- Includes all assets (embedded or imported)
- Works standalone in a React environment
- Can be exported as a Claude/Gemini artifact

---

END OF SPEC
