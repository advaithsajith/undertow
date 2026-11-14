# UNDERTOW — The Last Monsoon

First-person zombie survival set on the Kannur coast: Payyambalam beach, Thalap, the lighthouse,
St. Angelo Fort, Mappila Bay, NH 66, Perumba bridge, Payyanur, the Kavvayi backwaters and Ezhimala.

## Run
Serve this folder over HTTP and open it in a desktop browser, for example `python -m http.server 8817`, then
http://localhost:8817. Click the page to capture the mouse. A Windows desktop build is described at the end.

## Licence
Copyright (c) 2026 advaithsajith, all rights reserved: you may read the code and play the game, but not copy,
modify or redistribute it without permission. See `LICENSE`. Bundled libraries and art keep their own licences
(MIT and CC0), listed in `THIRD-PARTY-NOTICES.md`.

## Controls
First person (bodycam) is the default; B switches to over-the-shoulder with a laser sight while aiming.
WASD move · Shift sprint · C crouch · Space jump · Q dodge · LMB fire · RMB aim · R reload · 1-3 guns · 4 melee
V quick melee · F kick / execute / stomp / break a grab · G throw · 5 swap throwable · E use · H heal · T torch
X tripmine · Tab family & fortifications · M map · Esc pause

## Systems
The sections below are a build log, oldest first; later passes supersede the counts given here.
- **Rendering** (js/render.js): HDR pipeline (scene → AO → water → tone-map). Water is ray-marched in screen
  space for reflections (sky fallback), refracts with depth absorption, has caustics, shoreline foam and surf
  bands. Sun/moon shadow maps, light shafts, day/night, monsoon rain, lightning. This is screen-space ray
  tracing, not hardware RTX — a browser cannot do that.
- **World** (js/world.js): height function + road mask, merged static geometry, instanced palms with LOD.
- **Zombies** (js/zombies.js + js/rig.js): walker, runner, bloater, drowned, constable, brute. Per-limb hit
  capsules, severing, crawling, stun → melee finisher, knockdowns, burning. Procedural pose blending.
- **Weapons** (js/weapons.js): 8 guns, 3 melee, 5 attachment slots, 9 skins, grenades and petrol bombs.
- **Family & base** (js/base.js): 8 household members with roles, bonds and perks; two gates, upgrades,
  nightly siege at 20:30, daily food/morale.
- **Missions** (js/missions.js): 8 story missions, radio side jobs, 300 loot points, boat travel, saves.

## Testing hooks (console)
`startGame(true)`, `stepSim(seconds)`, `G.S.god = true`, `G.S.noSpawn = true`, `G.M.skip()`, `G.env.hour = 21`.
Scripts are cache-busted with `?v=N` in index.html — bump it after editing any js file.

## Second pass (2026-11-13)
- **Characters**: Kenney "Animated Characters 1-3" (CC0, from OpenGameArt) — one skinned human mesh with 12 skins,
  in `assets/kenney/`. `js/rig.js` retargets the game's procedural pose onto that skeleton each frame, so stuns,
  crawling and dismemberment (bone scaled to zero + stump) work without animation clips. Lit per-vertex (Lambert).
- **Third person**: over-the-shoulder camera, animated player (aim, recoil, reload, slash, roundhouse, stomp,
  execute, dodge, riding poses), laser sight, bullets traced from the camera.
- **Kill feel**: hit-stop, slow motion on multi-kills/finishers, flinches, launched bodies, domino knockdowns,
  kneel-and-fall headshot deaths, style tags and kill streak bonuses (`G.Style`, `G.onKill` in missions.js).
- **Vehicles**: `G.Vehs` — autorickshaw, 5 motorcycles, 3 jeeps (`VT` in player.js).
- **Look**: internal 360p / 480p / 720p with soft upscale, glow, ordered dither (render.js post shader).
- **Audio**: still fully synthesised; gunshots, blasts and thunder now go through a generated convolution reverb.
- Libraries vendored in `lib/` (three r128 FBXLoader, fflate, SkeletonUtils).

## Third pass (2026-11-13) — detail
- **Textures**: Poly Haven CC0 scans (1k colour + normal) in `assets/tex/` for sand, grass, laterite soil, asphalt,
  plaster, laterite-tinted stone blocks, clay roof tiles and palm bark. Terrain blends four of them with normal maps.
- **Foliage** (`js/foliage.js`): about 6-11k instanced plants streamed around the player in one draw call — grass,
  reeds, ferns, hibiscus, ixora/jasmine, taro, beach morning-glory, paddy. They sway and bend away from the player.
  Plant art is drawn procedurally into an atlas (not photo-sourced).
- **Sky**: warped two-layer cumulus with sun-side self-shadowing and silver linings, cirrus, horizon scattering,
  milky way and twinkling stars.
- **Rendering presets**: PS2 480p / HD 720p / Full HD (default) / 4K. Non-PS2 presets use FXAA; 4K follows the
  display's device-pixel-ratio and uses a 4096 shadow map.
- **Kannur**: Kannur International Airport on its plateau (terminal, ATC tower, hangar, two airliners, runway),
  Kannur railway station with a stranded express and the line south over two level crossings, Arakkal Museum,
  bakeries and snack shops (halwa, kinnathappam, biriyani), named junction boards (Caltex, Fort Road, Station Road,
  South Bazar, Thavakkara, Pallikkunnu, Chirakkal). Sign atlas is 2048px with 52 boards.
- **Enemies**: Riot Constable (helmet and vest soak damage until the helmet is shot off), Spitter (lobs acid that
  pools), Screamer (enrages everything nearby).
- **Ambient life**: fireflies, pollen motes, falling leaves, rain splashes, surf spray, a wheeling flock of birds.

## Scenery ray tracing (2026-11-13)
The AO pass in `js/render.js` now also ray-marches in screen space for: contact shadows toward the sun/moon (grounds grass and props), one bounce of nearby colour, and reflections on wet ground (rain puddles, wet roads, the tide line). Off in the PS2 preset.

## Plot pass (2026-11-13)
Original story: **Varuna Biomarine** brought the Tide-7 pathogen ashore in its cold chain and covered it up. Eleven missions now
(added: SAAKSHI at the railway station, PATHRAM at the airport, ARA at the Mappila Bay cold store with the boss SPECIMEN 0).
Seven collectible files (`M.FILES`), read from the household panel. Human factions live in `G.Z.list` with `human: true`:
civilians (neutral, flee, killing them costs morale), raiders and Varuna security (hostile, hitscan fire, fight zombies too).
Save format is `v: 2`; older saves are ignored. Also: compact sun, textured moon, three-stop sky gradient, distance haze.

## Bodycam pass (2026-11-14)
Reference: Reissad Studio's *Bodycam* zombies video. We match the camera treatment, not the scanned Unreal assets.
- **View**: first person is now the default with a bodycam lens (fisheye, colour fringing, vignette, REC overlay,
  rain droplets on the lens). `B` switches to over-the-shoulder. Gun kick now rolls and shakes the camera.
- **Melee**: light attacks chain slash → backhand → thrust (`st.cstep` in weapons.js). New: Vaal sword, Urumi
  whip-sword (hits everything in a wide arc), fishing spear (always thrusts).
- **Guns**: crossbow (silent, bolts) and flamethrower (sprayer fuel). Bottles (noise lure) join grenades and
  petrol bombs on `5`; `X` drops a tripmine.
- **Stealth**: crouching in tall plants hides you (`P.cover`), enemies chase your last known position, and an
  unaware enemy can be killed silently from behind with `F`. HUD shows HIDDEN / SNEAKING / SPOTTED.
- **Hazards** (`js/plus.js`): gas cylinders and fuel drums explode when shot and chain.
- **Crew**: up to two family members can follow and fight (household panel → "take along").
- **Vehicles**: vans, lorries and fishing boats (boats only move on water) join the auto, bikes and jeeps.
- **Traders**: Kunjappan (tea shop, Thalap) and Ummer Haji (fish market, Mappila Bay).
- **World**: houses gained shutters, grilles, eave boards, water tanks, tulsi tharas, compound walls and some upper
  storeys; Varuna Biomarine campus on the plateau north of the airport; loot glints; in-world objective marker.
- **Story**: 12 missions. The Navy refuses to evacuate; the finale (MARUNNU MAZHA) blows the Varuna campus and
  fogs the counter-agent over the district from a spray plane. Save format `v: 3`.
- **Desktop app**: `electron-main.js` + `package.json`; build with
  `npx @electron/packager . Undertow --platform=win32 --arch=x64 --electron-version=31.3.1 --out=../undertow-desktop --overwrite`.
  three.js is vendored in `lib/` so the game runs offline.
