# Kiểm tra hiện hành — refactor hoàn tất 04/10/2026

Kết quả mới: **132 tests/12 suites PASS**, typecheck ba workspace, shared/server/isolated-client build PASS; parity426 catalogue/guide +1489 ACK/snapshot checkpoints. Coverage, known FAIL visual modal và NOT TESTED ghi trong [PROJECT_STATUS](PROJECT_STATUS.md). Các số phía dưới là lịch sử.

Build shared trước server/tests. Để bảo toàn bundle đang phục vụ, lượt này chạy build từng workspace và dùng outDir client riêng, không gọi root build ghi đè client/dist:

```powershell
npm run build --workspace=shared
npm run typecheck
npm run build --workspace=server
npm run build --workspace=client -- --outDir dist-province-refactor
npm test
node scripts/verify-province-parity.mjs
```

Parity lấy source từ REFRACTOR_BASELINE Git (mặc định b767102), bundle baseline trong memory. Nó so catalogue/guide theo fixtures và full rule traces24 tổ hợp public-service + Hà Tĩnh100, ACK/JSON snapshot sau mỗi bước/reset/rejoin. Positions đặt trong rule fixtures; không nhận là MOVE/browser certification. Không giữ engine cũ trong production.

## Locality / canonical ownership

`provinceLocality.test.ts`:3 tests compose fixture ở module Nghệ An với timed objective AUDIT_RESULT; kiểm actions/guide/quest/marker/score/race/dedupe/pause/cancel/reset, đồng thời chứng minh registry production không có test objective. Không thêm fixture vào index/registry. `provinceModules.test.ts`:16 tests definitions/bindings/view/fresh room/reset. `gameplayBoundary.test.ts`:4 tests unknown/authority/projection và @ts-expect-error caller contract. `gameplayCapabilities.test.ts`:6 task/item/vote/resource/score/state tests.

Fixtures cho tests cũ nằm ở `server/src/__tests__/fixtures/gameplay.ts`, capture runtime qua factory; writable domain facts thuộc runtime. m1/m2/m3 và hatinhState getter là copies, không dùng làm test writer. Test full movement/collision vẫn chạy actual solver/authoritative segment checks trên bảy maps.

## QA client và socket — không ghi đè report lịch sử

Sau build, tạo thư mục evidence ignored rồi đặt QA_REPORT_PATH cho từng harness:

```powershell
New-Item -ItemType Directory -Path client/dist-province-refactor/qa -Force
$env:QA_REPORT_PATH='client/dist-province-refactor/qa/controls.json'
node scripts/verify-input-controls.mjs
$env:QA_REPORT_PATH='client/dist-province-refactor/qa/ack.json'
node scripts/verify-input-ack.mjs
$env:QA_REPORT_PATH='client/dist-province-refactor/qa/network.json'
node scripts/verify-input-network.mjs
```

Controls/executeAction/SocketClient harness dùng production bundle với DOM/renderer/transport mocks. ACK350ms chỉ delay consumer; không được gọi là Wi-Fi latency hoặc real mobile. Chạy socket harness vào **instance QA riêng đã xác minh source/build/cổng**. Lượt này dùng loopback3124, không cam kết cổng đó còn trống/chạy ở máy khác. Không restart phiên người dùng.

Trong terminal riêng, sau khi xác minh cổng QA trống:

```powershell
$env:PORT='3124'
$env:SERVER_PORT='3124'
$env:HOST='127.0.0.1'
$env:PUBLIC_HOST='http://127.0.0.1:3124'
$env:CLIENT_DIST_PATH=Join-Path $PWD.Path 'client/dist-province-refactor'
node server/dist/server.js
```

Trong terminal QA:

```powershell
$env:PREVIEW_URL='http://127.0.0.1:3124'
$env:QA_ISOLATED='1'
$env:QA_REPORT_PATH='client/dist-province-refactor/qa/multiplayer.json'
node scripts/verify-input-multiplayer.mjs
$env:QA_REPORT_PATH='client/dist-province-refactor/qa/province-network.json'
node scripts/verify-province-network.mjs
$env:QA_REPORT_PATH='client/dist-province-refactor/qa/hatinh-runtime.json'
node scripts/verify-hatinh-runtime.mjs
```

verify-province-network mở bảy disposable rooms đồng thời,14 clients + replacement sockets; navigation/MOVE, duplicate receipts, reconnect cargo, objective đại diện, room isolation. QA_KEEP_OPEN=1 giữ fixtures sau PASS để browser join; kết thúc helper sau kiểm. Rejoin đúng thứ tự disconnect → peer thấy offline → join, không nối hai socket cùng token rồi coi disconnect của một socket là reconnect chuẩn.

verify-hatinh-runtime đi full Hà Tĩnh100 bằng Socket.IO/MOVE/range/dependencies/ticks thật, không teleport. QA_BROWSER_PAUSE=1 dừng tại RESCUE READY và RESULTS READY cho browser inspection, Enter để tiếp tục. Không ghi host/player tokens vào report. verify-regions cũ có giả định public-service và không dùng nó chứng nhận Hà Tĩnh custom rescue; các report cũ giữ là lịch sử.

Browser lượt này dùng UI thật: bảy scene/guide/checklist/overview, G/waypoint/Menu; Hà Nội native desktop1440×900 và layout498×572; Hà Tĩnh rescue dusk/fog và projector100. Result DOM có100 nhưng visual modal có lúc opacity0; baseline rebuild innerHTML + fadeIn150ms vẫn tồn tại. Host encoding lỗi cũng còn. Không gọi mọi modal/browser workflow PASS chỉ vì DOM đúng.

Evidence mới ở client/dist-province-refactor/qa; build lại outDir sẽ thay evidence, nên giữ ảnh cần dùng trước khi rebuild. Physical held-key/audio/multitouch/LAN/load60/accessibility/C11 chưa kiểm đầy đủ. Markdown-only sync không yêu cầu chạy lại toàn bộ tests.

---

# Lịch sử kiểm tra trước / trong refactor

# Gameplay refactor checks — 04/10/2026

Lượt mới/bằng chứng cụ thể trong PROJECT_STATUS. Baseline 103 tests PASS. ProvinceModules suite hiện 16 tests registry/map/view/state/reset; gameplayCapabilities 5 tests task/resource/vote/item/public-service state. Khi migrate tỉnh dùng regionalMaps `-t <tên tỉnh>` và ghi SKIPPED đúng, không gọi các tỉnh bị lọc là PASS.

`node scripts/verify-province-parity.mjs` kiểm catalogue/guide với source baseline Git, không tạo phòng hay ghi đè report. REFACTOR_BASELINE có thể chỉ định checkpoint; 426 fixtures trên 7 maps hiện PASS.

Build shared trước server/tests; client build riêng `npm run build --workspace=client -- --outDir dist-province-refactor`. Không ghi đè client/dist live. Browser/socket chưa chạy ở phase đầu, ghi NOT TESTED. Các số/commands/report dưới là lịch sử.

---

# Kiểm tra và tái hiện

Mốc kiểm tra đã chạy, source và những phần chưa xác minh ghi ở [PROJECT_STATUS](PROJECT_STATUS.md). Lần bàn giao tài liệu không chạy lại toàn bộ test; kết quả phát triển trước đó và report còn trong repo được phân biệt với kiểm tra mới.

## Mốc mới nhất — input / interaction, 04/10/2026

Kết quả của lượt implementation input trước bàn giao: **102/102 tests,7 suites PASS**, typecheck shared/server/client và build shared/server PASS; client build dùng outDir dist-input, không ghi đè client/dist. Cuối lượt chạy lại3 suite liên quan22/22 PASS. Không gọi đây là root `npm run build` hoặc lần test mới trong lượt đồng bộ Markdown. Lint script không có. [Report](INPUT_INTERACTION_IMPLEMENTATION_REPORT.md) phân biệt unit mocks, Socket.IO thật và browser UI.

Nguồn: working tree chưa commit trên HEAD `f50e6654309b95eac3328544cd21db079bd771cf` (master), không phải checkout sạch của commit. Mốc này không chứng nhận thay đổi tương lai; build shared trước test/server khi shared source đổi. Phạm vi bàn giao ở [TASK_CURRENT](../TASK_CURRENT.md).

| Suite hiện tại | Số bài ở lần chạy input |
| --- | --- |
| gameEngine / hanoiSolo / hanoiMap | 13 / 2 / 7 |
| regionalMaps / movement / collisionLayout | 36 / 10 / 27 |
| inputInteraction | 7 |
| Tổng | 102 |

- node scripts/verify-input-controls.mjs:8 nhóm keyboard/multi-pointer/blur/menu/joystick analog bằng EventTarget+DOM mock.
- node scripts/verify-input-ack.mjs: actual executeAction bundle, renderer/socket mock, pending/spam/reject/no optimistic cargo.
- node scripts/verify-input-network.mjs: actual SocketClient với transport mock, offline/rejoin locks.
- PREVIEW_URL=http://127.0.0.1:3112 node scripts/verify-input-multiplayer.mjs:2 sockets thật race crate/job, reconnect cargo, duplicate ACK/reject;350ms consumer delay chỉ là giả lập.
- Script verify-regions.mjs với PREVIEW_URL riêng, QA_INCLUDE_HANOI=1, QA_REPORT_PREFIX=input:7 maps ×3quests=100,38routes/map. Không chạy vào phòng người dùng.
- Browser: E nhặt/G đặt và mobile button clicks nhận ACK, M/Menu/Esc, taps movement, joystick drag/release, portrait390×844 và landscape844×390; screenshots/input-*-qa.png và input-ui-qa.json.
- Chưa kiểm physical two-hand multitouch, continuous held-key feel, real Wi-Fi latency/loss và60 người.

Lệnh build cách ly đã dùng (chỉ chạy lại khi nhiệm vụ cần):

```powershell
npm run build --workspace=shared
npm run typecheck
npm test
npm run build --workspace=server
npm run build --workspace=client -- --outDir dist-input
node scripts/verify-input-controls.mjs
node scripts/verify-input-ack.mjs
node scripts/verify-input-network.mjs
```

Socket QA: xác minh instance cách ly/cổng/source trước, đặt `$env:PREVIEW_URL='http://127.0.0.1:3112'`, rồi chạy verify-input-multiplayer.mjs hoặc verify-regions.mjs với QA_INCLUDE_HANOI/QA_REPORT_PREFIX như trên. Các script tạo/thay state phòng QA. Cổng3112 là mốc đã dùng, không cam kết còn chạy cho lần sau. `CLIENT_DIST_PATH` phải trỏ bundle riêng; không build đè frontend server người dùng đang phục vụ. prepare-input-ui-fixture.mjs tạo kiện gần player trong phòng INPUT_UI_QA ở3112 bằng intent/MOVE thật, không phải teleport fixture.

```powershell
# Chỉ chạy sau khi xác minh instance QA riêng.
$env:PREVIEW_URL='http://127.0.0.1:3112'
node scripts/verify-input-multiplayer.mjs
$env:QA_INCLUDE_HANOI='1'
$env:QA_REPORT_PREFIX='input'
node scripts/verify-regions.mjs
```

## Mốc trước — collision, 04/10/2026

95/95 tests thuộc6 suites: gameEngine13, hanoiSolo2, hanoiMap7, regionalMaps36, movement10, collisionLayout27. Typecheck và shared/server/isolated-client build PASS. Báo cáo đầy đủ: [collision report](COLLISION_IMPLEMENTATION_REPORT.md); evidence [runtime7 map](collision-runtime-qa.json), [runtime versions](collision-runtime-versions.json), [courtyard](collision-courtyard-qa.json). Source/shared phải build trước test/server; Markdown-only bàn giao không rerun các check này.

Socket.IO7 map đạt100 điểm/M1–M3, cargo reconnect, hai client thấy triển khai; live overlap recovery thử ở Hanoi B/Thanh Hoa B/Ha Tinh C, các trường hợp khác chỉ unit fixture hoặc chưa live test. Continuous WASD, nghe thật, mobile/latency/load chưa kiểm. C11 exact floor/rail alignment còn UNRESOLVED; tại mốc collision,3102 chưa cập nhật. Đây là lịch sử, listener/phòng hiện tại phải kiểm lại theo PROJECT_STATUS. Dùng instance cách ly trước khi QA; hướng dẫn [ACCOUNT_TRANSFER](ACCOUNT_TRANSFER.md). QA tạo room và thay state, không chạy nhầm vào phiên của người dùng.

Ví dụ QA trên instance riêng đã chạy và xác minh đúng source/build/cổng:

```powershell
$env:PREVIEW_URL='http://127.0.0.1:3111'
$env:QA_INCLUDE_HANOI='1'
$env:QA_REPORT_PREFIX='collision'
node scripts/verify-regions.mjs
```

Các section/số tests cũ dưới đây là lịch sử; không cộng các mốc lại hoặc gọi Socket.IO MOVE là playtest WASD.

## Historical movement follow-up —2026-10-03

Current checks: typecheck/build PASS;68 tests across5 suites PASS. New `movement.test.ts` covers contact/slide, closed corner, normalized15/30/60/120FPS, water/sweep, authoritative trajectories, spawn, all required7-map routes, surfaces and distance/contact audio state. Build shared before tests because server imports shared/dist.

`node scripts/verify-movement.mjs` creates disposable rooms on `PREVIEW_URL` (default localhost3110), uses2 real Socket.IO clients and paced input; see `movement-runtime-qa.json`. `node scripts/verify-movement-audio.mjs` fault-injects missing samples against the actual SoundManager bundle using mocked DOM/audio; see `movement-audio-qa.json`. Neither claims60 humans or listening. Full20-case PASS/NOT TESTED qualifications: [implementation report](GAMEPLAY_UX_IMPLEMENTATION_REPORT.md).

F2 in game toggles collision/debug. Walk at Hanoi tree `(452.5,345)` with D then W+D, or lake edge `(486,535)` with W+D; read analytic contact/trajectory, authoritative correction and audio fields. Foot radius14 unchanged; corner assist explicitly off. Hold-and-blur, mobile, subjective listening and latency stress still require playtest.

## Lệnh từ package.json

Từ root đã cài dependency:

```bash
npm run typecheck
npm test
npm run build
```

Typecheck lần lượt shared/server/client; test = `npm run test --workspace=server` (Vitest run); build shared/server trước `tsc && vite build` client. Server/QA import shared/dist: khi đổi shared cần build shared trước test/QA, typecheck không tái sinh dist. Vite client dev dùng alias shared/src nên có thể lệch server đang chạy nếu không build shared. Khi test từng suite dùng `npm run test --workspace=server -- src/__tests__/regionalMaps.test.ts`.

| Suite | Số bài ở mốc phát triển trước bàn giao | Nội dung |
| --- | --- | --- |
| `server/src/__tests__/gameEngine.test.ts` | 9 | Solo, bốn tổ hợp, vật tư/double pick, manpower/hủy, room isolation, grace, pause/reset. |
| `server/src/__tests__/hanoiSolo.test.ts` | 2 | Happy paths Hà Nội tại đúng POI. |
| `server/src/__tests__/hanoiMap.test.ts` | 7 | Map/collision, bridge/route và hướng dẫn Hà Nội. |
| `server/src/__tests__/regionalMaps.test.ts` | 36 | 6 vùng × route/bridge + co-op/reset + 4 tổ hợp hoàn thành 100 điểm. |
| **Tổng** | **54 đạt trong lượt phát triển trước** | Không xem số này như cam kết mọi lần chạy/source tương lai. |

Unit mission tests có đặt vị trí player trực tiếp để kiểm rules; bài geometry đi đoạn nhỏ qua engine. Chúng không thay thế kiểm UI hoặc thời gian người chơi đi thật.

## QA HTTP + Socket.IO

Mở server build mới ở một cổng chưa dùng, hoặc dùng server đã mở và đúng source. Ví dụ **không chạy thêm server nếu 3102 đang phục vụ**:

```powershell
# Chỉ dùng nếu cần khởi động server của riêng lần kiểm tra.
$env:PORT='3102'
$env:HOST='0.0.0.0'
node server/dist/server.js
```

Ở terminal thứ hai từ root:

```powershell
$env:PREVIEW_URL='http://localhost:3102'
node scripts/verify-regions.mjs
```

Script tạo sáu phòng QA mới, không dùng phòng mặc định; chạy job với tick thật, gửi MOVE dọc route và kiểm ACK, kiểm nối lại giữ player/kiện và hai client. Di chuyển được gửi nhanh theo điểm lưới, **không mô phỏng tốc độ 180/giây hoặc thao tác của người thật**. Phương án script cố định theo thứ tự: Hải Phòng/Ninh Bình/Nghệ An FIXED+REPAIR; Quảng Ninh/Thanh Hóa/Hà Tĩnh MOBILE+DETOUR. Bốn tổ hợp ở mỗi vùng được kiểm trong unit tests, không phải 24 trận browser đã chơi.

Biến: `PREVIEW_URL` (mặc định localhost:3102), `QA_MAP` (lọc mapId), `QA_HOLD=1` (dừng 94 điểm để chụp). Report ghi đè `docs/regions-<mapId>-runtime-qa.json` và tổng `regions-runtime-qa.json`; nếu lọc một vùng, aggregate được merge. Phòng tồn tại trong RAM sau QA cho tới restart; script đóng socket. Không lưu token host/player trong tài liệu.

Để chụp khi QA_HOLD:

```powershell
$env:QA_MAP='thanh-hoa'
$env:QA_HOLD='1'
node scripts/verify-regions.mjs
# Chạy từ terminal khác sau khi chụp:
Set-Content docs/regions-qa-continue.signal 'continue'
# Khi script đã PASS, xóa riêng signal để lần sau không tự tiếp tục:
Remove-Item -LiteralPath docs/regions-qa-continue.signal
```

Hãy unset biến QA_MAP/QA_HOLD khi muốn chạy lại cả sáu vùng. File signal còn từ lần trước sẽ bỏ qua điểm dừng; không xóa file QA/report/ảnh khác.

Hà Nội dùng script lịch sử `verify-hanoi-v2.mjs` trên geometry hiện tại; mặc định cổng 3100 **cũ**, phải đặt PREVIEW_URL về server phù hợp. Biến QA_M1 FIXED/MOBILE, QA_M2 REPAIR/DETOUR, QA_CAPTURE M1/M2/M3, QA_REPORT đường output. Script dừng chụp theo lựa chọn và luôn cần signal `${os.tmpdir()}/hanoi-v2-qa-continue`; đọc script trước chạy. Handover v3 và report `hanoi-v3-*-runtime-qa.json` là bằng chứng lần chạy v3, tên script v2 không đồng nghĩa renderer v2.

`preview-room.mjs` tạo phòng ART_ và START/skip để xem cảnh; có thể auto-pause khi chưa có player. `qa-room-command.mjs <ART_/V2_code> PAUSE|RESUME` thay trạng thái phòng QA. `inspect-hanoi-qa.mjs <ART_/V2_code>` không sửa engine nhưng vẫn mở spectator socket/join; không dùng với phòng người dùng. Cả ba mặc định cổng 3100; đặt PREVIEW_URL. Chúng không nhận prefix QA_ của script vùng.

## Checklist browser và thiết bị

| Kiểm | Thao tác / kết quả cần thấy |
| --- | --- |
| Solo | Sảnh chọn đúng vùng → solo → dẫn nhập/tập dượt → đủ M1/M2/M3, không cần vai trò/quorum. Chạy một trận bằng input thật để đo mốc 600 giây. |
| Co-op | Hai profile/device riêng vào cùng code, cùng map/score/resources; chia hai job, thử nhận vật tư cùng lúc; host/projector không tăng số player nếu chỉ spectator. |
| Host/pause/reset | Token đúng/sai, start/skip/pause/resume/+60/end/reset; reset giữ map và spawn, trả resources/jobs. Kiểm pause khi đang vote riêng, không suy từ bài pause tổng quát. |
| Reconnect/vật tư | Rớt <10 giây giữ kiện; >10 giây kiện đặt đất và manpower được giải phóng; nhặt/hoàn trả không nhân đôi. Rejoin khi auto-pause cần host resume. |
| Bốn tổ hợp | FIXED+REPAIR, FIXED+DETOUR, MOBILE+REPAIR, MOBILE+DETOUR; so bảng nguồn lực/điểm/citizen trong MVP_SPEC. |
| Geometry/cầu | Spawn/jitter và mọi POI đến được, không đi trên nước/mái; cầu hỏng khóa giữa, work point trên bờ, tuyến vòng thật; REPAIR chỉ mở khi cả hai việc xong. |
| Renderer | Đúng scene/địa danh, layer/depth che chân hợp lý, không mất sprite/lều; trạm và kho/cầu theo snapshot; no asset 404/console error. |
| Camera/HUD | M/Map đổi overview/follow; di chuyển giữ overview, waypoint chuyển follow; route không qua vật cản, nhãn không che thao tác, ledger/results theo region. |
| Mobile | 390×844 dọc, màn ngang; cần ảo pointercancel/blur reset, nút tương tác đủ gần mới bật, practice nút không bị minimap che, task sheet mở/đóng. Thử trên điện thoại vật lý mới đánh giá FPS/touch/Wi-Fi. |

Bằng chứng: [report sáu vùng](regions-runtime-qa.json), [ảnh sáu vùng](screenshots/regions-final-contact-sheet.jpg), [practice mobile](screenshots/regions-mobile-practice.jpg), [task mobile](screenshots/regions-mobile-tasks.jpg), [results 100](screenshots/regions-results-100.jpg), [handover Hà Nội v3](HANOI_V3_HANDOVER.md). Ảnh vùng ở 94 điểm trước công khai cuối; reports cuối 100 điểm. Mã/URL phòng trong report là lịch sử, không đảm bảo tồn tại sau restart.

Chưa có bằng chứng: FPS/latency thiết bị thật, load 10+ người, đủ sáu trận solo bằng input thật trong 600 giây, accessibility đầy đủ, adversarial payload/auth/vote pause, triển khai cloud/giải đấu. Các dấu hiệu source và bước kiểm tra tiếp ở PROJECT_STATUS. Không tự chạy QA phá trạng thái phòng đang được sử dụng.
