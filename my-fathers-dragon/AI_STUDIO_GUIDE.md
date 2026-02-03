# My Father's Dragon: AI Studio + Claude for Chrome Guide

## Setup

1. **Open Google AI Studio:** https://aistudio.google.com
2. **Start Claude for Chrome** (click the extension icon, then "Start session")
3. **Tell Claude for Chrome:** "I'm going to build a game in AI Studio. I have a series of prompts to run. Please help me navigate the interface and manage the outputs."

---

## How This Will Work

AI Studio works best with focused, sequential prompts rather than one massive spec. We'll:

1. **Generate images** (save/download each one)
2. **Generate the game code** (with image placeholders)
3. **Test in the canvas**

Claude for Chrome can help you click buttons, navigate between features, and troubleshoot if something doesn't work as expected.

---

## Step 1: Set Up AI Studio

In AI Studio, look for:
- **"Create new"** or **"New prompt"** button
- Make sure **Gemini 3 Pro** (or 2.5 Pro) is selected as the model
- You may see options for "Chat", "Freeform", or "Build" — **"Build"** or **"Freeform"** work well for this

Tell Claude for Chrome: "Help me find where to create a new prompt and make sure Gemini Pro is selected."

---

## Step 2: Generate Scene Images

Copy and paste this prompt into AI Studio:

```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with ink outlines, like a vintage picture book.

Scene: A treacherous muddy jungle path. Deep brown sucking muck stretches across the trail. Hanging vines and dense tropical foliage on both sides. The mood is adventurous but slightly dangerous. Warm golden-green lighting filtering through the canopy.

Dimensions: Landscape format, wider than tall.
```

**After it generates:**
- Download/save the image as `scene_mud.png`
- Create a folder on your computer called `dragon-game-assets`
- Save all images there

**Then repeat with these prompts (one at a time):**

---

### Scene 2: Tigers

```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with ink outlines.

Scene: Seven Bengal tigers lounging lazily across a jungle path, completely blocking the way. They look bored and aristocratic, like they can't be bothered to move. Tails draped lazily, half-closed eyes. Golden afternoon light filtering through the jungle canopy. The tigers aren't threatening—just supremely indifferent.

Dimensions: Landscape format.
```
Save as: `scene_tigers.png`

---

### Scene 3: Lions

```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with ink outlines.

Scene: A pride of seven lions in a jungle clearing. Their manes are magnificently tangled and messy—they look embarrassed about it. Some are trying to hide their manes, others looking away self-consciously. Warm golden light. The mood is comedic—proud creatures having a very bad hair day.

Dimensions: Landscape format.
```
Save as: `scene_lions.png`

---

### Scene 4: Crocodiles

```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with ink outlines.

Scene: A wide jungle river. Crocodile backs are visible above the water like stepping stones stretching across to the other side. Each crocodile is looking upward with vain, expectant expressions—they clearly think highly of themselves. Lush green riverbanks on either side. Dappled light on the water.

Dimensions: Landscape format.
```
Save as: `scene_crocodiles.png`

---

### Scene 5: Dragon

```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with ink outlines.

Scene: A small baby dragon with blue scales and delicate golden wings, tied with rope to a wooden post on a river dock. The dragon looks sad and tired but hopeful. Soft evening light. In the background, a large boar is sleeping. The mood is poignant—a magical creature in captivity, waiting to be rescued.

Dimensions: Landscape format.
```
Save as: `scene_dragon.png`

---

### Scene 6: Ending

```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with ink outlines.

Scene: A small boy riding on the back of a baby blue dragon, flying over a vast ocean at sunset. We see them from behind, soaring through golden and pink clouds. The feeling is freedom, adventure, and the beginning of a friendship. Wide open sky, endless possibilities.

Dimensions: Landscape format.
```
Save as: `scene_ending.png`

---

## Step 3: Generate the Game Code

Once you have all images saved, paste this prompt to generate the game:

```
Create a React component for a point-and-click inventory puzzle game called "My Father's Dragon" based on the classic children's book.

GAME CONCEPT:
A young boy named Elmer must cross Wild Island to rescue a baby dragon. He solves puzzles by using ordinary items in clever, funny ways. No combat—just lateral thinking.

SCENES (in order):
1. MUD - A muddy path blocks the way
2. TIGERS - Seven bored tigers won't move
3. LIONS - Lions with messy manes are too embarrassed to let anyone pass
4. CROCODILES - Crocodiles demand tribute to cross the river
5. DRAGON - Boris the dragon is tied up, a boar guard sleeps nearby
6. ENDING - Victory screen

INVENTORY ITEMS:
- Chewing gum (solves MUD - stick to shoes)
- Hair ribbons (solves TIGERS - they love decorating their tails)
- Comb (solves LIONS - groom their manes)
- Rubber bands (solves CROCODILES - they love the bouncy feeling)
- Toothpaste (DRAGON step 1 - lubricate the rope)
- Jackknife (DRAGON step 2 - cut the rope quietly, only works after toothpaste)

UI LAYOUT:
- Top: Scene image area (use colored placeholder rectangles with scene names)
- Middle: Dialogue box showing character speech and narration
- Bottom: Inventory bar with clickable items

GAMEPLAY:
1. Click an inventory item to select it (highlight it)
2. Click the scene to use the selected item
3. If correct: Show success dialogue, advance to next scene
4. If wrong: Show funny failure dialogue, stay on scene

SAMPLE DIALOGUE:
- Tigers intro: "Another traveler. How tedious. We're not going to eat you—too much effort. But we're certainly not moving either."
- Tigers success: "Oh! Oh, this is divine. Look at my tail. LOOK AT IT."
- Wrong item on tigers: "That's not remotely interesting. Do try again."

STYLE:
- Warm cream background (#FDF6E3)
- Brown text (#3D2914)
- Storybook feeling with rounded corners and gentle shadows
- Include 2-3 funny "wrong item" responses per scene

Make it fully playable from start to ending. Include a "Play Again" button at the end.
```

---

## Step 4: Test and Iterate

The canvas should show a playable game. Test each scene:
- [ ] Can you select items from inventory?
- [ ] Does gum work on mud?
- [ ] Do ribbons work on tigers?
- [ ] Does comb work on lions?
- [ ] Do rubber bands work on crocodiles?
- [ ] Does toothpaste → jackknife work on dragon?
- [ ] Does ending show with Play Again button?

**If something's broken, tell AI Studio:**
```
The [specific thing] isn't working. When I [action], it should [expected result] but instead [actual result]. Please fix this.
```

---

## Step 5: Add Your Images (Enhancement)

Once the basic game works, you can ask AI Studio to modify the code to use your generated images. You'll need to either:

**Option A: Ask for base64 embedding**
```
I have scene images saved. Please modify the code so I can paste base64-encoded images for each scene. Add a configuration section at the top where I can replace placeholder strings with my image data.
```

**Option B: Use image URLs**
If you upload your images somewhere (Imgur, your own hosting), ask:
```
Please modify the code to load scene images from URLs. Here are my image URLs:
- Mud scene: [paste URL]
- Tigers scene: [paste URL]
[etc.]
```

---

## Troubleshooting

**"AI Studio doesn't have image generation"**
Try saying: "Generate an image of..." — if it doesn't work, you may need to enable Imagen in settings, or use a different Google tool for images.

**"The canvas/preview isn't showing"**
Look for a "Preview" or "Run" button. Or ask Claude for Chrome: "Help me find how to preview this React code."

**"The code has errors"**
Copy the error message and paste it back to AI Studio: "I'm getting this error: [paste error]. Please fix it."

**"I want to add sound effects"**
After the base game works:
```
Add sound effects to the game. Use the Web Audio API to play simple synthesized sounds:
- A soft click when selecting an inventory item
- A cheerful chime when solving a puzzle
- A gentle "bonk" sound for wrong answers
```

---

## Quick Reference: What Claude for Chrome Can Help With

Say things like:
- "Where is the button to generate images?"
- "How do I download this image?"
- "I don't see a preview of the code, help me find it"
- "This error appeared, what should I do?"
- "Click the 'Run' button for me"
- "Take a screenshot of what I'm seeing"

---

## Files Checklist

By the end, you should have:
- [ ] scene_mud.png
- [ ] scene_tigers.png
- [ ] scene_lions.png
- [ ] scene_crocodiles.png
- [ ] scene_dragon.png
- [ ] scene_ending.png
- [ ] Working game code in AI Studio canvas

---

Good luck! Remember, you can always come back to this chat if you get stuck.
