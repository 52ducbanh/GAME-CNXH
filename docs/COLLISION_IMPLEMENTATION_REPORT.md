# Collision implementation — C01–C13

Date: 2026-10-04. Coordinates are native 1672 × 941 world pixels. The clean scene is drawn at origin (0,0); camera scale does not change collision coordinates. Current repository is authoritative. Earlier art/UX work and uncommitted files were preserved.

## Outcome and case status

`FIXED + VERIFIED` below means geometry/unit tests plus the specified Socket.IO checks. It does **not** mean continuous WASD playtesting.

| Case | Status | Evidence / remaining issue |
|---|---|---|
| C01 Ninh Bình water (855,660) | FIXED + VERIFIED | Independent shoreline excludes water from path tubes; exact point and ±3px corners blocked; live MOVE rejected. Dock/main crossing and detour remain accessible. |
| C02 Nghệ An lotus pond (1075,515) | FIXED + VERIFIED | Separate lotus-water polygon; path rerouted north of pond; live MOVE rejected. |
| C03 Hà Tĩnh stream (1340,645) | FIXED + VERIFIED | Stream collision, corrected west approach, no false crossing through the northern fork; live MOVE rejected. Broken-bridge route goes around the stream head on the north bank. |
| C04 Hải Phòng harbor (1345,280) | FIXED + VERIFIED | Quay outline separate from decorative ripples; quay/alternate-crossing route corrected; live MOVE rejected. |
| C05 Hải Phòng palm/planter (625,480) | FIXED + VERIFIED | Trunk and masonry base, plus other identifiable palm/tree bases; live MOVE rejected. Spawn moved to (540,510); all spawn jitter samples valid. |
| C06 Thanh Hóa trunk/bank wall (1085,570) | FIXED + VERIFIED | Ground trunk and wall footprints, not canopy; live MOVE rejected. |
| C07 Hải Phòng west opera (625,310) | FIXED + VERIFIED | West/east/rear wings complement existing center footprint; public foreground plaza remains accessible; live MOVE rejected. |
| C08 Hà Nội bench (1030,860) | FIXED + VERIFIED | Seat/legs footprint; behind-bench (1040,835) is walkable/reachable; slide regression passes; live MOVE into bench rejected. |
| C09 Quảng Ninh bench (735,565) | FIXED + VERIFIED | Seat/legs footprint plus other clear benches; exact point/corners blocked; live MOVE rejected. |
| C10 deployed clinics | FIXED + VERIFIED | Shared deployment flags across client/server/navigation; rear/side walls, open front door. All seven maps: deployed POIs and clinic routes verified by code. Real two-client deployment snapshots in all seven maps; actual overlap recovery exercised at Hanoi B, Thanh Hoa B, Ha Tinh C. Other overlap placements were engine fixtures, not live player control. |
| C11 true bridge floor/rails | UNRESOLVED | Sprite measurement reveals a mismatch between nominal geometry and rendered perspective; see below. Do not classify the old 31px probe as a confirmed rail violation. Nominal floor bands now enforce water support, but exact rail/floor alignment is not certified. |
| C12 Thanh Hóa courtyard (900,345) | FIXED + VERIFIED | Public paving polygon, connected route; citadel wall still blocked. Real server accepted 27-point route in and 28-point route out. |
| C13 runtime consistency | UNRESOLVED on 3102; implemented/verified on isolated 3111 | Current server validates every segment. Fresh 3102 process test still accepts direct cross-lake MOVE; 3110 and 3111 reject it. 3102 has RAM rooms VN2336/VN4705 in RUNNING, so it was not restarted. |

## Implementation

- `scripts/collision-layout.json` is the authored source for independent shoreline polygons, named ground solids, public ground polygons and support floors. Decorative ripple polygons are unchanged and are not treated as collision shorelines.
- `scripts/prepare-regions.py --geometry-only` regenerates `shared/src/collisionLayout.ts` and `shared/src/regionalMapData.ts` without replacing artwork. Repeated final corrections were consolidated into one source block. Regeneration was checked byte-for-byte.
- `shared/src/collisionGeometry.ts` defines `CollisionState`, circle/rect/polygon tests and deck support. Water wins over ordinary path tubes; floors only exempt supported water, never solid footprints. The radius remains 14px. Shore distance is analytic; land/deck seam support uses 64 circle-boundary samples and interior edge witnesses. This is not an exact general polygon-boolean implementation; tiny adversarial polygon slivers remain a precision limitation.
- `shared/src/worldMaps.ts` composes existing solids, named additions and deployed tent walls. `shared/src/mapData.ts` retains Hanoi water/canal conventions and adds dry clinic approaches/bench access.
- `shared/src/movement.ts` threads collision state into the existing swept solver, segment validator and recovery. Contact rectangles preserve the existing public shape. Recovery searches locally up to 96px before the existing safe spawn fallback. No radius shrink, corner assist, speed-budget protocol or solver replacement.
- `shared/src/navigation.ts` uses the same segment validator as server/solver. It searches the existing 20px grid, retrying at 10px when a valid narrow passage has no coarse-grid route. It cannot override water or solids.
- `server/src/gameEngine.ts` derives state from authoritative mission flags, validates MOVE with that state, and resolves overlaps after construction. Local recovery observed in live tests was within 96px; a fallback to map spawn can be farther when there is no nearby safe point.
- `client/src/scenes/MainScene.ts` uses the same snapshot flags for prediction, correction and navigation. `client/src/game/movementDebug.ts` displays the added shore/floor/solid geometry and deployment flags. F2 remains off by default.
- `server/src/server.ts` accepts optional `CLIENT_DIST_PATH` so an isolated client bundle can be served without overwriting the live `client/dist`. `.gitignore` excludes `dist-collision/`.
- `server/src/__tests__/collisionLayout.test.ts` adds 27 regression tests. `scripts/verify-regions.mjs` accepts `QA_INCLUDE_HANOI` / `QA_REPORT_PREFIX`, uses full collision state, waits for exact authoritative route endpoints, and records collision rejection/two-client construction checks in collision runs.

## Changes beyond the sample coordinates

Added 63 named solids: Hanoi 11, Hai Phong 16, Quang Ninh 10, Ninh Binh 6, Thanh Hoa 10, Nghe An 5, Ha Tinh 5. These include clear benches, tree/palm trunks, small lamp bases, opera wings and the Thanh Hoa bank wall. Existing building/trunk colliders remain. Unclear signs, canopy shapes and loose flowers were not converted into hard blockers.

There are nine independent regional water polygons, thirteen nominal support floor bands (six main bridges, six alternate crossings, one Trang An dock), the Thanh Hoa public courtyard and Hai Phong spawn plaza. Hanoi keeps its existing lake/canal geometry. Full clinic approaches were added without exempting underlying water/solids. Some new footprints are redundant with previously forbidden walkability; they remain explicit solids.

Interaction IDs are unchanged. Clinic coordinates were adjusted to keep buildings off narrow routes/neighbor POIs: Hanoi mobile B (1555,480), Hai Phong mobile B (1600,330), Ninh Binh mobile B (1615,640), Ha Tinh mobile C (1530,755). Ninh Binh far-bank approach and several bridge task positions were also corrected in the generator. The Ha Tinh northern bypass follows dry ground around the source; there is no new drawn road. This path needs human visual/feel review where foliage/rocks obscure the ground.

## C11 measurement and limitation

Regional bridge sprites are 512 × 192 frames in 512 × 576 sheets (intact/broken/repaired). Rendering uses display width `length+28`, display height `clamp(length*0.26,78,142)`, center origin, then rotates by atan2(b-a). A local sprite point (u,v) transforms by sx=(length+28)/512, sy=displayHeight/192 around (256,96), followed by the same rotation. The full sprite includes railing height, piers and shadows; it is not the floor footprint.

Measured rendered frame heights: Hai Phong 78px, Quang Ninh 142px, Ninh Binh about124.2px, Thanh Hoa78px, Nghe An78px, Ha Tinh about138.5px. At the center of the wood/steel/stone frames, the visible floor is a much narrower band than the whole frame and is partly hidden by the front rail. Stone floor/rail lines also curve longitudinally. Thus a straight centered 60px band is not evidence of exact rendered floor alignment. Hanoi uses a different sprite/origin and must be measured separately.

No bridge sprite/render redesign was performed. Main nominal widths remain 60px regional /62px Hanoi. The support-floor data introduced for water safety uses nominal bands; therefore deck/rail edge cases cannot be claimed visually fixed. C11 is a remaining preview/release limitation, not `NOT AN ISSUE`. A follow-up must trace physical rail bases/floor polygons in renderer coordinates and reconcile the perspective artwork with the 28px foot diameter, rather than shrinking the foot or accepting water outside the deck.

## Validation

| Check | Result |
|---|---|
| Typecheck shared/server/client | PASS |
| Shared build / server build / isolated client build | PASS; Vite large-chunk warning remains |
| Tests | PASS 95/95, including 27 new collision cases |
| Source regeneration | PASS; both generated TS files byte-identical on rerun |
| Existing solver routes, seven maps, intact/broken | PASS |
| Deployed POIs and clinic doors, seven maps | PASS by geometry/navigation tests |
| Three quests via real Socket.IO | PASS seven maps, 100 points each, 38–39 routes each |
| Bridge repair versus detour | PASS sampled live plans; all four mission plan combinations remain covered by rule tests using fixture positions |
| Multiplayer construction state | PASS two sockets see deployment flags in all seven rooms |
| Live deployment overlap recovery | PASS Hanoi B / Thanh Hoa B / Ha Tinh C; other placements NOT TESTED live |
| Collision probe MOVE | PASS 11 rejections across the seven new rooms, including valid endpoint across Hanoi lake |
| Reconnect carrying crate | PASS all seven live rooms |
| Thanh Hoa courtyard in/out | PASS real Socket.IO routes |
| Browser smoke | PASS new client loads, F2 shows 14px/state/geometry; D/S taps change predicted and authoritative position consistently; AudioContext running/unlocked with ten cached sounds |
| Continuous WASD / sprint edge stress on all maps | NOT TESTED; key taps and Socket.IO are not this playtest |
| Audio human listening / full animation regression | NOT TESTED; feedback/solver unit tests pass, no audio/animation code changed |
| C11 exact floor and rail visual alignment | UNRESOLVED |
| Live 3102 updated | NOT DONE to preserve RAM rooms |

Latest complete runtime evidence: `docs/collision-runtime-qa.json` and per-map `docs/collision-<id>-runtime-qa.json`; `docs/collision-courtyard-qa.json`; `docs/collision-runtime-versions.json`; `docs/collision-ui-preview.jpg`. The first runtime run failed Hanoi MOVE; the script originally proceeded while its snapshot was still within the 72px interaction radius, and navigation used a different segment sampling rule. Exact endpoint waiting plus shared segment checks corrected this; later full runs, including construction observers, passed.

## Runtime / how to continue safely

- 3102: PID26500, `node server/dist/server.js`, older running module state; original client/dist preserved. Direct lake crossing still accepted. VN2336 and VN4705 are RUNNING with zero online players; offline progress is still RAM state, so zero online count was not used as permission to erase them.
- 3110: PID30420, older movement preview; rejects lake tunnel, predates this geometry and has not been restarted.
- 3111: PID2864, isolated collision instance, binds127.0.0.1 and serves `client/dist-collision`; new collision logic and geometry verified. Client bundle `index-Bjza6ufr.js`. Only agent-created QA rooms were used here; the failed first-run QA room can remain in RAM without affecting user rooms.

Build commands used: `npm run build --workspace=shared`; `npm run build --workspace=server`; `npm run build --workspace=client -- --outDir dist-collision`. Isolated start: PORT=3111, SERVER_PORT=3111, HOST=127.0.0.1, CLIENT_DIST_PATH=<absolute client/dist-collision>, then `node server/dist/server.js`.

Do not restart3102 until its sessions can be ended or state can be preserved by a verified mechanism. No verified room persistence/migration mechanism was introduced. Do not copy the new client over the old live server independently. Continuous human playtest and the unresolved C11 art/geometry alignment remain required before claiming every collision edge visually correct.
