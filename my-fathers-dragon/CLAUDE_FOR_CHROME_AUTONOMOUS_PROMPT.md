# Autonomous Game Creation Mission for Claude for Chrome

## Your Mission

You are helping Ken build a children's book-style point-and-click adventure game called "My Father's Dragon" using Google AI Studio. You will:

1. Navigate AI Studio's interface
2. Generate 6 scene images (save each one)
3. Generate the complete game code
4. Test that it works
5. Report back on what you accomplished

Ken will observe but you should work as autonomously as possible, asking him only when you're genuinely stuck or need a decision.

---

## Context

"My Father's Dragon" is a 1948 children's book by Ruth Stiles Gannett. A boy named Elmer rescues a baby dragon from Wild Island by cleverly using ordinary items (gum, lollipops, ribbons) to get past animals. The game captures this humor—every puzzle is solved through absurd lateral thinking, never violence.

---

## Phase 1: Setup and Orientation

### Step 1.1: Navigate to AI Studio
- You should already be on or navigate to: https://aistudio.google.com
- Look for the main interface where you can enter prompts
- Identify which Gemini model is selected (Gemini 3 Pro, 2.5 Pro, or similar is ideal)

### Step 1.2: Find the Image Generation Feature
- Look for options like "Generate image", "Imagen", or a media/image icon
- AI Studio may have this in the main prompt area, or as a separate tool
- If you can't find image generation, tell Ken: "I don't see image generation in AI Studio. Should I try a different approach?"

### Step 1.3: Prepare a Download Location
- When you generate images, you'll need to save them
- Ask Ken: "Where should I save the image files? Please open or create a folder."
- Alternatively, note that images will go to the default Downloads folder

---

## Phase 2: Generate Scene Images

Generate these 6 images ONE AT A TIME. After each generation:
1. Wait for the image to fully render
2. Download/save it with the specified filename
3. Verify the download completed
4. Then proceed to the next image

### IMAGE 1: Mud Scene
**Filename:** scene_mud.png
**Prompt to paste:**
```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with soft ink outlines, like illustrations from a vintage picture book.

Scene: A treacherous muddy jungle path. Deep brown sucking muck stretches across the trail, looking dangerous to cross. Hanging vines dangle from above. Dense tropical foliage on both sides in deep greens. Warm golden-green lighting filters through the canopy. The mood is adventurous—an obstacle to overcome.

Style: Landscape orientation, painterly, nostalgic, gentle but with a sense of mild peril.
```

### IMAGE 2: Tigers Scene
**Filename:** scene_tigers.png
**Prompt to paste:**
```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with soft ink outlines.

Scene: Seven Bengal tigers lounging lazily across a jungle path, completely blocking the way forward. They look supremely bored and aristocratic, like nobles who can't be bothered to move for anyone. Half-closed eyes, tails draped lazily. Golden afternoon light filtering through the jungle canopy above. The tigers aren't scary—they're just magnificently indifferent.

Style: Landscape orientation, painterly, humorous, warm colors.
```

### IMAGE 3: Lions Scene
**Filename:** scene_lions.png
**Prompt to paste:**
```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with soft ink outlines.

Scene: A pride of seven lions in a jungle clearing. Their manes are magnificently tangled, messy, and unkempt—they're clearly embarrassed about it. Some lions are trying to hide their manes with their paws, others looking away self-consciously. Warm golden savanna-like light. The mood is comedic—proud creatures having a very bad hair day and not wanting to be seen.

Style: Landscape orientation, painterly, humorous, expressive character faces.
```

### IMAGE 4: Crocodiles Scene
**Filename:** scene_crocodiles.png
**Prompt to paste:**
```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with soft ink outlines.

Scene: A wide jungle river that needs to be crossed. Multiple crocodile backs are visible above the water's surface like stepping stones stretching from one bank to the other. Each crocodile is looking upward with vain, self-important, expectant expressions—they clearly think very highly of themselves and expect to be flattered. Lush green riverbanks on either side. Dappled sunlight on the water.

Style: Landscape orientation, painterly, whimsical, the crocodiles should look vain not scary.
```

### IMAGE 5: Dragon Scene
**Filename:** scene_dragon.png
**Prompt to paste:**
```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with soft ink outlines.

Scene: A small baby dragon with blue scales and delicate golden wings, tied with thick rope to a wooden post on a river dock. The dragon looks sad, tired, but with a glimmer of hope in its eyes. Soft evening light with purple and orange tones. In the background, a large boar is sleeping near a hut. The mood is poignant—a magical creature held captive, waiting to be rescued.

Style: Landscape orientation, painterly, emotional, sympathetic protagonist.
```

### IMAGE 6: Ending Scene
**Filename:** scene_ending.png
**Prompt to paste:**
```
Generate an image in classic 1940s children's book illustration style—warm watercolor washes with soft ink outlines.

Scene: A small boy riding on the back of a baby blue dragon with golden wings, flying over a vast ocean at sunset. We see them from behind, soaring through golden, pink, and orange clouds. Below them is endless sparkling ocean. The feeling is pure freedom, joy, adventure, and the beginning of a wonderful friendship. Wide open sky stretching to the horizon.

Style: Landscape orientation, painterly, triumphant, beautiful, emotionally uplifting.
```

---

## Phase 3: Generate the Game Code

After all 6 images are saved, find or navigate to where you can generate code/apps in AI Studio. Look for:
- "Build" mode or tab
- A code generation or app creation feature
- Or simply use the chat/prompt interface if it can output React code

### GAME CODE PROMPT
**Paste this entire prompt:**

```
Create a complete, playable React component for a point-and-click inventory puzzle game called "My Father's Dragon."

## GAME OVERVIEW
Based on the classic 1948 children's book. Young Elmer Elevator must cross Wild Island to rescue Boris the baby dragon. He solves puzzles by using ordinary items in clever, absurd ways. The humor comes from the gap between scary obstacles (tigers!) and silly solutions (hair ribbons!). No violence—just wit.

## SCENES (in order)
1. **MUD** - A muddy path blocks the way
2. **TIGERS** - Seven bored aristocratic tigers won't move  
3. **LIONS** - Lions with messy manes are too embarrassed to let anyone pass
4. **CROCODILES** - Vain crocodiles demand tribute to use them as stepping stones
5. **DRAGON** - Boris is tied up, a boar guard sleeps nearby (two-step puzzle)
6. **ENDING** - Victory! Flying away on Boris

## INVENTORY ITEMS & SOLUTIONS
| Item | Icon | Solves | How |
|------|------|--------|-----|
| Chewing Gum | 🍬 | MUD | Stick to shoes to walk across |
| Hair Ribbons | 🎀 | TIGERS | They become obsessed with decorating their tails |
| Comb | 🪥 | LIONS | Groom their manes, restoring their pride |
| Rubber Bands | 🔗 | CROCODILES | They love the bouncy springy feeling |
| Toothpaste | 🦷 | DRAGON (step 1) | Lubricate the rope for silent cutting |
| Jackknife | 🔪 | DRAGON (step 2) | Cut the rope (only works AFTER toothpaste) |

## UI LAYOUT
```
┌────────────────────────────────────────────────┐
│                                                │
│            SCENE DISPLAY AREA                  │
│     (colored rectangle with scene name         │
│      until real images are added)              │
│                                                │
│         [ Click here to use item ]             │
│                                                │
├────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────┐ │
│ │  DIALOGUE BOX                              │ │
│ │  Speaker: "Dialogue text here..."          │ │
│ └────────────────────────────────────────────┘ │
├────────────────────────────────────────────────┤
│  [🍬] [🎀] [🪥] [🔗] [🦷] [🔪]    INVENTORY    │
│   Gum  Ribbon Comb Bands Paste Knife          │
└────────────────────────────────────────────────┘
```

## GAMEPLAY FLOW
1. Player sees a scene with animals/obstacle and reads intro dialogue
2. Player clicks an inventory item to select it (it becomes highlighted)
3. Player clicks the scene area to use the selected item
4. If CORRECT: Success dialogue plays, then auto-advance to next scene after 2 seconds
5. If WRONG: Funny failure dialogue plays, item stays selected, player tries again

## REQUIRED DIALOGUE (include ALL of these)

### MUD SCENE
- **Intro:** "The path ahead dissolves into deep, sucking mud. One wrong step and you'll sink up to your knees—or worse."
- **Success (gum):** "You chew the gum thoughtfully, then stick it to your shoes. It's disgusting. It's brilliant. You walk right across."
- **Wrong - ribbons:** "You could decorate the mud. It would still be mud, just fancier."
- **Wrong - comb:** "You cannot groom mud. This is a fact."
- **Wrong - other:** "That won't help you cross. Think stickier."

### TIGERS SCENE  
- **Intro:** "Seven Bengal tigers lounge across the path. One opens an eye. 'Another traveler. How tedious. We're not going to eat you—too much effort. But we're certainly not moving either.'"
- **Success (ribbons):** "You offer the ribbons. A tiger sniffs... then GASPS. 'Oh! Oh, this is DIVINE. Reginald, look at my tail. LOOK AT IT.' Within moments, all seven are comparing tail decorations. They don't even notice you slip past."
- **Wrong - gum:** "They chew it once, make a face of aristocratic disgust, and spit it out. 'Pedestrian.'"
- **Wrong - knife:** "You show them a tiny knife. Seven tigers stare at you. One yawns elaborately."
- **Wrong - other:** "The tigers look profoundly unimpressed. 'That's not interesting at all.'"

### LIONS SCENE
- **Intro:** "A pride of lions blocks the clearing. But something's wrong—they're hiding their faces. 'Don't LOOK at us!' one wails. 'The grooming monkey quit three weeks ago and we are a DISASTER.'"
- **Success (comb):** "You hold up the comb. Seven pairs of hopeful eyes lock onto it. Twenty minutes later, seven magnificent manes gleam in the sunlight. 'You,' the lead lion says with quiet dignity, 'have a GIFT. Go with our blessing. And tell NO ONE you saw us like this.'"
- **Wrong - ribbons:** "They glare. 'We don't need DECORATION. We need GROOMING. There's a difference.'"
- **Wrong - rubber bands:** "Rubber bands for their manes? The look of disappointment is physically painful."
- **Wrong - other:** "A lion sighs dramatically. 'How would THAT help our manes?'"

### CROCODILES SCENE
- **Intro:** "The river stretches wide. Crocodile backs form stepping stones across—but they're watching you. 'Toll bridge,' one says, sliding the words together. 'Nothing'sss free, little morsssel. Make usss beautiful and you may crosss. Fail, and... well.' It smiles with many teeth."
- **Success (rubber bands):** "You stretch a rubber band between two tails. BOING. A crocodile giggles—actually GIGGLES. 'Again! Again!' Soon they're all bouncing, utterly delighted. 'The othersss will be SO jealousss,' one sighs happily as you hop across their backs."
- **Wrong - comb:** "The lead crocodile's eye twitches. 'We don't HAVE hair. Honestly.'"
- **Wrong - ribbons:** "Interesting... pretty... but we want something more... bouncy."
- **Wrong - other:** "The crocodile yawns, showing every tooth. 'Not beautiful enough. Try again.'"

### DRAGON SCENE
- **Intro:** "There! A small blue dragon with golden wings, tied to a post. He sees you and his eyes go wide. 'Oh!' he whispers urgently. 'Are you here to rescue me? Please—but QUIETLY. The boar is a light sleeper and a HEAVY biter.'"
- **Success (toothpaste first):** "You squeeze toothpaste along the rope. It glistens. 'Clever,' Boris breathes. 'Now it won't make noise when you cut it!'"
- **Failure (knife without toothpaste):** "You saw at the rope. It CREAKS loudly. The boar snorts and shifts. You freeze. Boris's eyes are huge. 'Something to make it quieter first!' he hisses."
- **Success (knife after toothpaste):** "The knife slides through the lubricated rope like butter—silently. Boris stretches his wings for the first time in months. 'I'm Boris,' he whispers, tears in his dragon eyes. 'I can never thank you enough. Now—hold on tight. And don't let go.'"
- **Wrong - other:** "Boris shakes his head frantically. 'That won't cut rope! I need something SHARP!'"

### ENDING
- **Text:** "And so Elmer flew away on the dragon's back, over Wild Island and out across the wide blue sea. The wind tasted like freedom and adventure. 'Where are we going?' Boris asked. Elmer laughed. He had absolutely no idea. But that, dear reader, is another story entirely.

THE END

(Based on 'My Father's Dragon' by Ruth Stiles Gannett, 1948)"
- **Show a "🎉 Play Again" button that resets the game**

## VISUAL STYLE
- Background: warm cream (#FDF6E3)
- Text: deep brown (#3D2914)  
- Accent/highlights: forest green (#2D5016)
- Selected item: golden glow (#F4C430)
- Scene placeholders: use these colors until real images added:
  - Mud: brown (#8B4513)
  - Tigers: orange (#E07020)
  - Lions: golden (#DAA520)
  - Crocodiles: teal (#008080)
  - Dragon: purple dusk (#4A3B5C)
  - Ending: sunset pink (#FFB6C1)
- Rounded corners on all boxes
- Gentle drop shadows
- Storybook feeling

## TECHNICAL REQUIREMENTS
- Single React component, fully self-contained
- Use useState for: currentScene, selectedItem, dialogueText, dialogueSpeaker, dragonRopeLubricated
- Clicking inventory item selects it (or deselects if already selected)
- Clicking scene area with item selected triggers the use-item logic
- After success, wait 2 seconds then advance scene (except ending)
- Include all dialogue from above—the humor is essential!

## IMPORTANT
- Make it COMPLETE and PLAYABLE from start to finish
- Include ALL the dialogue specified above
- The dragon puzzle MUST require toothpaste before jackknife
- The ending MUST have a working Play Again button
- Test that the logic works: right items succeed, wrong items show funny messages

Build this now as a single, complete React component.
```

---

## Phase 4: Test the Game

After AI Studio generates the code:

1. **Look for a preview/run feature** - AI Studio should show a live preview
2. **Play through the entire game:**
   - Select gum → click mud scene → should succeed
   - Select ribbons → click tigers → should succeed
   - Select comb → click lions → should succeed
   - Select rubber bands → click crocodiles → should succeed
   - Select toothpaste → click dragon → should show intermediate success
   - Select jackknife → click dragon → should show final success and end
   - Click Play Again → should restart

3. **Test wrong answers too** - try using wrong items and verify funny dialogue appears

4. **Note any bugs** - if something doesn't work, tell AI Studio:
   "The [X] isn't working. When I [action], expected [Y] but got [Z]. Please fix."

---

## Phase 5: Report Back

When you've completed as much as possible, tell Ken:

1. **Images generated:** List which ones you successfully created and saved
2. **Game status:** Does the code work? Is it playable?
3. **Any issues:** What problems did you encounter?
4. **Files location:** Where the images were saved
5. **Next steps:** What Ken might need to do manually, if anything

---

## Troubleshooting Guide

### "I can't find image generation in AI Studio"
- Look for an "Imagen" tab or button
- Try typing "Generate an image of..." in the main prompt
- Ask Ken if he needs to enable a feature in settings

### "The image generation isn't working"
- Try simplifying the prompt
- Check if there are usage limits
- Tell Ken and suggest using a different tool for images

### "I can't find where to generate code"
- Look for "Build" mode
- Try the main chat interface—paste the code prompt there
- Some AI Studio setups may need a specific project type

### "The generated code has errors"
- Look for error messages in the preview
- Copy the error and paste it back asking for fixes
- Try asking for a simpler version first

### "The preview won't load"
- Look for a "Run" or "Preview" button
- Check if the code needs to be in a specific format
- Ask Ken to check browser console for errors

### "I'm stuck and don't know what to do"
- Take a screenshot of what you see
- Describe the problem to Ken
- Ask for guidance on how to proceed

---

## Final Notes

- **Work systematically** - one image at a time, save as you go
- **Be patient** - image generation can take 10-30 seconds each
- **Save frequently** - don't lose work
- **Ask Ken if truly stuck** - but try to problem-solve first
- **Have fun** - this is an experiment in AI collaboration!

Remember: Your goal is to end up with 6 saved scene images and a working game. Even if you can't complete everything, partial progress is valuable. Document what worked and what didn't.

Good luck! 🐉
