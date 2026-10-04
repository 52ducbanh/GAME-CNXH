# PROJECT HANDOFF

**Tiếp quản bằng tài khoản mới:** đọc [docs/ACCOUNT_TRANSFER.md](docs/ACCOUNT_TRANSFER.md), [AGENTS.md](AGENTS.md), phần hiện hành [PROJECT_STATUS](docs/PROJECT_STATUS.md) rồi phần Latest update dưới đây. Lượt bàn giao tài khoản trước task input chỉ sửa tài liệu; phần Latest update dưới đây ghi công việc phát triển mới và validation tương ứng. Các mục còn mở không phải lệnh tự thực hiện.

## Latest update — shared input / interaction, 2026-10-04

- PC: WASD/Arrows, Shift, E primary, G cancel/drop/ping, M overview, Esc Menu/close. Mobile: existing joystick + E84px/G64px + Map/Menu; analog joystick >=0.92 sprints. No quest-specific keys/maps/art changes.
- InputController owns keyboard/touch state and actions; shared interactions catalogue/resolver drives HUD, drawer and server START_JOB eligibility. Candidate includes dropped crates, valid-state/range filtering, priority +12px hysteresis. HQ choices remain deliberate; role stays advisory.
- MainScene drains pending MOVE before intent, pending/cooldown and ACK-only feedback; input reset on lock/blur/rejoin. Map keeps MOVE state, Menu locks only local input. SocketClient does not buffer offline/not-yet-rejoined actions.
- Inquiry helpers now go through handleIntent; server validates job+target/reservations and named crate claims. Player-scoped bounded ACK/fingerprint receipts reject changed payload reuse. Preserve14px swept movement, collision flags, server authority, cargo grace and3 quests.
- PASS: typecheck, shared/server/isolated-client build;102/102 tests; final focused22/22; unit event/ACK/network harnesses;2 real sockets race/rejoin/duplicate/reject;7 maps all3 quests=100,38routes/map. Browser E/G/Map/Menu, joystick drag and390×844/844×390 layout checked.
- NOT VERIFIED: physical two-hand multitouch, long held-key gameplay feel, real LAN loss/latency,60 users.350ms ACK delays are emulated; do not call these physical mobile or LAN PASS.
- QA bundle client/dist-input on loopback3112; original client/dist preserved. End-of-task listener check did not find3102/3110/3111; old RAM-room claims are historical. C11/C13 still open, no migration/restart/backup claim.
- Read docs/INPUT_INTERACTION_IMPLEMENTATION_REPORT.md for files, eligibility rules, test methods and reproducible scripts. Sources: client/src/game/inputController.ts, shared/src/interactions.ts, MainScene, touchControls, hudView, actionPanel, socketClient, gameEngine/server.
- Scope complete for implementation; wait for the user's next task rather than automatically doing playtests/C11/C13/TODO.

## Previous update — Codex collision C01–C13, 2026-10-04

- C01–C10/C12 implemented and verified with geometry tests and specified Socket.IO checks. C11 exact rendered bridge floor/rail alignment remains UNRESOLVED; nominal support bands are not a certified rail trace. C13 new logic is verified on isolated3111, but live3102 remains old to preserve RAM rooms VN2336/VN4705.
- Independent shore/support/public-ground/63 named-solid source: `scripts/collision-layout.json`; generator: `scripts/prepare-regions.py --geometry-only`; generated outputs: `shared/src/collisionLayout.ts`, `regionalMapData.ts`. Regeneration byte-identical. No asset replacement/redesign.
- Client/server/navigation share `CollisionState` from mission deployment/bridge flags. Deployed tents have rear/side walls and open door; server resolves overlaps. Corrected dry approaches and four mobile clinic positions retain interaction IDs. Navigation now shares segment checks and retries10px grid when20px misses a valid passage.
- Preserve14px foot radius, swept sliding, sprint/audio, cornerAssist0, prediction/reconcile/rejoin, peer pass-through, server authority and three quests in the existing multiplayer room mode. No team architecture rewrite or solver replacement.
- PASS: typecheck, shared/server/isolated-client build,95/95 tests; real Socket.IO three quests/100points and cargo reconnect on seven maps. Two-client construction flags verified on seven maps; live overlap recovery at Hanoi B/Thanh Hoa B/Ha Tinh C. Continuous WASD, human audio listening and exact C11 rail alignment NOT verified.
- Runtime3111: `CLIENT_DIST_PATH=client/dist-collision` (absolute path), loopback only. Original client/dist and processes3102/3110 preserved. Fresh lake tunnel probe:3102 accepts;3110/3111 reject. Do not restart3102 merely because online count is zero.
- Report/limits/entry points: `docs/COLLISION_IMPLEMENTATION_REPORT.md`; evidence `docs/collision-runtime-qa.json`, per-map JSONs, `collision-runtime-versions.json`, `collision-courtyard-qa.json`. Read latest report before continuing. Historical handoffs below are not current completion claims.

## Previous Codex update — movement/collision/audio, 2026-10-03

- Shared `movement.ts`: swept contact/normal sliding; named 14px foot radius used by client/server. Server checks every MOVE path segment; client batches swept points at ~66ms and flushes the last step after key release. No server speed-budget protocol added.
- Fixed drawer `.hidden` CSS and its movement lock; real dialogs still lock. Blur/visibility/disconnect clear input/audio. Rejoin rebases prediction and discards stale ACKs. Spawn/bridge-failure recovery is server-owned.
- Ten cached Kenney Impact Sounds CC0 OGGs: stone/grass/wood footsteps and low-gain bump. Distance-based local steps, contact latch, persisted mute/volume, source/listener cleanup. Browser gesture unlock and10/10 decode verified; **not human-listened**.
- F2 toggles nearby foot/path/water overlay, contact normals, predicted/authoritative positions, correction reason and deduplicated300ms blocked samples. Off by default. Corner assist disabled (`cornerAssistPx:0`), not marked implemented.
- Preserved seven maps, three quests, solo-as-one-player-room, peer pass-through, Gemini manpower/votes/UX and generated art. No new gameplay pathfinding or hard player collision.
- Validation: typecheck/build PASS;68/68 tests; two real Socket.IO clients,44 MOVE packets,0 rejection, overlap/reconnect PASS. Browser key taps/drawer/mute/reload/audio-decode checked. Not a60-person, mobile or continuous human-control/listening playtest.
- Current20-case report: `docs/GAMEPLAY_UX_IMPLEMENTATION_REPORT.md`; evidence: `docs/movement-runtime-qa.json`, `docs/movement-audio-qa.json`. Main entry points: `shared/src/movement.ts`, `movementFeedback.ts`, `client/src/scenes/MainScene.ts`, `game/soundManager.ts`, `game/movementDebug.ts`, `server/src/gameEngine.ts`.
- Remaining: human listening/feel, mobile, blur/held-key stress, latency/loss and classroom load; earlier Vietnamese encoding damage in ActionPanel/HostView/VotingModal. Map art/path mismatches were not globally redesigned. “60 people /7 teams” is a target, not an implemented team/cap system.

## Previous Gemini handoff (historical)

### Current state
Game "QUÊ MÌNH ĐỨNG ĐẦU!" là trò chơi giáo dục 2D Top-Down học tập Chủ nghĩa Xã hội Khoa học & Nhà nước pháp quyền XHCN Việt Nam, hỗ trợ 7 vùng miền (Hà Nội, Hải Phòng, Quảng Ninh, Ninh Bình, Thanh Hóa, Nghệ An, Hà Tĩnh) với kiến trúc multiplayer tối đa 60 người (chia ~7 đội/thành phố).
Hiện tại game đã hoàn thành đợt nâng cấp chất lượng gameplay/UX toàn diện: mở rộng walkability, bổ sung Web Audio procedural synthesizer, cơ chế chạy nhanh Sprint, trượt tường mượt mà, nhân lực mở rộng động theo số lượng người chơi (Dynamic Manpower), hệ thống Ping báo hiệu đồng đội, vòng sáng chỉ báo POI dưới đất, và giao diện ActionPanel dạng side drawer không che khuất màn hình. Toàn bộ 58/58 unit tests và kiểm thử 6 vùng miền (100 điểm, 38 tuyến đường) đều pass 100%.

## Work completed in this session
- **Mở rộng Walkability sân Tây Hà Nội (ISSUE-01)**:
  - File chính: `shared/src/mapData.ts`
  - Hành vi: Bổ sung hành lang kết nối trực tiếp HQ [155, 255] <-> Zone A [292, 390] <-> Warehouse [321, 746] (rộng 80px), loại bỏ hoàn toàn tường vô hình ở khoảng sân phía Tây.
- **Dừng animation khi va chạm & sửa trượt tường (ISSUE-02)**:
  - File chính: `client/src/scenes/MainScene.ts`
  - Hành vi: Khi nhân vật đâm vào vật cản (`movedDist <= 0.2px`), sprite lập tức dừng animation bước chân và chuyển về idle frame. Bổ sung vector trượt tường mượt mà khi đi chéo.
- **Tinh gọn ActionPanel thành side drawer (ISSUE-03)**:
  - File chính: `client/src/game.css`, `client/src/ui/actionPanel.ts`
  - Hành vi: Bỏ overlay đen mờ toàn màn hình; đưa bảng hành động sang góc dưới bên phải. Thế giới game, nhân vật và thanh tiến độ trên đầu (`progressBar`) luôn hiển thị trực quan.
- **Tích hợp Web Audio Procedural Synthesizer (ISSUE-04)**:
  - File chính: `client/src/game/soundManager.ts` (mới), `client/src/ui/hudView.ts`, `client/src/scenes/MainScene.ts`, `client/src/ui/actionPanel.ts`
  - Hành vi: Bổ sung âm thanh bước chân, tiếng nhặt/giao kiện hàng, hợp âm ăn mừng khi cộng điểm, âm báo chú ý/ping, và nút Bật/Tắt âm thanh (🔊 / 🔇) trên HUD.
- **Nhân lực động theo quy mô phòng (ISSUE-05)**:
  - File chính: `server/src/gameEngine.ts`, `server/src/__tests__/gameEngine.test.ts`
  - Hành vi: Tự động co giãn trần nhân lực `manpower.total = Math.max(3, Math.min(8, onlineCount))`. Phòng 6–10 người chơi không còn bị nghẽn ở mức 3 nhân lực.
- **Cơ chế Chạy nhanh Sprint (ISSUE-06)**:
  - File chính: `client/src/scenes/MainScene.ts`, `client/src/ui/hudView.ts`
  - Hành vi: Giữ phím `SHIFT` để tăng tốc độ di chuyển lên 1.45x (261 px/s khi không vác đồ) và 1.25x (225 px/s khi mang kiện hàng). Bổ sung phím gợi ý trên HUD.
- **Vòng sáng chỉ báo trực quan dưới đất (ISSUE-07)**:
  - File chính: `client/src/scenes/MainScene.ts`
  - Hành vi: Vẽ vòng tròn pulsing màu vàng kim dưới chân waypoint và vòng tròn xanh ngọc khi bước vào phạm vi tương tác của POI gần nhất.
- **Khắc phục xung đột 2 điểm sửa cầu bờ Tây (ISSUE-08)**:
  - File chính: `client/src/scenes/MainScene.ts`
  - Hành vi: Tự động chuyển ưu tiên sang Task 2 khi Task 1 đã hoàn thành và bổ sung ngưỡng ổn định vị trí 28px để xóa bỏ hiện tượng nhảy giật qua lại giữa 2 task khi đứng ở đầu cầu.
- **Chữ số nổi nhận điểm `+ĐIỂM!` (ISSUE-09)**:
  - File chính: `client/src/scenes/MainScene.ts`
  - Hành vi: Khi điểm số tăng, chữ số nổi màu vàng kim bay lên từ đầu nhân vật và mờ dần trong 1.3s kèm âm thanh ăn mừng.
- **Hệ thống Ping báo hiệu đồng đội (ISSUE-11)**:
  - File chính: `shared/src/types.ts`, `server/src/gameEngine.ts`, `client/src/scenes/MainScene.ts`, `client/src/ui/hudView.ts`
  - Hành vi: Bấm phím `G` để gửi intent `PING_LOCATION`. Toàn bộ phòng nhận được Toast thông báo `📍`, phát âm thanh cảnh báo và vẽ hiệu ứng vòng sóng xung kích trên bản đồ.

## Files changed
- `shared/src/mapData.ts`: Bổ sung đường nối sân Tây (HQ <-> Zone A <-> Warehouse) cho Hà Nội.
- `shared/src/types.ts`: Thêm `PING_LOCATION` vào enum `ClientIntent['type']`.
- `server/src/gameEngine.ts`: Triển khai `updateManpowerTotal()` và xử lý intent `PING_LOCATION`.
- `server/src/__tests__/gameEngine.test.ts`: Thêm 2 unit test cho Dynamic Manpower và Ping Location.
- `client/src/game/soundManager.ts` (file mới): Module Web Audio API tổng hợp âm thanh xúc giác zero-dependency.
- `client/src/scenes/MainScene.ts`: Xử lý phím Shift (sprint), phím G (ping), wall-sliding, dừng animation khi va chạm, ground hotspots, chữ nổi cộng điểm, ổn định POI cầu.
- `client/src/ui/hudView.ts`: Thêm nút toggle âm thanh, cập nhật phím tắt hướng dẫn (`Shift`, `G`), phát âm báo khi có Toast mới.
- `client/src/ui/actionPanel.ts`: Thêm phản hồi âm thanh cho các nút bấm hành động (pick, deliver, click).
- `client/src/game.css`: Thiết lập layout side drawer cho `#action-panel` và animation toast.
- `docs/GAMEPLAY_UX_AUDIT.md`: Báo cáo audit gameplay chuyên sâu.
- `docs/GAMEPLAY_UX_IMPLEMENTATION_REPORT.md`: Báo cáo nghiệm thu chi tiết 10 issue.

## Important architecture / decisions
- **Server Authoritative**: Server là nguồn chân lý duy nhất cho vị trí, vật tư, ngân sách, nhân lực, điểm số và điều kiện nhiệm vụ. Client chỉ gửi intent và đọc snapshot; không dựng trạng thái giả trên client.
- **Single Mode Architecture**: Không tách riêng chế độ singleplayer; một người chơi (solo) là một phòng multiplayer có 1 người. Logic solo (như tự động thông qua biểu quyết khi chỉ có 1 người online) được xử lý trực tiếp trong `GameEngine`.
- **7 Vùng đất = 7 Bản đồ/Phòng**: Bảy vùng (`hanoi`, `hai-phong`, `quang-ninh`, `ninh-binh`, `thanh-hoa`, `nghe-an`, `ha-tinh`) chia sẻ chung bộ quy tắc 3 nhiệm vụ và giao diện.
- **Không tự ý sửa file được sinh (Generated outputs)**: `shared/src/regionalMapData.ts`, `client/src/game/regionalLayers.ts` và `client/src/game/hanoiSceneLayers.ts` là file do script Python sinh ra; không sửa tay trực tiếp các file này.
- **Không tải asset âm thanh nặng**: Dùng Web Audio API procedural synthesizer (`soundManager.ts`) để đảm bảo không bị lỗi 404 file tĩnh, không tăng dung lượng bundle và tuân thủ autoplay policy trình duyệt.

## Behavior that must be preserved
- **Quy tắc 3 nhiệm vụ CNXHKH**: M1 (Trạm y tế cố định/lưu động), M2 (Xử lý cầu gãy: Sửa cầu hoặc Tuyến vòng), M3 (Bảo vệ quyền lợi Cụ C1, C2 và kiểm kê kho).
- **Tính khả thi solo & co-op**: 1 người chơi vẫn hoàn thành trọn vẹn 100 điểm mà không bị khóa cứng bởi điều kiện số lượng thành viên; nhiều người chơi giúp chia việc hoàn thành nhanh hơn.
- **Solo Instant Vote**: Khi chỉ có 1 người trong phòng, biểu quyết tự động thông qua ngay lập tức để không làm gián đoạn nhịp chơi của người solo.
- **Dẫn đường BFS**: Thuật toán `findWalkingRoute` trong `shared/src/navigation.ts` luôn vẽ đường đi bộ né vật cản và tự chuyển hướng lên cầu phía Bắc khi cầu chính bị gãy.

## Known issues
- **Requires multiplayer verification**:
  - *Dynamic Manpower*: Cần kiểm thử thực tế trên phòng lớp học 8–10 client đồng thời kết nối để xác nhận phản hồi server khi 8 người cùng thực hiện job khác nhau.
  - *Ping System*: Cần kiểm thử độ trễ hiển thị thông báo Toast và vòng sóng giữa hai máy khác nhau qua mạng LAN / Wi-Fi.
- **Potential enhancement (Non-blocking)**:
  - Hiện tại game dùng nhạc cụ synthesizer procedurally sinh ra. Nếu sau này có file nhạc cụ dân tộc `.ogg`/`.mp3` có bản quyền, có thể thêm vào làm ambient background music cho từng vùng.

## Work in progress
`None`. Toàn bộ mã nguồn đã hoàn tất sạch sẽ, compile thành công, không có TODO dang dở.

## Recommended next entry points
Nếu Codex cần tiếp tục làm việc trên các hệ thống, hãy đọc theo thứ tự sau (tối đa 7 file):
1. `shared/src/constants.ts`: Toàn bộ hằng số thời gian, chi phí phương án, điểm số và tốc độ.
2. `server/src/gameEngine.ts`: Trái tim logic của toàn bộ gameplay, quản lý intent, nhiệm vụ, vật tư, nhân lực và biểu quyết.
3. `client/src/scenes/MainScene.ts`: Renderer chính điều khiển nhân vật, camera, va chạm, âm thanh, di chuyển và hiển thị Phaser.
4. `client/src/ui/actionPanel.ts`: Xử lý giao diện tương tác với tất cả các POI (Trụ sở, Kho, Trạm y tế, Cầu, Dân cư).
5. `shared/src/missionGuide.ts`: Nguồn chân lý duy nhất tính toán bước đi tiếp theo (`guide.step`), mục tiêu (`guide.target`) và danh sách kiểm tra (`guide.checks`).
6. `client/src/game/soundManager.ts`: Bộ tổng hợp âm thanh Web Audio API.
7. `docs/GAMEPLAY_UX_IMPLEMENTATION_REPORT.md`: Báo cáo chi tiết các thay đổi và kết quả test của phiên này.

## Validation performed
- **`npm run typecheck`**: PASS 100% trên cả 3 workspace (`shared`, `server`, `client`) — 0 errors.
- **`npm test`**: PASS 58/58 tests (bao gồm 2 test mới cho Dynamic Manpower và Ping).
- **`npm run build`**: PASS — Client Vite bundle và Server build hoàn tất thành công.
- **`node scripts/verify-regions.mjs`**: PASS 6/6 vùng miền — 100 điểm, 38 tuyến đường, cargo reconnect và synchronized co-op.

## Important warnings
- **KHÔNG chạy `git reset --hard` hoặc `git checkout .`**: Working tree chứa các asset và báo cáo lịch sử cần được bảo toàn.
- **KHÔNG sửa tay các file generated**: `shared/src/regionalMapData.ts`, `client/src/game/regionalLayers.ts`, `client/src/game/hanoiSceneLayers.ts`.
- **KHÔNG chuyển đổi server authority thành client simulation**: Tất cả điểm số, tiến độ nhiệm vụ và vật tư phải do server phê duyệt qua intent.
- **KHÔNG xóa module `soundManager.ts`**: Hệ thống âm thanh procedural này đang phục vụ toàn bộ SFX của game mà không cần asset file nặng.
