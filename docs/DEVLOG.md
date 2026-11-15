# Development log

How Undertow was built, pass by pass, oldest first. Later passes supersede the numbers in earlier ones.

## First pass (2026-11-13)
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

## Fixes and detail pass (2026-11-14)
- **Shooting:** a head that runs out of head health pops and kills (not brutes or the boss), so one pistol headshot
  drops a walker; pulling the trigger now cancels a sprint instead of being ignored.
- **Cover:** raider and Varuna gunfire is ray-tested against the world, so walls and crouching behind cover work.
  Humans only notice you through walls within 3 m.
- **Respawn:** death offers *Retry from checkpoint* (start of the current objective, same night, −15% scrap) or
  *Wake up at home* (−40%, next morning). Missions no longer reset to their first step.
- **Hordes:** when four or fewer siege or mission enemies remain, they hunt the player, and lost ones regroup
  nearby (`Z.hunt`, `Z.regroup`); a siege with unreachable stragglers ends after a minute.
- **Weapons:** raiders, Varuna security and riot constables drop their guns (amber beam pickups,
  `Loot.dropGun`), police crates can hold a gun, bench prices are 45% lower and every kill pays scrap.
- **Crafting:** `I` opens field crafting anywhere; scrap armour soaks half of incoming damage.
- **World detail:** Poly Haven distressed painted planks (shutters, doors, eaves), peeling painted wall (blended
  into plaster by world-space noise, plus rain streaks) and brown bark; darker wall bases; window sunshades and
  back/side windows; palm frond atlas with dead fronds and coconuts; leaf-card canopies for broadleaf trees.

## Vehicle lock-up, drive-bys, slides, molotovs (2026-11-15)
- **Bug:** a zombie that grabbed you kept its grip after you got into a vehicle; if it then died, `P.grabber`
  was never cleared and every gun and melee action stayed blocked. `kill()` now releases the grab, a watchdog
  in `P.update` drops any grab that isn't live, you can't board while grabbed, bandaging cancels in a vehicle,
  and NaN weapon timers are reset.
- **Drive-by:** guns fire from vehicles, aimed through the chase-camera crosshair from the driver's seat;
  grenades and molotovs throw from the seat; melee swings reach past bikes and autos.
- **Slide:** C while sprinting slides about 6 m, lowers the camera, and knocks down infected in the way.
- **Molotovs:** bigger, longer fire (two pools), flaming rag in flight, smash on bodies, fire spreads between
  burning infected, standing in fire hurts; start with two, craft two for 18 scrap.
