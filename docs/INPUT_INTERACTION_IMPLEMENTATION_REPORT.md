# INPUT / INTERACTION IMPLEMENTATION REPORT

Ngày 04/10/2026 (Asia/Saigon). Phạm vi: hệ thống điều khiển và tương tác chung cho bảy bản đồ. Không thay nội dung quest, art, bản đồ Hà Tĩnh, collision geometry hoặc kiến trúc đội/phòng.

## File sửa / bổ sung

- Mới: `client/src/game/inputController.ts`, `shared/src/interactions.ts`.
- Client: `client/src/scenes/MainScene.ts`, `client/src/main.ts`, `client/src/network/socketClient.ts`, `client/src/ui/touchControls.ts`, `hudView.ts`, `actionPanel.ts`, `client/src/game.css`.
- Shared: `shared/src/index.ts` export catalogue/resolver.
- Server: `server/src/gameEngine.ts`, `server/src/server.ts`; test mới `server/src/__tests__/inputInteraction.test.ts`.
- QA mới: `scripts/verify-input-controls.mjs`, `verify-input-ack.mjs`, `verify-input-network.mjs`, `verify-input-multiplayer.mjs`, `prepare-input-ui-fixture.mjs`. Full quest regression dùng script hiện có `verify-regions.mjs`, không sửa script đó.
- Tài liệu: report này, HANDOFF, PROJECT_STATUS, TESTING, README, ACCOUNT_TRANSFER; bằng chứng JSON/screenshot liệt kê bên dưới. `.gitignore` thêm bundle QA `dist-input/`.

Working tree vốn có nhiều thay đổi của các agent trước; danh sách trên chỉ là scope của lượt này. Không commit/reset/stash hoặc xóa asset cũ.

## Control scheme cuối cùng

| Nền tảng | Control | Behavior |
| --- | --- | --- |
| PC | WASD / Arrows | Di chuyển; phím cùng hướng không nhân đôi tốc độ, hướng đối nghịch triệt tiêu |
| PC | Shift | Sprint theo cấu hình cũ: 1.45× bình thường / 1.25× khi mang kiện |
| PC | E | Thực hiện primary action hợp lệ; mở drawer khi cần chọn phương án |
| PC | G | Ưu tiên hủy job đang chạy; sau đó đặt kiện đang cầm; còn lại ping |
| PC | M | Bật/tắt overview, không xóa trạng thái MOVE đang giữ |
| PC | Esc | Đóng menu/drawer/sổ/nhiệm vụ đang mở; nếu không có thì mở Menu/Cài đặt |
| Mobile | Joystick trái | Analog: đẩy nhẹ đi; độ lệch >= 0.92 chạy, không thêm nút sprint |
| Mobile | E lớn / G nhỏ | Cùng action abstraction và resolver với desktop |
| Mobile | Map / Menu trên HUD | Cùng MAP/MENU với desktop |

F2 debug cũ vẫn giữ, mặc định tắt; không thêm phím gameplay theo quest.

InputController gom MOVE/SPRINT thành state qua `read()`, các action cạnh qua `request(INTERACT/SECONDARY_ACTION/MAP/MENU)`. Gameplay không đọc keyboard hoặc touch riêng. Key bindings và normalization nằm trong cùng module.

Menu chỉ khóa input của người mở, không pause phòng multiplayer. Reset phím/joystick khi đổi lock, blur, hidden-tab, disconnect/rejoin; sau khi đóng menu cần thao tác mới, không tự tiếp tục phím/touch cũ. Khi overview mở vẫn đi và tương tác được; di chuyển không tự đóng overview. Modal bắt buộc như briefing/voting/results vẫn khóa gameplay; drawer lựa chọn không khóa movement.

## Interaction resolver

`getInteractionActions(snapshot, playerId)` là catalogue chung cho prompt, drawer và eligibility START_JOB trên server. Mỗi action có id, targetId, interaction type, label/description, tọa độ, range72, available, priority, intent và serverValidation. Catalog bao phủ các hành động đã tồn tại, không tạo cơ chế quest mới.

- Candidate gồm POI và từng kiện DROPPED có ID riêng.
- Chỉ hiện action phù hợp phase/state, cargo ownership, vật tư, ngân sách, nhân lực và reservation job.
- Resolver kiểm range ở cả vị trí predicted và snapshot authoritative. Không hiện prompt dựa trên predicted-only rồi chắc chắn bị reject vì server chưa tới.
- Thứ tự: ưu tiên delivery100, pickup ground/return90, job80, plan70, stock60; trong cùng priority chọn gần nhất, tie theo id.
- Giữ candidate trước nếu cùng priority và chỉ xa hơn tối đa12px, nhưng không giữ ngoài range hoặc khi action không còn hợp lệ.
- HQ mở drawer để người chơi tự chọn; không tự quyết phương án. Drawer tái sử dụng catalogue, giữ mô tả tradeoff/phục vụ người dân của phương án cũ.
- E/G prompt đổi theo context, hidden/disabled theo lock; label không được thay text node liên tục khi nội dung không đổi. Vòng sáng dùng candidate, kể cả kiện rơi.
- G là action phụ của context: cancel > drop > ping. Đây là các hành vi đã có, không thêm quest riêng.

Điều kiện client chỉ là dự báo từ snapshot. Đồng đội có thể đổi state sau snapshot; server vẫn có quyền reject và UI hiển thị reason.

## ACK / feedback / authority

- MainScene thực thi action qua một đường chung cho keyboard, nút HUD, mobile và drawer.
- Một action pending tại một thời điểm, cooldown300ms và bỏ keyboard autorepeat. Khi drain MOVE, tạm ngừng sinh path mới; khi đã gửi action có thể tiếp tục đi (job tại chỗ vẫn có thể bị hủy bởi di chuyển theo luật cũ).
- Đợi các MOVE đang dự đoán được gửi trước action, giới hạn drain2s. Timeout/đổi context báo thất bại, không giả success.
- Pending hiển thị trên E/G và drawer. Success chỉ sau ACK; reject hiện reason. Client không tự đặt cargo/cộng điểm/hoàn thành quest.
- ID dùng nonce phiên + timestamp + counter, hoạt động cả HTTP LAN (không phụ thuộc crypto.randomUUID secure context).
- SocketClient không buffer intent khi offline hoặc chưa joined/rejoined. CONNECTED chỉ mở khóa khi nhận joined_room thành công.
- Mute/volume vẫn lưu theo cơ chế cũ, thêm khả năng chỉnh trong Menu. Toast dùng textContent, giới hạn tối đa3 item hiển thị.

Server giữ mọi mutation và kiểm người chơi/room, khoảng cách, phase/state, manpower và ownership vật tư theo handlers hiện có.

- Ba inquiry SURVEY_BRIDGE / RECEIVE_FEEDBACK_C / CROSS_CHECK_CLINIC đi qua GameEngine.handleIntent, trả đúng actionId và cùng receipt path.
- START_JOB chỉ nhận job/target đang available trong catalogue; job cùng type+target được giữ bởi activeJob. Tránh hai người cùng nghiệm thu/triển khai tính điểm lặp.
- Explicit crateId không fallback sang kiện khác/kho nếu kiện đã bị người khác lấy.
- Receipt gồm ACK và fingerprint type/payload, scoped playerId+actionId, bounded2000 mỗi phòng, cleared khi reset. Retry đúng ID trả cùng ACK; đổi payload với ID đã dùng bị reject. Retry thao tác mới phải dùng ID mới.
- Vai trò vẫn chỉ là gợi ý, không độc quyền; không thêm role claim/team architecture.
- Cargo giữ trong disconnect grace và phục hồi bằng session hiện có, không thêm persistence.

## Kiểm tra đã chạy

| Check | Kết quả / giới hạn |
| --- | --- |
| Shared build + npm run typecheck | PASS shared/server/client |
| npm test | 102/102 PASS,7 suites; gồm95 regression cũ và7 test mới |
| Lần cuối sau các chỉnh nhỏ | 22/22 PASS: inputInteraction + gameEngine + hanoiSolo |
| Server build | PASS |
| Client build -- --outDir dist-input | PASS; warning bundle Phaser >500kB vẫn còn |
| git diff --check | PASS; warning LF/CRLF của working tree cũ |
| verify-input-controls.mjs | PASS8 nhóm: keys, sprint, repeats, typing, map/menu lock, analog joystick, hai pointer/ E/G, blur/hidden/lost-capture; DOM/EventTarget mock |
| verify-input-ack.mjs | PASS actual executeAction bundle với renderer/socket mock, ACK350ms: pending, suppress spam, reject reason, không mutate cargo ở client |
| verify-input-network.mjs | PASS actual SocketClient với transport mock: khóa đến joined/rejoined, không replay offline |
| verify-input-multiplayer.mjs | PASS2 Socket.IO thật: tranh kiện/NPC objective, cargo reconnect, duplicate receipt, reject reason;350ms delayed ACK consumption là giả lập, không phải latency LAN thật |
| verify-regions.mjs,7 maps | PASS mỗi map M1–M3=100,38 routes/map, cargo reconnect/co-op; chạy ở instance QA3112 |
| Browser desktop | Taps WASD/Arrows/Shift+d có thay đổi vị trí predicted=authoritative; E nhặt, G đặt/ping, M đổi overview, Menu/Esc đóng; không phải held-key feel playtest |
| Browser mobile viewport | 390×844 và844×390; E/G click thực nhận ACK, Map/Menu có control; touch targets joystick112/92,E84,G64,Map/Menu>=44px; không overlap giữa controls/HUD |
| Browser joystick | Một pointer drag di chuyển ~27.89px, authoritative khớp; nhả input về0; không phải hai tay thật |
| Browser reload | Rejoin khóa input trong lúc kết nối rồi trở lại prompt đúng; không mất state |

Không có lint script trong package.json; không cài thêm lint framework. Không chạy root build để tránh ghi đè client/dist.

Bằng chứng:
- `docs/input-controls-unit-qa.json`, `input-ack-unit-qa.json`, `input-network-unit-qa.json`.
- `docs/input-multiplayer-qa.json`, `input-runtime-qa.json` và `input-<mapId>-runtime-qa.json`.
- `docs/input-ui-qa.json`.
- `docs/screenshots/input-landscape-qa.png`, `input-portrait-qa.png`.

## Runtime / cách thử lại

Bản QA riêng phục vụ `client/dist-input` tại http://127.0.0.1:3112. Cổng là mốc kiểm tra, cần kiểm listener trước khi dùng; không lưu PID như dữ kiện bền vững.

Tại cuối lượt này chỉ thấy3112 trong các cổng3102/3110/3111/3112. Không được suy ra rooms cũ trong handoff còn tồn tại hay đã backup; C13 chưa được chứng nhận là đã migrate live3102. Không restart/tắt instance cũ; client/dist được giữ nguyên.

Chạy lại kiểm tra nhẹ:
```powershell
npm run build --workspace=shared
npm run typecheck
npm test
node scripts/verify-input-controls.mjs
node scripts/verify-input-ack.mjs
node scripts/verify-input-network.mjs
```

Socket QA tạo room, chỉ chạy ở instance riêng:
```powershell
$env:PREVIEW_URL='http://127.0.0.1:3112'
node scripts/verify-input-multiplayer.mjs
$env:QA_INCLUDE_HANOI='1'
$env:QA_REPORT_PREFIX='input'
node scripts/verify-regions.mjs
```

Fixture cho E/G browser là script prepare-input-ui-fixture.mjs: chỉ tạo kiện cạnh player trong phòng QA INPUT_UI_QA bằng MOVE/pick/drop được server validate, không sửa engine hoặc teleport qua collision.

## Known issues / kiểm tra sau

- Multi-touch hai tay trên điện thoại/tablet thật, giữ phím dài khi tương tác, sprint feel, accessibility focus trapping trong Menu và latency/loss mạng thật chưa được chứng nhận. Pointer/event mocks và một drag không thay thế các playtest đó.
- ACK timeout có thể là kết quả chưa xác định; snapshot server là truth. Không hiện success khi chưa có ACK.
- Receipt bị eviction sau2000 action/phòng, không phải idempotency storage bền vững.
- C11 exact bridge floor/rails và C13 live migration vẫn mở; không thay collision hoặc art để xử lý chúng trong task này.
- Encoding damage ở HostView/VotingModal và historical docs còn giữ. ActionPanel được chuẩn hóa trong scope, chữ tiếng Việt của drawer mới đã sạch.
- Không có release/deploy production, lớp học60 người hoặc team ranking được kiểm chứng ở lượt này.

Agent sau đọc PROJECT_STATUS/HANDOFF mới nhất và chờ task. Không tự mở rộng quest/map hay triển khai C11/C13 vì chúng được liệt kê ở đây.
