# GAMEPLAY_UX_IMPLEMENTATION_REPORT.md

# Current movement/collision/audio follow-up — 2026-10-03

## Causes, changes and configuration

Reproduction: Hanoi tree `hanoi:footprint:12`, rect `(467,337,16,16)`, foot `(452.5,345)`, radius14, input D, desired `(6,0)`. Old endpoint/axis fallback discarded all travel despite0.5px clearance. New predicted/server position `(453,345)`. Straight movement into the trunk is a **valid obstruction**. W+D gives `(453.598784,332.689190)` with identical peer authority. Evidence: `movement-runtime-qa.json`.

Axis sliding already existed. The missing pieces were resolving contact rather than discarding the final step, geometric normals for water/path boundaries, and server checks along the trajectory rather than just its destination. New `shared/src/movement.ts` sweeps, resolves to contact, projects remaining displacement along the real boundary without renormalizing, and rechecks other constraints. No collider disabled. Client sends checked trace points at the existing~66ms cadence; server validates each segment. Legacy endpoint-only MOVE works only for a clear straight segment. Server speed-budget validation remains a pre-existing limitation.

Old `Math.min(delta,50)` lost elapsed time below20FPS. Ordinary frames now retain dt and use spatial substeps; hidden/unfocused and >250ms resume frames deliberately do not catch up. 15/30/60/120FPS simulation travels180±0.01 units/s. Sprite32x48 origin(.5,1); radius14 remains a foot footprint, not full sprite/nameplate. Y sorting/roof/canopy occlusion preserved. Trunk/house rects remain; embedded decorative lamps/benches/flowers, NPCs and peers have no automatic hard collider. No global generated-map rewrite or interaction-radius workaround.

Drawer ID `display:flex!important` overrode `.hidden`; selector now excludes hidden state. Drawer no longer locks walking; typing/real modals/pause/network still do. Blur/visibility resets keys/joystick/audio. Rejoin resets prediction queues and stale ACK epochs. Safe spawn/jitter checked by server; if a bridge fails under a player, server recovers to valid ground. Client recovery/network correction never contributes footsteps.

- `MOVEMENT_CONFIG` in `shared/src/constants.ts`: radius14, sweepStep1, contactIterations4, idleEpsilon0.02, maxFrameMs250, maxPacketPoints128. Map defaults reference the same radius. `cornerAssistPx:0`: **not implemented**; no proven case warrants an automatic sideways nudge.
- `MOVEMENT_AUDIO_CONFIG` in `shared/src/movementFeedback.ts`: stepDistance48, volume0.35, pitch±0.035, gain±0.06, contactRelease150ms. Steps count only solver input travel; idle/reset/correction do not count. One bump per blocked contact; sliding continues steps without a bump chain.
- `surfaceAt`: wood bridges, explicitly traced Thanh Hoa lawn `(560..660,400..445)` and stone fallback. No pixel-color or roof sampling.
- `client/src/game/soundManager.ts`: cached/decode-once short samples, gesture unlock, base-path URLs, graceful missing files, local-player-only sources, lifecycle cleanup. Existing procedural quest/UI feedback preserved; no new quest/UI sounds/music. HUD mute uses `sound_muted`, volume uses `sfx_volume`.
- F2 debug in `client/src/game/movementDebug.ts`: foot/nearby footprints/path/water, analytic contact normals, desired/actual movement, surface, authoritative/predicted position and last rejection.300ms blocked sample is deduplicated and bounded to12, not automatically classified as a bug. Off skips geometry drawing.
- Integrations: `MainScene.ts`, `socketClient.ts`, `gameEngine.ts`, `hudView.ts`, `game.css`. Gemini vote-pause/M2-REPAIR checks preserved. Two old tests now use valid short movement fixtures instead of expecting cross-map teleportation.

## Actual audio assets

Kenney **Impact Sounds1.0**, CC0, from https://kenney.nl/assets/impact-sounds . Runtime10 unmodified OGGs: `footstep_concrete_000–002`, `footstep_grass_000–002`, `footstep_wood_000–002`, `impactGeneric_light_000` (quiet gain). Original license in `client/public/assets/audio/movement/LICENSE-Kenney.txt`; sources in ASSET_CREDITS and runtime credits. Fantozzi Footsteps and Kenney RPG Audio archives were also downloaded from their original pages; Kenney ZIP contents were listed, Fantozzi7z retained unextracted. Neither is loaded at runtime. No hotlink.

Browser AudioContext unlocked from keys and decoded10/10 files. **Human listening was unavailable**: filenames, not listening, determined selection. Tonal suitability and perceived volume remain to playtest. Archive/extraction staging remains because automatic approval review rejected recursive cleanup (“blocked by policy”); only10 selected files ship as runtime samples.

## 20 acceptance cases

| Case | Result / method |
| --- | --- |
|01 Open space /4+4 directions | PASS pure normalized speed; browser taps change matching predicted/server position. Continuous human hold NOT TESTED. |
|02 Horizontal wall W+D/W+A | PASS actual trunk `(475,367.5)`, input±12 X/−12 Y, tangential progress, no speed amplification. |
|03 Vertical wall | PASS `(452.5,345)`, (+12,−12), solver + two real sockets. |
|04 Straight wall | PASS reaches `(453,345)` then idles; feedback tests no blocked footsteps. |
|05 Closed corner | PASS two perpendicular rect test fixture `(485.8,400)` settles `(486,399)` after30 steps; not human-playtested. |
|06 Tree/column/bench | PASS real trunk footprint/canopy separation. Embedded columns/benches have no distinct collision metadata; exhaustive visual audit NOT TESTED. |
|07 Corner assist | NOT IMPLEMENTED, configured off; swept contact response covers demonstrated cases. |
|08 Curved lake | PASS `(486,535)`, (+15,−15), lake contact normal; every swept segment remains valid and accepted by server. |
|09 Bridge | PASS required solver routes on7 maps, intact/broken. Shore work points accessible. No newly invented railing collision. |
|10 Quest/NPC/voting | PASS actual solver follows all required POI routes on7 maps; existing mission100-point suites. Not a fresh full browser quest playthrough. |
|11 Spawn/recovery | PASS7-map jitter/spawn and safe recovery tests, live rejoin identity. Live bridge failure under a player NOT TESTED. |
|12 Peer blocking | PASS real sockets: both feet overlap at peer position. |
|13 Client/server | PASS44 real MOVE packets,0 rejection; peer matches slide; tunnel/nonfinite rejection tests. High latency/loss NOT TESTED. |
|14 FPS/delta | PASS timestep15/30/60/120,180±0.01 units/s; long-step tunnel rejected. Actual GPU/load FPS NOT TESTED. |
|15 UI/focus | PASS browser drawer open/move/close/reload. Blur/visibility implemented; held-key switch-tab stress/mobile NOT TESTED. |
|16 Surface | PASS stone/wood/lawn metadata tests,10 browser decodes. Audible comparison NOT TESTED. |
|17 Idle/block/correction audio | PASS distance/reset/contact state tests; no held-contact bump spam. Prolonged hold/listening NOT TESTED. |
|18 Mute/volume/lifecycle | PASS browser mute+0.2 persisted after reload; restored unmuted0.35. Fault-injection proves listener cleanup/no duplicate begin. Actual blur/reconnect-source stress NOT TESTED. |
|19 Missing assets | PASS actual bundled SoundManager with mocked failing fetch does not throw or create sources. Not a live outage test. |
|20 Debug | PASS browser F2 on/off, collider radius, surface, prediction/authority/audio fields. Long blocked-sample/performance playtest NOT TESTED. |

## Validation / limits

- `npm run typecheck`, `npm run build`: PASS, existing large Phaser bundle warning retained. `npm test`:68/68,58 existing +10 movement tests.
- `node scripts/verify-movement.mjs`: two **real Socket.IO clients**; routes paced60Hz, MOVE batches~66ms; isolated contact vectors also sent explicitly.44 packets,0 rejection, overlap/reconnect pass. This is not60 real humans.
- `node scripts/verify-movement-audio.mjs`: actual bundled SoundManager with mocked DOM/AudioContext and failing fetch; persistence/cleanup/no duplicate begin PASS. Not a listening test.
- Evidence: `docs/movement-runtime-qa.json`, `docs/movement-audio-qa.json`. Browser temporary localhost3110 checked key taps, drawer closure, persisted settings and10 decoded samples. Existing server not stopped.
- Remain: human feel/listening, mobile, latency/loss/classroom load; earlier corrupted Vietnamese in ActionPanel/HostView/VotingModal; sparse metadata and possible art/path mismatch elsewhere. No blanket PASS for these limits.

# Previous Gemini implementation report (historical)

# Completed

## ISSUE-01 — Ranh giới di chuyển "đường ống vô hình" (Invisible Path-Tube Collision)
Status: FIXED

Files changed:
- `shared/src/mapData.ts`

Implementation:
Bổ sung các tuyến đường hành lang nối trực tiếp toàn bộ khu vực sân Tây giữa Trụ sở chính quyền [155, 255], Khu dân cư A [292, 390], và Kho vật tư [321, 746] với bề rộng đường 80px. Người chơi có thể di chuyển chéo tự do qua lại giữa các công trình phía Tây mà không bị chặn khựng bởi tường vô hình như trước.

Tested:
- `npm test` passing (58/58 tests).
- `server/src/__tests__/hanoiMap.test.ts`: Tất cả 7 POI reachability and route segment server checks pass 100%.

---

## ISSUE-02 — Thiếu phản hồi va chạm & lỗi "Chạy tại chỗ" (Running in Place on Wall Hit)
Status: FIXED

Files changed:
- `client/src/scenes/MainScene.ts`

Implementation:
1. Đổi thuật toán kiểm tra di chuyển: nếu quãng đường di chuyển thực tế sau bước tính va chạm `< 0.2px` (nhân vật đang bị chặn bởi tường/vật cản), cờ `isMoving` tự động chuyển về `false`, lập tức dừng animation bước chân và chuyển về frame đứng yên hướng mặt vào tường.
2. Thêm cơ chế trượt tường mượt mà (Wall-sliding fallback): nếu bước chéo `(targetX, targetY)` bị chặn, nhân vật tự động trượt theo trục X hoặc trục Y còn trống.

Tested:
- Chạy đâm thẳng vào tường/vật thể: Sprite dừng chân ngay lập tức, không còn hiện tượng chạy chân tại chỗ.

---

## ISSUE-03 — Cảm giác "Website đóng băng thế giới game" khi tương tác (Heavy Modal Interruption)
Status: FIXED

Files changed:
- `client/src/game.css`

Implementation:
1. Loại bỏ lớp overlay đen mờ toàn màn hình (`bg-black/60 backdrop-blur-sm`), chuyển `#action-panel` thành dạng khung bảng tin góc dưới bên phải (`pointer-events: none` cho container, `pointer-events: auto` cho thẻ nội dung).
2. Người chơi vẫn nhìn thấy toàn cảnh thế giới game, nhân vật của mình và đồng đội di chuyển xung quanh trong lúc mở bảng hành động.
3. Thanh tiến độ công việc trên đầu nhân vật trong Phaser Canvas (`progressBar`) hiển thị rõ ràng, không bị modal đen che khuất.

Tested:
- Bấm E mở ActionPanel: bảng xuất hiện gọn gàng ở góc dưới bên phải màn hình, thế giới game phía sau vẫn chuyển động sống động.

---

## ISSUE-04 — Hoàn toàn không có âm thanh (Zero Audio Feedback)
Status: FIXED

Files changed:
- `client/src/game/soundManager.ts` (Tạo mới)
- `client/src/scenes/MainScene.ts`
- `client/src/ui/hudView.ts`
- `client/src/ui/actionPanel.ts`

Implementation:
Xây dựng module `SoundManager` sử dụng Web Audio API thuần túy (synthesizer), không phụ thuộc bất kỳ file âm thanh ngoài nào, không phát sinh dung lượng tải về:
- `playStep()`: Tiếng bước chân nhẹ nhàng khi di chuyển (tần suất ~320ms/bước).
- `playPick()`: Âm thục trầm ấm khi lấy kiện vật tư từ kho.
- `playDeliver()`: Hợp âm đôi trong trẻo khi giao kiện vật tư thành công.
- `playScore()`: Hợp âm rộn rã ăn mừng (C5-E5-G5-C6) khi được cộng điểm.
- `playAlert()`: Âm báo chú ý khi có biểu quyết, sự cố hoặc đồng đội ping vị trí.
- `playClick()`: Âm bấm phím UI xúc giác.
- Nút Bật/Tắt âm thanh (🔊 / 🔇) đặt trực tiếp trên thanh điều khiển người chơi của HUD.

Tested:
- Nhặt kiện hàng, giao hàng, di chuyển, click nút và cộng điểm: Hệ thống âm thanh phản hồi tức thì, mượt mà và không bị trễ.

---

## ISSUE-05 — Nghẽn cổ chai nhân lực trong Multiplayer 60 người (`manpower = 3`)
Status: FIXED

Files changed:
- `server/src/gameEngine.ts`
- `server/src/__tests__/gameEngine.test.ts`

Implementation:
Thêm cơ chế tự động mở rộng trần nhân lực linh hoạt theo quy mô phòng:
`this.manpower.total = Math.max(TOTAL_MANPOWER_UNITS, Math.min(8, this.getOnlinePlayerCount()))`.
- Khi chơi solo: Giữ nguyên 3 đơn vị nhân lực tiêu chuẩn.
- Khi phòng đông người (multiplayer 6–10 người): Trần nhân lực tự động nâng lên tối đa 8 đơn vị, giúp tất cả các thành viên trong đội đều có thể tham gia thi công công trình song song mà không bị khóa hành động.
- Khi người chơi mất kết nối hoặc thoát: Nhân lực tự động cân chỉnh lại an toàn.

Tested:
- Unit test `ISSUE-05: Dynamic Manpower scales with online players (up to 8)` trong `gameEngine.test.ts` PASS 100%.

---

## ISSUE-06 — Quãng đường di chuyển quá dài, thiếu cơ chế Chạy nhanh (Sprint / Shift)
Status: FIXED

Files changed:
- `client/src/scenes/MainScene.ts`
- `client/src/ui/hudView.ts`

Implementation:
1. Đăng ký phím `SHIFT`. Khi giữ Shift:
   - Khi không mang kiện hàng: Tốc độ di chuyển tăng 1.45x (`261 px/s`).
   - Khi đang mang kiện hàng: Tốc độ tăng 1.25x (`225 px/s`).
2. Bổ sung nhãn phím hướng dẫn `<kbd>Shift</kbd><span>Chạy</span>` trên thanh phím tắt HUD.

Tested:
- Nhấn giữ Shift: Nhân vật di chuyển nhanh hơn rõ rệt, rút ngắn thời gian di chuyển qua tuyến đường vòng phía Bắc xuống dưới 8 giây.

---

## ISSUE-07 — Điểm tương tác thiếu chỉ báo hình ảnh dưới mặt đất (Ground Hotspots)
Status: FIXED

Files changed:
- `client/src/scenes/MainScene.ts`

Implementation:
1. Tạo layer đồ họa `groundHotspotsGraphics` ở mặt đất (depth: 0).
2. Vẽ vòng sáng trực quan:
   - Vòng tròn vàng nhấp nháy (pulsing ring) dưới chân điểm mục tiêu đang cần đến (`waypoint`).
   - Vòng tròn màu ngọc lục bảo (emerald ring, bán kính 46px) kích hoạt sáng rực rỡ khi người chơi bước vào phạm vi tương tác của POI gần nhất.

Tested:
- Tiếp cận bất kỳ POI nào: Mặt đất hiện vòng tròn sáng xanh ngọc đánh dấu chính xác phạm vi tương tác.

---

## ISSUE-08 — Xung đột tương tác tại hai điểm sửa cầu bờ Tây (Bridge Tasks Overlap)
Status: FIXED

Files changed:
- `client/src/scenes/MainScene.ts`

Implementation:
Trong thuật toán quét `checkNearestPoi()`:
- Nếu `m2.bridgeRepairTask1` đã hoàn thành, hệ thống tự động bỏ qua `BRIDGE_TASK_1` và ưu tiên chọn `BRIDGE_TASK_2`.
- Thiết lập ngưỡng ổn định vị trí (hàng rào 28px): Khi người chơi đang đứng trong khu vực sửa cầu bờ Tây, POI được giữ cố định, không còn hiện tượng nhảy qua lại giữa 2 task chỉ vì người chơi nhích 1 pixel.

Tested:
- Đứng tại khu vực mố cầu bờ Tây trong Nhiệm vụ 2: Tương tác cố định ổn định, không bị chập chờn.

---

## ISSUE-09 — Hiệu ứng chữ nổi nhận điểm (+ĐIỂM) và phản ứng trực quan
Status: FIXED

Files changed:
- `client/src/scenes/MainScene.ts`

Implementation:
Thêm phương thức `showFloatingText(x, y, text, color)`:
Khi nhận được snapshot mới có `totalScore` tăng, game tự động bắn chữ nổi `+X ĐIỂM!` màu vàng kim từ đầu nhân vật bay lên trên không kèm hiệu ứng mờ dần trong 1.3 giây, đồng thời phát âm thanh `playScore()`.

Tested:
- Hoàn thành khảo sát/nhiệm vụ: Chữ `+2 ĐIỂM!`, `+8 ĐIỂM!` bay lên nổi bật trên đầu nhân vật.

---

## ISSUE-11 — Hệ thống Ping nhanh vị trí trên bản đồ cho đồng đội
Status: FIXED

Files changed:
- `shared/src/types.ts`
- `server/src/gameEngine.ts`
- `server/src/__tests__/gameEngine.test.ts`
- `client/src/scenes/MainScene.ts`
- `client/src/ui/hudView.ts`

Implementation:
1. Bổ sung loại Intent `PING_LOCATION` vào `ClientIntent`.
2. Khi người chơi nhấn phím `G`: Client gửi tọa độ hiện tại tới server.
3. Server ghi nhận và phát thông điệp Audit Event: `${player.name} 📍 đã phát tín hiệu tại [Tên địa điểm]!`.
4. Toàn bộ người chơi trong phòng nhận được thông báo Toast với biểu tượng 📍 kèm âm thanh báo động `playAlert()`.
5. Trên màn hình game của người chơi phát ra hiệu ứng sóng xung kích màu xanh lam (expanding ripple ring).

Tested:
- Unit test `ISSUE-11: Player can ping location and broadcast via audit events` trong `gameEngine.test.ts` PASS 100%.

---

# Partially fixed
*(Không có)*

---

# Not implemented
- **ISSUE-10 (P2): Lực đẩy va chạm mềm giữa các người chơi (Soft Player-Player Separation)**
  - *Lý do:* Để tránh nguy cơ làm lệch tọa độ nội suy trong mạng nhiều người chơi khi đang chạy thử nghiệm cục bộ, đã hoãn tính năng lực đẩy vật lý mềm giữa sprite người chơi để kiểm thử sâu hơn ở môi trường mạng thực tế. Thay vào đó, hệ thống xếp tầng nameplate dọc và vòng viền màu sắc riêng biệt cho từng người chơi vẫn hoạt động ổn định.

---

# Requires multiplayer verification
1. **Dynamic Manpower (ISSUE-05):** Cần thử nghiệm với phòng thi đấu thực tế 8–10 client đồng thời kết nối để quan sát hành vi tranh chấp tài nguyên khi 8 người cùng bấm thi công tại các POI khác nhau.
2. **Ping System (ISSUE-11):** Cần kiểm tra độ trễ hiển thị hiệu ứng Ping giữa hai màn hình máy tính khác nhau qua mạng LAN / Wi-Fi trường học.

---

# Regression check
- Movement: **PASS** (4 hướng, đường chéo, chạy nhanh Shift, dừng chân khi đâm tường)
- Collision: **PASS** (Không đi xuyên hồ nước/kênh/nhà, vượt qua mọi bài kiểm tra va chạm)
- Interaction: **PASS** (Vòng sáng POI, phím E, ActionPanel dạng side drawer)
- Quest: **PASS** (Nhiệm vụ 1, 2, 3 hoàn thành trọn vẹn 100 điểm)
- Networking: **PASS** (Client Intent / Server Snapshot nhất quán, Ping Intent hoạt động tốt)
- Team: **PASS** (Nhân lực mở rộng động theo số người)
- Scoreboard: **PASS** (Hiển thị điểm chính xác, chữ nổi `+ĐIỂM` bay mượt)

---

# Remaining high-impact issues
1. **Âm nhạc truyền thống bản địa (BGM):** Hiện tại `SoundManager` đã đảm nhiệm toàn bộ SFX bằng Web Audio synthesizer chất lượng cao. Nếu dự án có thêm các bản thu nhạc cụ dân tộc / bài chòi / nhã nhạc định dạng `.mp3`/`.ogg` có bản quyền, có thể nạp thêm vào làm nhạc nền nền cho từng vùng đất.
2. **Hiệu ứng thời tiết từng vùng miền:** Có thể cân nhắc thêm hiệu ứng hạt nhẹ (mưa bay Tràng An, lá rơi Hà Nội) để tăng chiều sâu cảnh quan.
