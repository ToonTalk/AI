"use strict";
/* =====================================================================
   Content for A Space Travel Games Construction Kit.
   Narrative, gadget, code and help text recovered from the original
   lunar589.IMP / lunar402b.IMP / diana.IMP project files.
   Loaded before app.js; these top-level consts are visible to it.
   ===================================================================== */

const CEO = { name: "the Director", role: "CEO", a: "assets/director_a.jpg", b: "assets/director_b.jpg" };
const TEAM = {
  signer:    { name: "Signer", role: "Assistant Game Designer", a: "assets/game_designer_a.jpg", b: "assets/game_designer_b.jpg" },
  scientist: { name: "Tist",   role: "Scientist",  a: "assets/scientist_a.jpg",  b: "assets/scientist_b.jpg" },
  programmer:{ name: "Jammer", role: "Programmer", a: "assets/programmer_a.jpg",  b: "assets/programmer_b.jpg" },
  historian: { name: "Ian",    role: "Historian",  a: "assets/historian_a.jpg",   b: "assets/historian_b.jpg" },
  animator:  { name: "Mator",  role: "Animator",   a: "assets/animator_a.jpg",    b: "assets/animator_b.jpg" },
  sound:     { name: "Ound",   role: "Sound",      a: "assets/sound_guy_a.jpg",   b: "assets/sound_guy_b.jpg" },
};
const TEAM_ORDER = ["signer", "scientist", "programmer", "historian", "animator", "sound"];

const STORY = [
  { who: null, text:
`Ever want to make a computer game?

Just click on the NEXT button and you'll get your chance to build some space travel games.

Don't know how to program or build games? Don't know anything about space travel? Don't worry, you'll have a team of experts to help you. Your first games will be very simple but if you keep with it you'll build some games to be proud of.

Building games is fun. Hard fun.

And while building your games you'll learn plenty of new things in new ways. Physics. Game design. Mathematics. History. Art. Computer programming. And more.

So go ahead. Click the NEXT button.` },
  { who: "ceo", text:
`Congratulations!

We've decided to hire you as a game developer. Your first assignment is to make a space game. Make it realistic and fun. And keep it simple.

The player is an astronaut who is adrift in space and will die if he or she doesn't get back to the ship.

I've assigned a team to help you. You'll need them to provide programs, artwork, and scientific and game design advice.` },
  { who: "ceo", team: true, text:
`Here is the team I've assigned to help you. Visit any of them at any time by clicking "Visit with your Team".

Jammer the Programmer writes the behaviour gadgets. Tist the Scientist works out the physics. Signer is your assistant game designer. Ian the Historian knows the real space history. Mator the Animator supplies the artwork. Ound handles sound.

You won't have any behaviour gadgets to start with. Go and visit your team - especially Tist and Jammer - to get what you need. They often have something new to say each time you visit.

Click NEXT to start building your first game.` },
];

const GADGETS = {
  /* ---- Rescue ---- */
  horizontalVelocity: {
    game: "rescue", target: "astronaut", name: "Horizontal Velocity Gadget", helpFrom: "scientist",
    tip: "Things can't move left or right without this behaviour. It belongs on the astronaut. It contains a program that defines horizontal motion at the current speed.",
    help: `Hi. So you want to know more about the HORIZONTAL VELOCITY GADGET?

It runs every 1/100th of a second. That is its sampling rate. It keeps adding the horizontal velocity to the horizontal position. It divides the velocity by 100 since the velocity is the number of meters per second the thing is moving.`,
    code:
`; [HORIZONTAL VELOCITY CODE]
; Updates my position from my velocity, 100 times a second.
; This code only applies to motion to the left or right.
repeat_every 1/100
   [change_my_horizontal_position_by
        my_horizontal_velocity / 100]`,
    settings: [],
  },
  horizontalRockThrowing: {
    game: "rescue", target: "astronaut", name: "Horizontal Rock Throwing Gadget", helpFrom: "programmer",
    tip: "Belongs on the astronaut. It lets her change her left/right speed by throwing rocks in the opposite direction.",
    help: `I'll be glad to tell you about the HORIZONTAL ROCK THROWING GADGET.

When the player throws a rock, it checks there are enough rocks left, reduces the remaining rock mass, changes the astronaut's velocity by the formula Tist gave me, and animates the rock flying away. Throw a rock one way and you move the other way - that's conservation of momentum.`,
    code:
`; [HORIZONTAL ROCK THROWING CODE]
; When the player throws a rock:
; This implements Newton's Third Law of Motion -
; for every action there is an equal and opposite reaction.
if my_horizontal_rocks_remaining >=
     value_of_slider_for_horizontal_rock_mass
   [change_my_horizontal_rocks_remaining_by
        -1 * value_of_slider_for_horizontal_rock_mass
    change_my_horizontal_velocity_by
        -1 * value_of_slider_for_horizontal_rock_mass
            * §value_of_slider_for_horizontal_rock_speed§
            / (value_of_slider_for_mass_without_rocks
               + my_horizontal_rocks_remaining)
    animate_horizontal_rock_moving_away]`,
    settings: [
      { key: "rockSpeed", label: "Speed a rock is thrown (m/s)", min: 20, max: 100, step: 1, value: 100,
        note: "The rocks are thrown at this speed. Faster rocks give a bigger push." },
      { key: "rockMass", label: "Mass of each rock (kg)", min: 1, max: 21, step: 1, value: 4,
        note: "The maximum mass of a horizontal rock is 21 kilograms. Smaller rocks give finer control." },
      { key: "initialRocks", label: "Initial total mass of rocks (kg)", min: 10, max: 60, step: 1, value: 42,
        note: "The astronaut starts out with horizontal rocks of this total mass." },
    ],
  },
  reachedShip: {
    game: "rescue", target: "astronaut", name: "Reached or Missed Ship Gadget", helpFrom: "programmer",
    tip: "Belongs on the astronaut. Without it she just slides past the ship and the game never ends. With it you decide what happens when she docks, crashes, runs out of rocks, or runs out of air.",
    help: `The REACHED SHIP GADGET has four code boxes. REACHED SHIP SAFELY and REACHED SHIP BUT TOO FAST can be changed with the SETTINGS button. OUT OF AIR and OUT OF ROCKS can be changed by editing them. The red parts can be changed without knowing how to program.`,
    fourBoxes: true,
    codeBoxes: [
      { title: "REACHED SHIP SAFELY", code:
`when [and [reached_ship]
          [my_speed <= §value_of_slider_for_safe_docking_speed§]]
     [describe_docking "|Good job! You reached your ship.|
      stop_game]` },
      { title: "REACHED SHIP BUT TOO FAST", code:
`when [and [reached_ship]
          [my_speed > §value_of_slider_for_safe_docking_speed§]]
     [describe_docking "|You reached your ship but you were moving too fast.|
      stop_game]` },
      { title: "OUT OF ROCKS", code:
`when [and [not reached_ship]
          [my_horizontal_rocks_remaining = 0]]
     [show_and_say "|You are out of rocks!|]` },
      { title: "OUT OF AIR", code:
`when [and [not reached_ship]
          [time_since_start > §120§]]
     [describe_docking "|You are out of air! Too bad.|
      stop_game]` },
    ],
    settings: [
      { key: "safeSpeed", label: "Safe docking speed (m/s)", min: 1, max: 30, step: 1, value: 12,
        note: "She dies if she hits the ship faster than this. 12 m/s is 43.2 km/h." },
      { key: "airSeconds", label: "Seconds of air", min: 30, max: 300, step: 10, value: 120,
        note: "How long the player has to get back to the ship." },
    ],
  },
  verticalVelocityRescue: {
    game: "rescue", target: "astronaut", name: "Vertical Velocity Gadget", helpFrom: "scientist",
    tip: "Belongs on the astronaut. Lets her move up and down. Without it she can only move left and right.",
    help: `The VERTICAL VELOCITY GADGET updates the astronaut's up/down position from her vertical velocity 100 times a second, just like the horizontal one does for left and right.`,
    code:
`; [VERTICAL VELOCITY CODE]
repeat_every 1/100
   [change_my_vertical_position_by
        my_vertical_velocity / 100]`,
    settings: [],
  },
  verticalRockThrowing: {
    game: "rescue", target: "astronaut", name: "Vertical Rock Throwing Gadget", helpFrom: "programmer",
    tip: "Belongs on the astronaut. Lets her change her up/down speed by throwing rocks the opposite way. Use the up and down arrow keys. It shares the same bag of rocks.",
    help: `The VERTICAL ROCK THROWING GADGET is just like the horizontal one - I copied it and changed horizontal to vertical. Throw a rock down and the astronaut moves up, and the other way around.`,
    code:
`; [VERTICAL ROCK THROWING CODE]
; Just like horizontal, but up and down.
if my_rocks_remaining >= value_of_slider_for_rock_mass
   [change_my_vertical_velocity_by
        -1 * value_of_slider_for_rock_mass
            * §value_of_slider_for_rock_speed§
            / (value_of_slider_for_mass_without_rocks
               + my_rocks_remaining)
    animate_vertical_rock_moving_away]`,
    settings: [],
  },
  gaugesRescue: {
    game: "rescue", target: "astronaut", name: "Gauges", helpFrom: "programmer",
    tip: "Belongs on the astronaut. Adds gauges to display the position, velocity, fuel and time.",
    help: `Add gauges to display the position, velocity, fuel, acceleration and more. They make it much easier to see what your astronaut is doing.`,
    code: `; Shows live read-outs and a moving speed gauge under the stage.`,
    settings: [], isGauges: true,
  },

  /* ---- Lander ---- */
  verticalVelocity: {
    game: "lander", target: "lander", name: "Vertical Velocity Gadget", helpFrom: "scientist",
    tip: "Belongs on the lander. Things can't move up and down without it. It defines up and down motion.",
    help: `The VERTICAL VELOCITY GADGET updates the lander's position from its velocity 100 times a second so the motion is smooth. The velocity is how many meters it moves in one second.`,
    code:
`; [VERTICAL VELOCITY CODE]
; Updates my position from my velocity, 100 times a second.
repeat_every 1/100
   [change_my_vertical_position_by
        my_vertical_velocity / 100]`,
    settings: [],
  },
  gravity: {
    game: "lander", target: "lander", name: "Gravity Gadget", helpFrom: "scientist",
    tip: "Belongs on the lander. Without it the lander will not fall. It implements gravity near the surface of a moon.",
    help: `Gravity near the surface of the moon decreases the upward vertical speed by 1.6 meters per second every second. Decreasing the upward speed is the same as increasing the downward speed. On Earth gravity is about 9.8 m/s every second.`,
    code:
`; [CONSTANT GRAVITY CODE]
; On every second it increases my downward speed.
repeat_every 1
   [change_my_vertical_velocity_by §value_of_slider_for_gravity§]`,
    settings: [
      { key: "gravity", label: "Gravity (m/s every second, downward)", min: -25, max: -1, step: 0.1, value: -1.6,
        note: "Near the surface of the moon gravity is about -1.6. On Earth it is about -9.8." },
    ],
  },
  verticalThruster: {
    game: "lander", target: "lander", name: "Vertical Thruster Gadget", helpFrom: "programmer",
    tip: "Belongs on the lander. It throws projectiles downward several times a second so the lander pushes upward. The throttle controls how fast it fires.",
    help: `The THRUSTER GADGET throws projectiles downward, and the lander recoils upward - conservation of momentum. The throttle sets how fast it fires (up to a few times a second at 100%). Watch your fuel: each shot uses some. The real Apollo descent engine threw about 26 kilograms of exhaust every second.`,
    code:
`; [VERTICAL THRUSTER CODE]
; Throws a projectile downward when the throttle is on.
; This is an example of conservation of momentum.
repeat_every [1 / §value_of_slider_for_vertical_throttle§]
   [if my_projectiles_left > 0
      [change_my_projectiles_left_by -1
       change_my_vertical_velocity_by
           -1 * §value_of_slider_for_projectile_speed§
               * §value_of_slider_for_projectile_mass§
               / my_mass
       animate_projectile_moving_away]]`,
    settings: [
      { key: "throttle", label: "Throttle (%)", min: 0, max: 100, step: 1, value: 0,
        note: "How hard the engine fires. Use Up/Down (or W/S) to change it during the flight." },
      { key: "projectileSpeed", label: "Speed of a projectile (m/s)", min: 40, max: 120, step: 1, value: 100,
        note: "The fuel is ejected at this speed. Faster exhaust = more push per kilogram of fuel." },
      { key: "projectileMass", label: "Mass of each projectile (kg)", min: 1, max: 10, step: 1, value: 5,
        note: "Smaller projectiles give finer control and use less fuel per shot." },
      { key: "fuel", label: "Initial fuel (kg)", min: 40, max: 200, step: 10, value: 100,
        note: "The lander starts with this total mass of projectiles." },
    ],
  },
  landingAction: {
    game: "lander", target: "lander", name: "Landing Action Gadget", helpFrom: "programmer",
    tip: "Belongs on the lander. Without it the lander just stops when it reaches the surface. With it you decide if it lands safely or crashes.",
    help: `Without this gadget your lander just stops when it reaches the surface. With it you can decide if it lands safely or crashes. A lander crashes if it hits the surface moving faster than the safe landing speed.`,
    fourBoxes: true,
    codeBoxes: [
      { title: "LANDED SAFELY", code:
`when [and [landed] [my_speed <= §value_of_slider_for_safe_landing_speed§]]
     [describe_landing "|The Eagle has landed!|
      stop_game]` },
      { title: "CRASHED", code:
`when [and [landed] [my_speed > §value_of_slider_for_safe_landing_speed§]]
     [describe_landing "|Too bad. You crashed!|
      stop_game]` },
    ],
    settings: [
      { key: "safeLandingSpeed", label: "Safe landing speed (m/s)", min: 1, max: 10, step: 0.5, value: 3,
        note: "A real lander crashes above about 1 m/s. Pick a value that is fair but not too easy." },
    ],
  },
  gaugesLander: {
    game: "lander", target: "lander", name: "Gauges", helpFrom: "programmer",
    tip: "Belongs on the lander. Adds gauges for height, speed and fuel. It is easier to land safely when you watch a speed gauge.",
    help: `Add gauges to display the height, vertical speed and fuel. See if you can stop your lander in mid-flight - it is easier if you watch the speed gauge.`,
    code: `; Shows live read-outs and a moving speed gauge under the stage.`,
    settings: [], isGauges: true,
  },
};

const DIALOGUE = {
  rescue: {
    signer: [
      { text: `Did you hear the joke about the astronaut returning from a space walk? He knocked on the hatch and the astronaut inside asked, "Who's there?"

I guess we can't use that. Maybe the game should have a background story. Helen the astronaut has been collecting rock samples from an asteroid. On her way back to the ship something goes wrong with her equipment. She'll die if she doesn't get back to her ship. All she has is her bag full of asteroid rocks.

I thought the name Helen was good since Helen Sharman was Britain's first astronaut. Before going into space she was a scientist working on chocolate for Mars Confectionary Limited.` },
      { text: `I think we should start off with a very simple game. The ship is directly to the right and all the player does is throw rocks to the left. We'll make it more fun after we get that much working.

Visit Jammer the Programmer - he can give you behaviour gadgets to make the astronaut move.` },
      { text: `A good start! We need to decide what should happen when the astronaut reaches the ship. Or not!

I can think of four conditional actions for Jammer to program:

Reach ship but moving too fast. Game over. Player loses.
Reach ship and not moving too fast. Player wins.
Run out of rocks. Player might still win if the astronaut is headed towards the ship.
Run out of air. The player has only so much time to get back. Otherwise the game is too easy.

Go and ask Jammer for a Reached or Missed Ship gadget.`, needs: "testedIncomplete", sets: "designedEnding" },
      { text: `We're making good progress but all the movement is too "one-dimensional". It would be fun to move in diagonals as well. Let's get Jammer to make a gadget for throwing rocks up and down too.`, needs: "designedEnding", sets: "wantsVertical" },
    ],
    scientist: [
      { text: `An astronaut adrift, huh?

Well, she could throw rocks. If she does, she'll begin to move in the opposite direction. And she won't stop. There's no air friction to slow her down. Every time she throws a rock she'll go faster. Unless she changes the direction she is throwing the rocks.` },
      { text: `Let me explain why rock throwing works. The physics of your game is based on conservation of momentum. That means total momentum never changes. Momentum depends on velocity and mass.

So the change of the speed of the astronaut in one direction is the change of the speed of the rock in the opposite direction, times the mass of the rock, divided by the mass of the astronaut.

Now Jammer has the equation he needs.`, sets: "physicsKnown" },
      { text: `If there was no friction, then when you threw something you would begin moving in the opposite direction. And without friction once you start moving, you won't stop unless something interferes. Try it sometime while ice skating - there isn't much friction on ice.` },
    ],
    programmer: [
      { text: `It will be fun to write programs for your Astronaut game. But first you'd better see Tist the Scientist so I know what physics to program.` },
      { text: `So we're making a game about throwing rocks in space? Sounds fun.

I've programmed a gadget for moving horizontally and another for throwing rocks left or right, plus some gauges. Take them and try them out. To add one to your astronaut, drag it onto the picture of the astronaut. You can change the values it uses with the SETTINGS button.`,
        grants: ["horizontalVelocity", "horizontalRockThrowing", "gaugesRescue"], needs: "physicsKnown" },
      { text: `You decided what should happen when the astronaut reaches the ship? Good. Here's the REACHED OR MISSED SHIP GADGET. It has four code boxes: reached safely, reached too fast, out of rocks, and out of air. Drop it on the astronaut.`,
        grants: ["reachedShip"], needs: "designedEnding" },
      { text: `No problem. It's easy to make a VERTICAL ROCK THROWING GADGET - I just copy the horizontal one and make small edits. The vertical and horizontal programs are almost the same. Drop them on the astronaut. Enjoy.`, grants: ["verticalVelocityRescue", "verticalRockThrowing"], needs: "wantsVertical" },
    ],
    historian: [
      { text: `A game about a rock throwing astronaut?

Astronauts on space walks travel around using a hand held unit that produces short bursts of gas. Rather than throwing rocks, they were throwing a trillion trillion molecules every second. But the principles are the same.

Only astronauts using a big backpack called the Manned Maneuvering Unit have ever become disconnected from their space vehicle. They're usually tethered to their ship with a cable.` },
      { text: `The first human to leave their vehicle in space was Alexei Leonov on March 18, 1965, from the Soviet Union. A few months later Ed White became the first American to walk in space. The first woman to perform a space walk was Soviet cosmonaut Svetlana Savitskaya in July 1984.

The United States and the Soviet Union competed to be first to travel in space, orbit the Earth, walk in space, dock ships, and go to the moon. We call this the Space Race.` },
    ],
    animator: [
      { text: `But outer Space, at least this far, for all the fuss of the populace, stays more popular, than populous. Robert Frost wrote that in 1959.

Sounds like a fun project but I'm too busy just now to make a full animation. I found a few photos you can use in the meanwhile - an astronaut in space, the lander, and a starfield background. They're already on your stage. Good luck.`, sets: "haveArt" },
      { text: `The astronaut picture has no behaviours so it just sits there. Take the gadgets Jammer gave you and drag them onto the astronaut. If you're curious, click FLIP on a gadget to read the program that gives it its behaviour.` },
    ],
    sound: [
      { text: `So, you're working on a game in space, huh? Sorry, there is no air, so there is no sound. You don't need me.` },
      { text: `Have you talked to Tist the Scientist? She probably has ideas about how this game will work.` },
    ],
  },

  lander: {
    signer: [
      { text: `A Lunar Lander game! Classic. The player flies a lander down to the surface and has to land gently. If it touches down too fast, it crashes.

Get the behaviours from Jammer, and ask Tist about gravity. When you've got the lander flying, come back and we'll decide what counts as a safe landing.` },
      { text: `Now that you've tried flying, we need to decide what happens when the lander reaches the surface. Land slowly - it's a safe landing. Hit too fast - it crashes. Ask Jammer for a Landing Action gadget.`, needs: "testedIncomplete", sets: "designedEnding" },
    ],
    scientist: [
      { text: `Gravity near the surface of the moon decreases the lander's upward speed by 1.6 meters per second every second. That's about a sixth of Earth's gravity. Decreasing the upward speed is the same as increasing the downward speed.

Jammer can put that in a Gravity Gadget.`, sets: "physicsKnown" },
      { text: `A lander crashes if it hits the surface faster than about 1 meter per second - that's 3.6 km/h. The lander's speed is the square root of the sum of the squares of its horizontal and vertical velocity.` },
    ],
    programmer: [
      { text: `For the lander you'll need three behaviours: a Vertical Velocity Gadget so it can move up and down, a Gravity Gadget so it falls, and a Thruster Gadget so the engine can push it back up. Here they are - drop them on the lander.

Tip: once it's flying, you can RECORD your flight. I'll turn it into editable code that the lander can run on auto-pilot.`,
        grants: ["verticalVelocity", "gravity", "verticalThruster", "gaugesLander"], needs: "physicsKnown" },
      { text: `Here's the LANDING ACTION GADGET. It decides whether the lander touches down safely or crashes, based on the safe landing speed you set. Drop it on the lander.`,
        grants: ["landingAction"], needs: "designedEnding" },
    ],
    historian: [
      { text: `On July 20, 1969, Apollo 11's lunar module Eagle landed on the moon with Neil Armstrong and Buzz Aldrin aboard. Armstrong took over manual control to avoid a boulder field and landed with only seconds of fuel to spare. "The Eagle has landed."` },
    ],
    animator: [
      { text: `I've put a lander drawing and a moonscape on the stage for you. Watch the lander as it fires its thrusters. Good luck getting it down in one piece.`, sets: "haveArt" },
    ],
    sound: [
      { text: `Still no air in space, so still no sound on the way down. But you'd hear a thump - or a crunch - at the end. I'll leave that to your imagination.` },
    ],
  },
};
const TALK_END = "Sorry, I can't think of more to tell you just now. If you want to know the science behind a behaviour gadget, click its HELP button and come back here.";

const GAMES = {
  rescue: {
    title: "Astronaut Rescue",
    objects: [
      { id: "astronaut", label: "Astronaut", el: "astronaut" },
      { id: "ship", label: "Spaceship", el: "ship" },
    ],
    player: "astronaut",
    needGadgets: ["horizontalVelocity", "horizontalRockThrowing", "reachedShip"],
  },
  lander: {
    title: "Lunar Lander",
    objects: [{ id: "lander", label: "Lunar Lander", el: "lander" }],
    player: "lander",
    needGadgets: ["verticalVelocity", "gravity", "verticalThruster", "landingAction"],
    throttle: true,
  },
};
const PHYS = { massWithoutRocks: 95, landerMass: 300, landerFireRate: 4,
  worldW: 200, worldH: 140, dockRadius: 12, landerStartHeight: 90, landerWorldH: 140 };
