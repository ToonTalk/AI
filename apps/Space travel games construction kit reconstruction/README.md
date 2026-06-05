# A Space Travel Games Construction Kit

A browser reconstruction of the original Imagine Logo "Space Travel Games
Construction Kit." Rebuilt to follow the original in spirit and detail.
Open `index.html` in a browser to run it (no plugin required).

Files: `index.html`, `styles.css`, `data.js` (all the narrative / gadget /
code text, recovered from the original `.IMP` projects) and `app.js` (logic).

## How it works

You are hired as a game developer and given a team of experts. You build the
games yourself by visiting the team to collect behaviours and ideas, then
dragging those behaviours onto the objects in the game.

- **The Director (CEO)** hires you in the intro and introduces the team.
- **Visit with your Team** to collect what you need - you usually have to visit
  more than once, and each teammate has more to say each time:
  - **Tist the Scientist** works out the physics (conservation of momentum, gravity).
  - **Jammer the Programmer** gives you the behaviour gadgets - but only after Tist
    has explained the physics.
  - **Signer**, your assistant game designer, suggests what the game should do.
  - **Ian** (history), **Mator** (art) and **Ound** (sound) add flavour and context.
- **Behaviour gadgets** start empty. Once a teammate gives you one, it appears in
  the Behaviour Gadgets panel. **Drag a gadget onto the back of the object it
  belongs to.** You can drop it on the wrong object on purpose - it will warn you
  and the game won't work right until you move it. Drag the × off a tag to remove it.
- **FLIP** shows the gadget's pseudo-Logo program (editable red parts marked);
  **HELP** gives the teammate's explanation; **SETTINGS** opens the sliders.
- **Gauges** are graphical dials (speed/distance/fuel etc.) that appear once the Gauges gadget is on the player object.

## The pedagogic loop: build, test, improve

This is the heart of the kit. You build an incomplete prototype and test it:

1. Visit Tist, then Jammer, to get the movement behaviours. Drag them onto the
   astronaut's back.
2. Click **Start Game**. No rocks are thrown until *you* throw them - tap the
   ← / → keys (or the throw buttons). The astronaut reaches the ship... but nothing
   happens.
3. Click **Stop**. Now a message explains the problem and offers a **Visit your
   team** button.
4. Signer suggests the four conditional actions (dock safely, dock too fast, out of
   rocks, out of air); Jammer then gives you the **Reached or Missed Ship Gadget**.
5. Attach it and the game is complete.

## Astronaut Rescue

Throw rocks left to drift right toward the ship; throw right to brake. Dock at or
below the safe docking speed (12 m/s) before running out of rocks or air. It's pure
conservation of momentum: a thrown rock changes the astronaut's velocity by
`-rockMass x rockSpeed / totalMass`.

## Lunar Lander

Switch games with the banner buttons. Visit the team to collect the Vertical
Velocity, Gravity and Thruster gadgets, then the Landing Action gadget after you
test. Use ↑/↓ (W/S) to set the throttle; the thruster fires projectiles downward several
times a second to push the lander up. The key to landing: keep your descent speed low
so you can always brake before the surface - watch the Descent dial. It is winnable with
fuel to spare.

**Record -> code -> auto-pilot:** click **● Record**, then **Start**, and fly. Your
throttle changes are recorded. **Stop**, then **Auto-pilot Code…** turns the
recording into editable Logo `schedule` code. Edit the numbers and **Run Auto-pilot**
to replay your (edited) landing automatically.

## Source files

The `original/` folder holds the files downloaded from the shared Drive: the
Imagine Logo `.IMP` projects, media assets, the old plugin launch pages, and the
Flash demo wrappers. The web app mines those originals rather than running the
obsolete plugin/EXE.
