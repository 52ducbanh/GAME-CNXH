# Refactor gameplay theo province — hiện hành 04/10/2026

- Branch: `refactor/province-modules`.
- REFRACTOR_BASELINE: `b76710245e8f19f2a871de67ff4b4d7d2e586546`; HEAD tại lúc kiểm Phase 1 là baseline này. Checkpoint mới được ghi trong Git, xem `git log`.
- Tiến độ runtime: **7/7**. Phase 0/1 hoàn tất; Phase 2 đã extract task, items, voting, resource và public-service rules qua narrow ports, đã có Ninh Bình đi qua registry.
- Baseline hiện tại: **PASS** typecheck ba workspace, shared/server build, client build riêng `dist-province-refactor`, 103/103 tests (8 suites). Chưa dùng số tests lịch sử làm bằng chứng.
- Phase 1: **PASS** typecheck/build; 9/9 contract tests. Đủ bảy definitions, semantic quest IDs, typed command/envelope boundary, ProvinceView và runtime contract.
- **NOT TESTED** trong phase này: browser, socket hai client thực, host/projector trực quan. Unit tests đã kiểm authority, reset/rejoin, score, E/G catalogue, movement/collision.
- Known behavior giữ nguyên: catalogue Hà Tĩnh range72/handler107; handler rescue không có phase guard chung; bridge MOVE chưa giới hạn tốc độ; Hà Tĩnh vẫn dùng recap public-service cũ; C11 floor/rail chưa được chứng nhận.
- Phase 2: **PASS** typecheck/build và 14/14 contract/capability tests; runtime preset có semantic state, total score derive; không import movement/session/socket/GameEngine. Kiểm receipt/lifecycle cũ ở baseline; chưa gọi extracted preset là migrated production.
- Ninh Bình: **PASS** 6/6 region checks (24 cases tỉnh khác SKIPPED), 7/7 input catalogue checks, 7/7 Hà Tĩnh custom regression, 16/16 province contract/view/reset checks; typecheck/build PASS. Catalogue/guide đã chọn policy qua shared registry; HUD/minimap/results/projector và renderer đọc ProvinceView; native Hanoi adapter giữ art/depth.
- Hải Phòng: **PASS** typecheck/build, 23/23 province/input checks, 6/6 region checks (24 SKIPPED); metadata palms và map bindings giữ nguyên. Rà soát đã sửa lỗi reset kho do nhánh migration mới thiếu gọi initCrates; 16 province tests kiểm lại ownership/reset đầy đủ.
- Quảng Ninh: **PASS** typecheck/build, 23 province/input + 6 region checks (24 SKIPPED). `node scripts/verify-province-parity.mjs`: **PASS 426 fixtures/7 maps**, catalogue và guide so trực tiếp source của baseline commit, không giữ implementation cũ trong production.
- Thanh Hóa: **PASS** typecheck/build, 23 province/input + 6 region checks (24 SKIPPED). Giữ POI mobile B/C2 và paths/geometry nguyên trạng.
- Nghệ An: **PASS** typecheck/build, 29 contract/input/capability + 6 region checks (24 SKIPPED), parity 426 fixtures. TimedObjective capability nhận definition, sở hữu completion facts, derive score/guide/markers; production cả bảy province vẫn có zero thử nghiệm. Locality proof riêng sẽ chạy sau cleanup.
- Hà Nội: **PASS** typecheck/build và 45/45 province/input/gameEngine/solo/map tests. `verify-province-parity`: 426 catalogue/guide fixtures + 1489 ACK/snapshot checkpoints của 24 trận public-service và 1 trận Hà Tĩnh khớp baseline; rule fixtures đặt vị trí, không nhận là movement/browser playtest. Native renderer giữ crops/depth/layers.
- Hà Tĩnh: **PASS** typecheck/shared/server/isolated-client build, 125/125 tests (10 suites) và parity 426 + 1489 checkpoints. va/dg/dl có một owner trong HatinhRuntime; score summary là getter/selector; m1/m2/m3 là detached wire projections. Core GameEngine giảm xuống 573 dòng, không chứa handlers/rules/branch tỉnh. Partial registry/fallback đã xóa.
- Legacy/semantic cleanup: **PASS** typecheck/shared/server/isolated-client build, **129/129 tests (11 suites)**, parity 426 + 1489 checkpoints; ClientIntent discriminated types, raw socket unknown, item delivery có một owner. TaskPanel/VotingModal đọc ProvinceView; facade renderer cũ không còn consumer đã xóa. Controls 8 nhóm, actual executeAction pending/ACK và actual SocketClient qua transport mock **PASS**; các JSON mới nằm trong bundle QA ignored, report lịch sử giữ nguyên.
- Boundary malformed input: envelope/task payload thiếu được reject thay vì ném lỗi/dispatch mơ hồ; valid commands và receipt fingerprint giữ nguyên. Đây là validation cần cho unknown boundary, không thay luật/điểm/range.
- Tiếp theo: locality proof, hai sockets thật/room isolation, browser QA và final docs; chưa gọi task READY.
- Safety: source/config/runtime assets đã checkpoint; 594 file versioned/non-ignored được lưu zip có SHA256 ở thư mục backup Codex ngoài repo. 291 file art-source/screenshots/ZIP lớn được lưu archive, giữ nguyên tại chỗ và chưa stage.

---

## Lịch sử trước refactor (implementation/checks đúng ở mốc tương ứng)

# Trạng thái hiện hành — 04/10/2026

**CURRENT CODE = SOURCE OF TRUTH.** Luồng tiếp quản: **[AGENTS](../AGENTS.md) → phần hiện hành của file này → [TASK_CURRENT](../TASK_CURRENT.md)**. TASK_CURRENT bàn giao phạm vi/entry point/acceptance; file này giữ trạng thái và bằng chứng. ACCOUNT_TRANSFER dùng cho chuyển máy/tài khoản; HANDOFF/report có ngày là lịch sử, không cam kết runtime vẫn cùng bản.

## Trạng thái hiện tại và Git

- Game “Quê mình đứng đầu!”: web2D TypeScript/Phaser + Express/Socket.IO, npm workspaces shared/server/client. Bảy bản đồ1672×941, một map bất biến/phòng, ba nhiệm vụ CNXHKH; solo và co-op dùng cùng engine. Role chỉ gợi ý, không quorum. Chưa có giải đấu/xếp hạng liên đội hoặc capacity60 người đã chứng minh.
- Đồ họa scene chi tiết + foreground masks + gameplay động; concept/source lưu ở docs/art-source. Movement shared swept/sliding, chân14px, sprint/audio, cornerAssist0, prediction/reconcile/rejoin, peer pass-through; server kiểm toàn đoạn MOVE.
- Implementation gần nhất: Triển khai hoàn chỉnh toàn bộ màn chơi Hà Tĩnh (Vũng Áng cảng công nghiệp 30đ, Đèo Ngang rescue special event 35đ với countdown 3s day-to-dusk + fog/dusk tint + rescue scene swap + strict dependency tree, Đồng Lộc 35đ với 3 nhánh song song) theo thiết kế HATINH_GAMEPLAY_REDESIGN; asset pipeline xóa sạch banner chữ, collision layout bám sát địa hình, server-authoritative validation cho 27 quest action intents, HUD dynamic minimap swap, custom NPCs và atmospheric overlays; bảo toàn 100% 6 tỉnh còn lại.
- **HEAD kiểm lại trong lượt đồng bộ:** `f50e6654309b95eac3328544cd21db079bd771cf`, branch `master`; commit02/10/2026 16:56:29 +07:00. Code/asset/docs hiện hành có nhiều modified/untracked từ nhiều lượt. **HEAD không chứa toàn bộ sản phẩm hiện hành.** Không commit/reset/stash/xóa khi bàn giao; chuyển máy phải mang cả working tree/untracked và rebuild ignored dist.
- Đã đọc git status, diff, diff --stat và đối chiếu entry point. Trước sửa tài liệu, tracked diff có43 files,2269 insertions/2409 deletions; số này không tính file untracked hoặc phân định tác giả/lượt thay đổi. TASK_CURRENT được cập nhật chi tiết cho đợt triển khai Hà Tĩnh.

## Đã hoàn thành trong source

| Nhóm | Implementation hiện tại / nguồn |
| --- | --- |
| Gameplay/phòng | Ba nhiệm vụ, plan/vote, vật tư/jobs, solo/co-op, host/projector, map theo phòng. GameEngine quyết định nguồn lực/điểm/quest; client gửi intent, đọc snapshot. |
| Hà Tĩnh gameplay & map | Triển khai hoàn chỉnh theo HATINH_GAMEPLAY_REDESIGN: Vũng Áng (30đ), Đèo Ngang (35đ - countdown 3-2-1, fog/dusk tint, rescue scene swap, strict dependency tree cho 4-7 players hoặc solo), Đồng Lộc (35đ - 3 nhánh song song). Server-authoritative logic với intent HATINH_ACTION, POI custom, syncHatinhScores map chuẩn m1/m2/m3 tổng 100đ. Asset sạch banner, collision footprint chuẩn. |
| Collision trước lượt input | C01–C10/C12 đã triển khai/kiểm theo collision report: waterCollision tách ripple,63 named solids, ground approaches, lều theo deployment và server overlap recovery. Nguồn collision-layout.json + prepare-regions.py; không sửa output riêng. |
| Điều khiển chung | InputController: WASD/Arrows/Shift/E/G/M/Esc; mobile analog joystick/sprint + E/G/Map/Menu; typing/repeat/blur/lock/reset. M giữ overview khi đi; Menu khóa input cá nhân, không pause phòng. |
| Tương tác | interactions.ts catalogue/resolver dùng chung prompt/drawer/START_JOB eligibility; range72 predicted+authoritative, dropped item theo ID, priority/hysteresis, G cancel → drop → ping; HQ chọn phương án qua drawer. |
| Action/network | MainScene.executeAction drain MOVE tối đa2s, một pending, cooldown300ms, feedback theo ACK; SocketClient khóa đến joined/rejoined, không replay offline, ACK timeout8s. Không optimistic cargo/score/quest. |
| Authority/races | START_JOB helper qua handleIntent, giữ actionId; job type+target reservation; explicit crateId invalid không fallback. Receipt scoped playerId+actionId/type+payload, bounded2000/phòng, clear reset; không persistence. |

Chi tiết luồng module/state: [ARCHITECTURE](ARCHITECTURE.md); framing camera/generator: [MAPS](MAPS.md). Root cause đã xử lý và entry point tiếp quản: TASK_CURRENT.

## Test gần nhất — bằng chứng đã lưu, không phải chạy mới

Lượt implementation Hà Tĩnh ngày 04/10/2026 trên **working tree chưa commit của HEAD trên**:

- `npm test`: **103/103 PASS, 8 suites**; bao gồm suite mới `hatinhGameplay.test.ts` (7/7 tests) cùng 7 suites hiện có (`hanoiSolo`, `inputInteraction`, `gameEngine`, `hanoiMap`, `collisionLayout`, `regionalMaps`, `movement`).
- Typecheck shared/server/client: **PASS 0 errors**.
- Build shared/server/client (Vite production bundle): **PASS 0 errors**.
- Harness controls 8 nhóm, actual executeAction/ACK 350ms và SocketClient/rejoin PASS bằng mocks. Hai Socket.IO thật kiểm tranh crate/job, duplicate/reject, reconnect cargo PASS; delay consumer ACK không phải latency LAN thật.
- verify-regions: cả 7 map M1–M3=100, 38 routes/map, peer reconnect.
- Browser: taps movement, E nhặt/G đặt/ping, M/Menu/Esc, mobile E/G clicks; một joystick drag/release, viewport 390×844 và 844×390. Chưa physical multitouch hai tay/held-key feel/nghe thật.
- Nguồn: [TASK_CURRENT](../TASK_CURRENT.md), [TESTING](TESTING.md), `hatinhGameplay.test.ts`.

## Bug đã biết / phần đang làm và chưa kiểm

| Mục | Trạng thái thật / bước khi được giao |
| --- | --- |
| Encoding HostView/VotingModal | Chữ tiếng Việt hỏng thấy trong source; còn tồn tại. Historical docs cũng có encoding cũ; không sửa toàn bộ ngoài scope. ActionPanel mới đã có chữ sạch. |
| QA input trên thiết bị thật | Chưa kiểm held-key PC liên tục, sprint/animation/audio feel, hai tay mobile, accessibility focus trapping Menu. Mocks/một drag không thay physical playtest. |
| LAN/latency/load | Chưa chứng nhận loss/latency Wi-Fi/device thật hoặc60 người. MOVE có segment validation nhưng chưa kiểm speed/time budget; auth/payload public hardening chưa được chứng nhận. |
| C11 exact sàn/rail cầu | UNRESOLVED; cần trace sprite transform/perspective so với footprint14px. Nominal support band/31px lệch tim chưa chứng minh bug. |
| C13 live migration | Chưa có chứng nhận migrate live3102 hoặc backup RAM rooms. Kiểm listener/rooms/build hiện tại trước quyết định; không xem room/PID lịch sử là hiện trạng. |
| Đường vòng Hà Tĩnh | ĐÃ GIẢI QUYẾT: Đã cấu hình collision-layout.json và footprint chuẩn cho cảng, vách núi và di tích; asset clean-scene.png và rescue-scene.png đã xóa sạch text banner qua pipeline prepare-regions.py. |
| ACK/receipt/RAM | Timeout có thể là kết quả chưa xác định; snapshot quyết định. Receipt eviction sau2000, guard offline/pause trả sớm không cache; không phải durable idempotency. Rooms/session mất khi restart. Đây là giới hạn hiện tại. |

Không có root cause mới được xác nhận cho các phần chưa playtest; không biến chúng thành bug đã sửa hoặc task tự động.

## Runtime quan sát khi đồng bộ

- Kiểm listener trong lượt này: có **127.0.0.1:3112**, không thấy3102/3110/3111 trong nhóm cổng được kiểm. Chỉ xác nhận listener, không chứng nhận binary/env/state của process đang chạy.
- Mốc QA input đã dùng3112 phục vụ client/dist-input qua CLIENT_DIST_PATH. Báo cáo collision3111/live3102 và rooms VN2336/VN4705 là lịch sử; không suy rằng còn sống, đã backup hoặc đã migrate. Không restart/tắt instance trong lượt này; client/dist giữ nguyên.
- Khi cần QA tiếp: xác minh instance/source và phòng riêng trước; server hiện giữ toàn bộ rooms/session trong RAM. Không lưu token/.env/PID vào docs. [TESTING](TESTING.md) có lệnh build cách ly và QA.

## Bước tiếp theo

Agent mới đọc AGENTS → phần hiện hành PROJECT_STATUS → TASK_CURRENT; đối chiếu Git và entry points. Màn chơi Hà Tĩnh đã hoàn thành đầy đủ code, asset, renderer, server validation và 103/103 unit tests. Nếu có nhiệm vụ mới (ví dụ QA trên thiết bị thật, các tỉnh thành tiếp theo hoặc tính năng mở rộng), đối chiếu theo quy trình chuẩn.

---
## Lịch sử bên dưới — không dùng làm trạng thái hiện hành

Giữ nguyên để truy vết; phần cũ có lỗi encoding và các mốc54/58/68 tests, claim kiến trúc cũ. Khi có mâu thuẫn, đối chiếu repository và phần hiện hành ở trên.

# Historical update — movement/collision/audio, 2026-10-03

Shared swept contact solver and 14px foot config; server segment validation; drawer/focus/rejoin prediction fixes; local distance-based Kenney CC0 footsteps/bump and persisted volume. F2 debug off by default. No map redesign, new gameplay pathfinding, team architecture or corner assist.

Typecheck/build PASS; 68 tests PASS; 2 real Socket.IO clients, 44 MOVE packets, zero rejection, overlap/rejoin PASS. Browser key taps/drawer/mute/reload and 10 decoded samples checked; human listening, continuous-control/mobile/latency/60-person playtests NOT TESTED. Source-of-truth details and 20 acceptance cases: [implementation report](GAMEPLAY_UX_IMPLEMENTATION_REPORT.md); latest entry points: [HANDOFF](../HANDOFF.md).

Prior status below is historical (its encoding damage predates this update). Runtime assets use only 10 selected samples; archive staging retained after automated cleanup rejection.

---
# PROJECT_STATUS â€” bÃ n giao â€œQUÃŠ MÃŒNH Äá»¨NG Äáº¦U!â€

**Nguá»“n tráº¡ng thÃ¡i chÃ­nh cá»§a repository.** CÃ¡c handover Ä‘á»“ há»a/bÃ¡o cÃ¡o QA liÃªn káº¿t dÆ°á»›i Ä‘Ã¢y lÃ  lá»‹ch sá»­ vÃ  báº±ng chá»©ng, khÃ´ng thay tháº¿ file nÃ y. Khi cÃ³ thay Ä‘á»•i tiáº¿p theo, cáº­p nháº­t file nÃ y thay vÃ¬ táº¡o má»™t báº£n â€œtráº¡ng thÃ¡i má»›i nháº¥tâ€ cáº¡nh tranh.

## 1. Má»‘c vÃ  yÃªu cáº§u Ä‘ang bÃ n giao

- NgÃ y: **03/10/2026, Asia/Saigon (UTC+7)**. Äá»‘i chiáº¿u source/mÃ´i trÆ°á»ng báº¯t Ä‘áº§u lÃºc 19:56; timestamp chá»‘t vÃ  fingerprint Ä‘á»c trong [HANDOVER_SOURCE.json](HANDOVER_SOURCE.json).
- Git HEAD: **`f50e6654309b95eac3328544cd21db079bd771cf`**, branch **`master`**. Commit ngÃ y 02/10/2026 16:56:29 +07:00, subject `feat: complete MVP 2D multiplayer game Que Minh Dung Dau! / Ha Noi (CNXH & Phap quyen XHCN)`.
- **HEAD khÃ´ng chá»©a toÃ n bá»™ sáº£n pháº©m hiá»‡n táº¡i:** code/áº£nh HÃ  Ná»™i má»›i vÃ  sÃ¡u vÃ¹ng cÃ²n sá»­a/untracked. Pháº£i mang cáº£ working tree + archive áº£nh khi chuyá»ƒn cho agent khÃ¡c, khÃ´ng checkout riÃªng HEAD rá»“i nghÄ© cÃ³ Ä‘á»§ báº£y vÃ¹ng.
- **YÃªu cáº§u má»›i nháº¥t Ä‘Ã£ chá»‘t:** bÃ n giao ngay trong repo Ä‘á»ƒ agent khÃ¡c tiáº¿p quáº£n; táº¡o/cáº­p nháº­t AGENTS, README, MVP_SPEC, KNOWLEDGE_MAP, ARCHITECTURE, MAPS, ART_SOURCES, TESTING vÃ  PROJECT_STATUS báº±ng thÃ´ng tin tháº­t. Chá»‰ sá»­a tÃ i liá»‡u; khÃ´ng má»Ÿ rá»™ng gameplay/refactor/sá»­a bug, khÃ´ng commit/reset/stash/xÃ³a thay Ä‘á»•i, khÃ´ng táº¯t process Ä‘ang phá»¥c vá»¥.
- **YÃªu cáº§u phÃ¡t triá»ƒn cuá»‘i trÆ°á»›c bÃ n giao:** â€œlÃ m theo cÃ¡ch cá»§a báº¡nâ€¦ miá»…n sao ra giá»‘ng hÃ¬nh áº£nh tÃ´i gá»­iâ€. ÄÃ£ triá»ƒn khai Ä‘á»§ Háº£i PhÃ²ng, Quáº£ng Ninh, Ninh BÃ¬nh, Thanh HÃ³a, Nghá»‡ An, HÃ  TÄ©nh bÃªn cáº¡nh HÃ  Ná»™i. Má»¥c tiÃªu trá»±c quan khoáº£ng 80% theo trao Ä‘á»•i; chÆ°a cÃ³ phÃ©p Ä‘o khÃ¡ch quan pháº§n trÄƒm giá»‘ng áº£nh.
- TiÃªu chÃ­ hoÃ n thÃ nh bÃ n giao: tÃ¬m Ä‘Æ°á»£c entry point/lá»‡nh/pipeline, biáº¿t cÃ¡i Ä‘Ã£/chÆ°a lÃ m vÃ  nguá»“n chá»©ng cá»©; link/file tháº­t; phÃ¢n biá»‡t yÃªu cáº§u, source, kiá»ƒm tra, suy luáº­n; khÃ´ng cáº§n Ä‘á»c chat Ä‘á»ƒ báº¯t Ä‘áº§u. LÆ°á»£t nÃ y khÃ´ng sá»­a runtime.

Context Ä‘Æ°á»£c sá»­ dá»¥ng: cuá»™c trÃ² chuyá»‡n phÃ¡t triá»ƒn cÃ³ thá»ƒ truy cáº­p trong phiÃªn vÃ  source/report hiá»‡n cÃ³. ChÆ°a Ä‘á»c láº¡i toÃ n bá»™ chat riÃªng â€œThiáº¿t káº¿ trÃ² chÆ¡i dÃ¢n chá»§â€; khÃ´ng suy diá»…n cÃ¡c quyáº¿t Ä‘á»‹nh náº±m ngoÃ i context Ä‘Ã³. Náº¿u cÃ³ yÃªu cáº§u giáº£i Ä‘áº¥u/roadmap tá»« chat khÃ¡c, cáº§n ngÆ°á»i dÃ¹ng cung cáº¥p/chá»‘t tiáº¿p.

## 2. Hiá»‡n tráº¡ng sáº£n pháº©m

**Source xÃ¡c nháº­n:** báº£y mapId, cáº£nh native **1672 Ã— 941**, chá»n vÃ¹ng/táº¡o phÃ²ng/solo/co-op, host vÃ  projector, ba nhiá»‡m vá»¥, server quáº£n lÃ½ tráº¡ng thÃ¡i/phÃ²ng Ä‘á»™c láº­p. Danh sÃ¡ch ID/Ä‘á»‹a danh/phÃ²ng táº¡i [MAPS](MAPS.md). CÆ¡ cháº¿ há»c táº­p vÃ  báº£ng chi phÃ­/Ä‘iá»ƒm táº¡i [MVP_SPEC](MVP_SPEC.md).

**ÄÃ£ kiá»ƒm tra trong phiÃªn phÃ¡t triá»ƒn trÆ°á»›c:** 54 unit tests Ä‘áº¡t, cáº£ sÃ¡u vÃ¹ng má»›i cháº¡y Ä‘á»§ M1/M2/M3 qua server tháº­t Ä‘áº¡t 100 Ä‘iá»ƒm, geometry/routes/cargo reconnect/hai client. Browser tháº¥y cáº£nh desktop, clinic/bridge theo state vÃ  thao tÃ¡c mobile viewport. áº¢nh trong game: [sÃ¡u vÃ¹ng](screenshots/regions-final-contact-sheet.jpg), [sáº£nh](screenshots/regions-lobby-desktop.jpg), [HÃ  Ná»™i v3](HANOI_V3_HANDOVER.md).

**Giá»›i háº¡n tháº­t:** má»™t Ä‘á»™i há»£p tÃ¡c trÃªn má»™t map/phÃ²ng; khÃ´ng giáº£i Ä‘áº¥u báº£y Ä‘á»™i, scoreboard tá»•ng hoáº·c thá»© háº¡ng liÃªn Ä‘á»™i. GET /api/rooms cÃ³ score riÃªng phÃ²ng, chÆ°a lÃ  tÃ­nh nÄƒng giáº£i Ä‘áº¥u. Cáº£nh ná»n/layers cá»‘ Ä‘á»‹nh, khÃ´ng tileset/map editor. PhÃ²ng/session á»Ÿ RAM; restart máº¥t tráº­n. Má»¥c tiÃªu 1â€“10 ngÆ°á»i chÆ°a lÃ  giá»›i háº¡n server cÆ°á»¡ng cháº¿ hay benchmark. KhÃ´ng runtime AI, database, cloud deployment, tÃ i khoáº£n hoáº·c saved campaign.

**ChÆ°a xÃ¡c minh:** tá»‘c Ä‘á»™/FPS trÃªn Ä‘iá»‡n thoáº¡i váº­t lÃ½, Wi-Fi cá»§a thiáº¿t bá»‹ khÃ¡c, sÃ¡u tráº­n solo input ngÆ°á»i tháº­t Ä‘á»§ 600 giÃ¢y, giÃ¡o trÃ¬nh lá»›p/thuáº­t ngá»¯ vÃ  vÄƒn báº£n há»£p nháº¥t hiá»‡n hÃ nh. Tests/report khÃ´ng chá»©ng minh cÃ¡c Ä‘iá»u nÃ y.

## 3. ÄÃ£ lÃ m trong phiÃªn phÃ¡t triá»ƒn

| NhÃ³m / file-symbol | Thay Ä‘á»•i vÃ  lÃ½ do | Báº±ng chá»©ng |
| --- | --- | --- |
| `worldMaps.ts::{GAME_MAPS,isWalkableForMap}`, `regionalMapData.ts`; export/types shared | ThÃªm mapId, registry báº£y vÃ¹ng, geometry/POI má»—i vÃ¹ng; khÃ´ng dÃ¹ng global mutable map khiáº¿n phÃ²ng áº£nh hÆ°á»Ÿng nhau. | Suite regionalMaps + /api/maps + report mapId. |
| `navigation.ts::findWalkingRoute`, `missionGuide.ts::getMissionGuide` | Route/Ä‘Ã­ch theo map vÃ  state cáº§u, dÃ¹ng cÃ¹ng geometry client/server. | BÃ i route/collision, ACK cÃ¡c tuyáº¿n QA. |
| `GameEngine::{constructor,handleMove,resetToLobby,getSnapshot}` | Room sá»Ÿ há»¯u map; váº­t tÆ°/NPC/POI theo vÃ¹ng, reset vá» spawn vÃ¹ng thay vÃ¬ vá»‹ trÃ­ HÃ  Ná»™i. | Reset/co-op/geometry/mission tests. |
| `RoomManager.createRoom`, `server.ts` API/socket/LAN | Táº¡o room mapId; khÃ´ng ghi Ä‘Ã¨ mÃ£ Ä‘Ã£ cÃ³; default báº£y phÃ²ng; metadata trÆ°á»›c preload; Æ°u tiÃªn adapter LAN tháº­t cho QR. | Six-room runtime QA; kiá»ƒm GET network/maps táº¡i bÃ n giao. |
| `main.ts`, `phaserGame.ts`, `MainScene` | Chá»n map tá»« room metadata trÆ°á»›c táº£i áº£nh; renderer v3 HÃ  Ná»™i hoáº·c vÃ¹ng; camera/input/occlusion/state. | Desktop/mobile screenshot vÃ  lÆ°á»£t browser. |
| `regionalScene.ts::{preloadRegion,drawRegion}`, `regionalLayers.ts`, `assets/regions/` | Cáº£nh sáº¡ch gáº§n concept, roof/canopy masks/depth, sprite/NPC, boats/wakes/water, bridge ba tráº¡ng thÃ¡i, clinic/stock tháº­t. | 6 áº£nh final, report state vÃ  manifest art. |
| `ui/lobbyView.ts`, `hudView.ts`, task/briefing/host/projector/results, CSS | Sáº£nh báº£y vÃ¹ng, solo start, Ä‘á»™i/QR; tÃªn vÃ¹ng, minimap vÃ  Ä‘Ã­ch tháº­t; giá»¯ ná»™i dung há»c táº­p. | Sáº£nh/solo/mobile/results nhÃ¬n trong browser. |
| `ui/practiceModal.ts`, `hudView.ts`, game.css | Sá»­a overlap minimap che nÃºt Báº¯t Ä‘áº§u tráº­n trÃªn 390Ã—844; card hai hÃ ng, z46, áº©n minimap khi PRACTICE trÃªn mobile. | [áº¢nh practice](screenshots/regions-mobile-practice.jpg), click chuyá»ƒn RUNNING Ä‘Ã£ xÃ¡c nháº­n. |
| `prepare-regions.py` Thanh HÃ³a | Dá»i mobile B ra `(1180,550)`, C2 vá» `(875,855)`; cáº­p nháº­t paths, sinh láº¡i TS/layers. | 54 tests sau geometry; rerun TH 100; [áº£nh TH](screenshots/thanh-hoa-final.jpg). |
| Script áº£nh/QA, manifest, archive/credits | LÆ°u concept/clean art/prompts; tÃ¡i sá»­ dá»¥ng hai asset Sevarihk CC BY 4.0, pháº§n Ä‘á»‹a danh/cáº§u/thuyá»n chá»‰nh/táº¡o riÃªng. | [ART_SOURCES](ART_SOURCES.md), [regions-generation](regions-generation.json), public credits. |

CÃ¡c thay Ä‘á»•i HÃ  Ná»™i v1/v2/v3 Ä‘Ã£ cÃ³ tá»« cÃ¡c lÆ°á»£t trÆ°á»›c vÃ  Ä‘ang á»Ÿ cÃ¹ng working tree; khÃ´ng gÃ¡n táº¥t cáº£ diff so HEAD cho láº§n thÃªm sÃ¡u vÃ¹ng. Nguá»“n runtime hiá»‡n táº¡i táº¡i ART_SOURCES; SVG/ninja/LPC vÃ  hanoiLayout cÅ© váº«n giá»¯ Ä‘á»ƒ Ä‘á»‘i chiáº¿u, khÃ´ng lÃ  báº±ng chá»©ng renderer má»›i dÃ¹ng chÃºng.

**LÆ°á»£t bÃ n giao hiá»‡n táº¡i chá»‰ thay tÃ i liá»‡u:** táº¡o AGENTS, ARCHITECTURE, MAPS, TESTING, PROJECT_STATUS; cáº­p nháº­t chá»n lá»c README/MVP_SPEC/KNOWLEDGE_MAP/ART_SOURCES/ASSET_CREDITS; lÆ°u inventory vÃ  fingerprint. Sá»­a Ä‘áº·c táº£ cÅ© â€œHÃ  Ná»™i duy nháº¥t 1280Ã—960â€, sá»­a link file:/// README, phÃ¢n loáº¡i danh má»¥c SVG lá»‹ch sá»­ vÃ  ghi giá»›i háº¡n test/host/map. KhÃ´ng sá»­a code hay asset game, khÃ´ng rerun gameplay tests Ä‘á»ƒ táº¡o cáº£m giÃ¡c Ä‘Ã£ kiá»ƒm láº¡i.

## 4. Äang dá»Ÿ, chÆ°a báº¯t Ä‘áº§u, bá»‹ cháº·n

**KhÃ´ng cÃ³ file code Ä‘ang sá»­a dá»Ÿ hoáº·c tráº­n QA Ä‘Æ°á»£c giá»¯ chá» signal táº¡i thá»i Ä‘iá»ƒm bÃ n giao.** YÃªu cáº§u sÃ¡u cáº£nh Ä‘Ã£ triá»ƒn khai/kiá»ƒm nhÆ° má»¥c 2; cáº§n ngÆ°á»i dÃ¹ng xem trá»±c quan Ä‘á»ƒ chá»‘t má»©c hÃ i lÃ²ng, khÃ´ng tá»± tuyÃªn bá»‘ Ä‘o Ä‘Æ°á»£c 80%. File signal vÃ¹ng Ä‘Ã£ Ä‘Æ°á»£c xÃ³a sau QA.

| Viá»‡c cÃ²n má»Ÿ | ÄÃ£ tá»›i Ä‘Ã¢u / file má»Ÿ | BÆ°á»›c chÃ­nh xÃ¡c tiáº¿p theo / Ä‘iá»u kiá»‡n Ä‘áº¡t |
| --- | --- | --- |
| QA thiáº¿t bá»‹ tháº­t vÃ  solo timing | Desktop 1280Ã—720 + viewport 390Ã—844 cÃ³ áº£nh; chÆ°a benchmark mÃ¡y tháº­t. Äá»c TESTING/MainScene/touchControls. | Khi cÃ³ mÃ¡y vÃ  yÃªu cáº§u kiá»ƒm: má»Ÿ Ä‘Ãºng server hiá»‡n táº¡i qua LAN, cháº¡y solo báº±ng input tháº­t, Ä‘o 600s/FPS/touch, lÆ°u thiáº¿t bá»‹/map/source/report; khÃ´ng coi script MOVE nhanh lÃ  phÃ©p Ä‘o tá»‘c Ä‘á»™. |
| RÃ  nhÃ¡nh Ã¢m/network | Happy paths/dedupe/váº­t tÆ°/grace cÃ³ test, má»™t sá»‘ dáº¥u hiá»‡u source á»Ÿ má»¥c 6 chÆ°a cÃ³ reproduction. | TÃ¡i hiá»‡n riÃªng trong room dÃ¹ng Ä‘á»ƒ QA, phÃ¢n loáº¡i trÆ°á»›c khi sá»­a; thÃªm kiá»ƒm tra Ä‘Ãºng bug khi Ä‘Æ°á»£c giao sá»­a. KhÃ´ng sá»­a bug trong lÆ°á»£t bÃ n giao nÃ y. |
| Äá»‘i chiáº¿u há»c thuáº­t | Ma tráº­n/rules/nguá»“n gá»‘c Ä‘Ã£ lÆ°u; khÃ´ng cÃ³ áº¥n báº£n lá»›p. | NgÆ°á»i dÃ¹ng/nhÃ³m cung cáº¥p giÃ¡o trÃ¬nh hoáº·c yÃªu cáº§u rÃ  nguá»“n; Ä‘á»‘i chiáº¿u KNOWLEDGE_MAP/knowledgeMap.ts, ghi nguá»“n/sá»‘ trang tháº­t. |
| Giáº£i Ä‘áº¥u/xáº¿p háº¡ng liÃªn Ä‘á»™i | **ChÆ°a triá»ƒn khai vÃ  chÆ°a lÃ  pháº¡m vi giao tiáº¿p trong lÆ°á»£t sÃ¡u map.** | Cáº§n chá»‘t luáº­t thi Ä‘áº¥u, Ä‘á»™i, vÃ²ng, Ä‘iá»ƒm/ranking/host; khÃ´ng suy tá»« báº£y phÃ²ng thÃ nh giáº£i Ä‘áº¥u xong. |
| Portable art regeneration | Archive Ä‘Ã£ lÆ°u Ä‘á»§; má»™t sá»‘ fallback/font cÃ²n phá»¥ thuá»™c mÃ¡y tÃ¡c giáº£. | Äá»c MAPS/ART_SOURCES, xÃ¡c nháº­n Ä‘áº§u vÃ o archive; chá»‰ Ä‘á»•i dependency/path náº¿u yÃªu cáº§u chuyá»ƒn pipeline sang mÃ¡y khÃ¡c. Npm runtime khÃ´ng cáº§n tÃ¡i sinh áº£nh. |

KhÃ´ng cÃ³ blocker khiáº¿n khÃ´ng thá»ƒ bÃ n giao repo. Thiáº¿u thiáº¿t bá»‹/giÃ¡o trÃ¬nh/quy táº¯c giáº£i Ä‘áº¥u chá»‰ áº£nh hÆ°á»Ÿng cÃ¡c má»¥c xÃ¡c minh/pháº¡m vi tÆ°Æ¡ng lai, khÃ´ng cáº§n táº¡o yÃªu cáº§u giáº£ Ä‘á»ƒ láº¥p trá»‘ng.

## 5. Quyáº¿t Ä‘á»‹nh Ä‘Ã£ chá»‘t

- Æ¯u tiÃªn nguá»“n cÃ³ sáºµn khi há»£p style/gÃ³c nhÃ¬n/giáº¥y phÃ©p. [BÃ¡o cÃ¡o nghiÃªn cá»©u vÃ¹ng](REGIONAL_ASSET_RESEARCH.md) khÃ´ng tÃ¬m tháº¥y template hoÃ n chá»‰nh phÃ¹ há»£p trong pháº¡m vi tÃ¬m kiáº¿m. GÃ³i tráº£ phÃ­/kiáº¿n trÃºc Nháº­t chá»‰ shortlist, chÆ°a mua/tÃ­ch há»£p; khÃ´ng nÃ³i Ä‘Ã£ cÃ³ Ä‘á»§ má»i element Viá»‡t Nam trÃªn Internet.
- DÃ¹ng **cáº£nh sáº¡ch chá»‰nh tá»« concept + foreground crops + sprite/state tháº­t** Ä‘á»ƒ giá»¯ chi tiáº¿t/mÃ u/bá»‘ cá»¥c. KhÃ´ng quay láº¡i dá»±ng map báº±ng khá»‘i SVG/procedural tá»•ng quÃ¡t hoáº·c dÃ¹ng template Nháº­t thay toÃ n cáº£nh Viá»‡t Nam.
- NhÃ¢n váº­t/doctor/lá»u/props v2 tiáº¿p tá»¥c dÃ¹ng; mÃ´i trÆ°á»ng HÃ  Ná»™i v3 vÃ  sÃ¡u vÃ¹ng khÃ¡c lÃ  báº£n ná»n riÃªng. Cáº§u nhiá»‡m vá»¥ náº±m ngoÃ i ná»n Ä‘á»ƒ há»ng/sá»­a tháº­t; cáº§u phá»¥ lÃ  tuyáº¿n vÃ²ng giá»¯ trong cáº£nh.
- HÃ¬nh há»c/POI theo map chung server/client, room map báº¥t biáº¿n; region chá»n trÆ°á»›c preload. KhÃ´ng chá»‰nh gameplay state báº±ng Canvas/DOM cho Ä‘áº¹p screenshot.
- Giá»¯ ba nhiá»‡m vá»¥, chi phÃ­/Ä‘iá»ƒm, Ä‘á»™ phá»§ dÃ¢n thá»±c vÃ  ná»™i dung há»c táº­p; role chá»‰ gá»£i Ã½. Äiá»ƒm 100 khÃ´ng Ä‘á»“ng nghÄ©a phá»¥c vá»¥ Ä‘á»§ 30 dÃ¢n.

## 6. Bug, giá»›i háº¡n vÃ  nghi váº¥n

**Bug Ä‘Ã£ sá»­a vÃ  Ä‘Æ°á»£c xÃ¡c nháº­n:** lá»u Thanh HÃ³a bá»‹ canopy che/C2 trÃªn mÃ¡i (sá»­a Ä‘iá»ƒm/path, runtime 100 vÃ  áº£nh); practice mobile bá»‹ minimap cháº·n click (sá»­a CSS/layout, browser click vÃ o RUNNING). KhÃ´ng cÃ²n reproduction Ä‘Æ°á»£c giá»¯ cho hai lá»—i nÃ y á»Ÿ source bÃ n giao.

| ID / loáº¡i | áº¢nh hÆ°á»Ÿng vÃ  báº±ng chá»©ng | TÃ¡i hiá»‡n / nÆ¡i má»Ÿ / workaround |
| --- | --- | --- |
| L1 â€” giá»›i háº¡n nguá»“n Ä‘Ã£ Ä‘á»c | `server.ts::join_room` cáº¥p host náº¿u isHost=true vÃ  khÃ´ng cÃ³ hostToken; engine váº«n kiá»ƒm token khi host command. ChÆ°a cÃ³ mÃ´ hÃ¬nh xÃ¡c thá»±c danh tÃ­nh/host cho mÃ´i trÆ°á»ng cÃ´ng khai. | Äá»c nhÃ¡nh `else if (!data.hostToken)`. Muá»‘n kiá»ƒm runtime dÃ¹ng phÃ²ng QA riÃªng vÃ  host join khÃ´ng token; lÆ°á»£t bÃ n giao **chÆ°a cháº¡y thá»­ quyá»n trÃ¡i phÃ©p**. CÃ¡ch váº­n hÃ nh hiá»‡n táº¡i lÃ  lá»›p há»c tin cáº­y, khÃ´ng coi lÃ  auth production Ä‘Ã£ xong. |
| L2 â€” giá»›i háº¡n source Ä‘Ã£ Ä‘á»c | `GameEngine.handleMove` chá»‰ kiá»ƒm Ä‘iá»ƒm Ä‘áº¿n/biÃªn/paused/collision; chÆ°a kiá»ƒm tá»‘c Ä‘á»™ hoáº·c Ä‘oáº¡n ná»‘i tá»« vá»‹ trÃ­ cÅ©. Client thÆ°á»ng Ä‘i 180/giÃ¢y vÃ  check collision nhÆ°ng ACK QA nhanh khÃ´ng chá»©ng minh chá»‘ng teleport. | Negative test Ä‘á» xuáº¥t: MOVE hai vá»‹ trÃ­ Ä‘i Ä‘Æ°á»£c cÃ¡ch xa/cÃ¡ch váº­t cáº£n á»Ÿ phÃ²ng QA. ChÆ°a cháº¡y trong bÃ n giao; kiá»ƒm MainScene + handleMove. KhÃ´ng thay Ä‘áº·c táº£ bridge cháº·n thÃ nh cho phÃ©p nháº£y qua. |
| L3 â€” giá»›i háº¡n source Ä‘Ã£ Ä‘á»c | addPlayer khÃ´ng cap 10; server khÃ´ng cÃ³ benchmark 10+ ngÆ°á»i. | Má»¥c tiÃªu 1â€“10 lÃ  pháº¡m vi sá»­ dá»¥ng. ChÆ°a má»Ÿ 11 client/táº£i; kiá»ƒm roomManager/server/addPlayer náº¿u Ä‘Æ°á»£c giao cap/load. |
| Q1 â€” nghi váº¥n cáº§n tÃ¡i hiá»‡n | Pause vote: `startVote` Ä‘áº·t endsAt theo Date.now; tick ngá»«ng khi paused nhÆ°ng khÃ´ng dá»i endsAt. CÃ³ thá»ƒ Ä‘Ã³ng vote ngay sau resume dÃ¹ remainingMs cÃ²n. | Hai player má»Ÿ vote, PAUSE hÆ¡n 15s, RESUME, quan sÃ¡t snapshot. NÆ¡i má»Ÿ tick/startVote/hostAction + votingModal. ChÆ°a cÃ³ reproduction/report cho ca nÃ y; bÃ i pause tá»•ng quÃ¡t khÃ´ng chá»©ng minh riÃªng vote. |
| Q2 â€” guard cáº§n negative test | M2 handlePublishNotice kiá»ƒm cá»©u trá»£/verifiedB nhÆ°ng khÃ´ng kiá»ƒm bridgeRepaired cho REPAIR. CÃ³ nguy cÆ¡ chá»‘t M2 qua tuyáº¿n vÃ²ng dÃ¹ phÆ°Æ¡ng Ã¡n yÃªu cáº§u sá»­a; guide bÃ¬nh thÆ°á»ng hÆ°á»›ng dáº«n sá»­a trÆ°á»›c. | Room QA chá»n REPAIR, thá»­ bá» job sá»­a, dÃ¹ng tuyáº¿n phá»¥ cá»©u trá»£/audit/publish. Äá»c handleDeliverCrate/completeJob/handlePublishNotice. ChÆ°a cháº¡y thá»­ bá» bÆ°á»›c; Ã½ Ä‘á»“ váº«n cáº§n sá»­a cáº§u, khÃ´ng há»£p thá»©c hÃ³a thÃ nh spec. |
| Q3 â€” nghi váº¥n HTML injection | `hostView.ts` vÃ  `votingModal.ts` ná»™i suy tÃªn vÃ o innerHTML. Sáº£nh gÃ¡n input/name báº±ng value, nhÆ°ng chÆ°a audit escape toÃ n luá»“ng. | TÃªn chá»©a kÃ½ tá»± HTML vÃ´ háº¡i trong room QA, quan sÃ¡t DOM/text; chÆ°a thá»­ payload script vÃ  chÆ°a cÃ³ security test. KhÃ´ng tuyÃªn bá»‘ Ä‘Ã£ chá»©ng minh exploit hoáº·c Ä‘Ã£ escape toÃ n bá»™. |
| L4 â€” háº¡n cháº¿ ná»™i dung | Recap DETOUR cÃ³ cÃ¢u â€œdÃ i hÆ¡n gáº¥p Ä‘Ã´iâ€ nhÆ°ng khÃ´ng Ä‘o báº£y tuyáº¿n. | knowledgeMap.ts::generateRecap; náº¿u sá»­a recap, Ä‘o route hoáº·c bá» há»‡ sá»‘ chÆ°a xÃ¡c minh. ChÆ°a sá»­a code trong bÃ n giao. |

CÃ¡c dÃ²ng Q lÃ  bÆ°á»›c kiá»ƒm tra tiáº¿p, **khÃ´ng pháº£i káº¿t quáº£ test Ä‘Ã£ cháº¡y**. KhÃ´ng dÃ¹ng test happy path Ä‘áº¡t Ä‘á»ƒ tuyÃªn bá»‘ network/auth/vote chá»‘ng má»i payload. Äá»™ trung thá»±c Ä‘á»“ há»a lÃ  so concept, khÃ´ng mÃ´ hÃ¬nh Ä‘á»‹a lÃ½/di tÃ­ch Ä‘o Ä‘áº¡c; cÃ¢y/cá»‘i nÆ°á»›c pháº§n lá»›n tÄ©nh, watermark/UI cÅ© Ä‘Ã£ Ä‘Æ°á»£c gá»¡ trong clean plate.

## 7. Kiá»ƒm tra Ä‘Ã£ cháº¡y vÃ  nguá»“n tÆ°Æ¡ng á»©ng

| Láº§n / lá»‡nh | Káº¿t quáº£ thá»±c Ä‘Ã£ cÃ³ | Thá»i Ä‘iá»ƒm / nguá»“n / báº±ng chá»©ng |
| --- | --- | --- |
| `npm run build` | Shared/server/client Ä‘áº¡t; Vite cÃ³ cáº£nh bÃ¡o chunk Phaser lá»›n, khÃ´ng lá»—i TS. | LÆ°á»£t phÃ¡t triá»ƒn trÆ°á»›c ngÃ y 03/10; sau geometry Thanh HÃ³a. KhÃ´ng cÃ³ file terminal log lÆ°u riÃªng, káº¿t quáº£ trong context phiÃªn. |
| `npm test` | **54/54 Ä‘áº¡t, 4 files**. | LÆ°á»£t trÆ°á»›c sau Ä‘á»•i Ä‘iá»ƒm/path Thanh HÃ³a. Sau láº§n nÃ y chá»‰ sá»­a UI practice/hud/CSS; chÆ°a cÃ³ thay Ä‘á»•i server/shared sau test Ä‘Ã³. KhÃ´ng bá»‹a hash test quÃ¡ khá»©. |
| `npm run build --workspace=client` + `npm run typecheck` | Äáº¡t. | Sau sá»­a practice mobile cuá»‘i lÆ°á»£t phÃ¡t triá»ƒn; browser check Ä‘Ã£ vÃ o tráº­n vÃ  thao tÃ¡c. Sau Ä‘Ã³ chá»‰ docs vÃ  snapshot metadata trong lÆ°á»£t bÃ n giao. |
| `node scripts/verify-regions.mjs` | 6 vÃ¹ng Ã— 100 Ä‘iá»ƒm, 38 routes/vÃ¹ng = **228 routes**, cargo reconnect vÃ  snapshot hai client. | Reports cá»§a 5 vÃ¹ng mtime 03/10 18:47; Thanh HÃ³a rerun mtime 19:06. [Aggregate](regions-runtime-qa.json), per-map report cÃ³ snapshot; mtime lÃ  thá»i Ä‘iá»ƒm file hiá»‡n lÆ°u, khÃ´ng Ä‘á»“ng nháº¥t thá»i gian báº¯t Ä‘áº§u tráº­n. |
| Browser QA CUA | 6 desktop cáº£nh/state, mobile lobby/solo/practice/follow/task, káº¿t quáº£ 100. | [áº¢nh final](screenshots/regions-final-contact-sheet.jpg), mobile practice/follow/tasks vÃ  [results](screenshots/regions-results-100.jpg). ChÆ°a thiáº¿t bá»‹ váº­t lÃ½. |
| Git diff check | KhÃ´ng cÃ²n whitespace lá»—i sau sá»­a README. | LÆ°á»£t trÆ°á»›c `git -c core.safecrlf=false diff --check`; tráº¡ng thÃ¡i chÆ°a commit váº«n giá»¯. |
| LÆ°á»£t bÃ n giao: Ä‘á»c source/git/API/process, kiá»ƒm docs | 96 liÃªn káº¿t local khÃ´ng thiáº¿u, 54 Ä‘Æ°á»ng dáº«n source/file rÃµ khÃ´ng thiáº¿u, git diff --check Ä‘áº¡t; 205 file source/config/script/runtime asset Ä‘Æ°á»£c hash vÃ  kiá»ƒm khÃ´ng Ä‘á»•i sau snapshot. Server 3102 cÃ²n tráº£ báº£y map vÃ  thÃ´ng tin máº¡ng. | Snapshot trong HANDOVER_SOURCE/WORKTREE_HANDOVER; khÃ´ng kiá»ƒm láº¡i link ngoÃ i hoáº·c legal/heading anchors. **KhÃ´ng cháº¡y láº¡i build/test hoáº·c full browser QA á»Ÿ lÆ°á»£t viáº¿t tÃ i liá»‡u.** |

Source fingerprint bÃ n giao lÃ  hash **source hiá»‡n cÃ³**, khÃ´ng hash Ä‘Ã£ Ä‘Æ°á»£c lÆ°u lÃºc cÃ¡c test trÆ°á»›c cháº¡y. NÃ³ giÃºp agent má»›i phÃ¡t hiá»‡n thay Ä‘á»•i sau bÃ n giao; khÃ´ng lÃ  chá»©ng nháº­n lá»‹ch sá»­ test tá»«ng hash. Äá»‘i chiáº¿u pháº§n runtime cÃ³ thay Ä‘á»•i má»›i rá»“i chá»n kiá»ƒm tra thÃ­ch há»£p theo TESTING.

## 8. Working tree, mÃ´i trÆ°á»ng vÃ  process

- Workspace hiá»‡n táº¡i trÃªn mÃ¡y tÃ¡c giáº£: `C:/Users/52duc/Desktop/Game CNXH`. DÃ¹ng Ä‘Æ°á»ng tÆ°Æ¡ng Ä‘á»‘i trong hÆ°á»›ng dáº«n repo; machine path chá»‰ lÃ  ghi nháº­n mÃ´i trÆ°á»ng hiá»‡n táº¡i.
- Git master/HEAD nhÆ° má»¥c 1; danh sÃ¡ch **má»i file M/??** táº¡i [WORKTREE_HANDOVER.txt](WORKTREE_HANDOVER.txt), chá»¥p cáº£ untracked files, khÃ´ng chá»‰ thÆ° má»¥c. TrÆ°á»›c thÃªm tÃ i liá»‡u bÃ n giao: 38 tracked files sá»­a vÃ  257 untracked files. CÃ³ code/asset HÃ  Ná»™i tá»« lÆ°á»£t trÆ°á»›c trong Ä‘Ã³. KhÃ´ng commit, reset, stash, xÃ³a hoáº·c dá»n chÃºng trong bÃ n giao.
- NhÃ³m tracked sá»­a Ä‘Ã¡ng chÃº Ã½: README, client main/MainScene/UI/network/config/package, SVG cÅ©, server engine/room/server/tests, shared constants/map/types/exports, package-lock. NhÃ³m untracked: toÃ n bá»™ pipeline áº£nh/QA, source region/navigation/guide, HÃ  Ná»™i v2/v3/LPC/ninja/regions assets, archive/prompts/reports/screenshots vÃ  tÃ i liá»‡u má»›i. Inventory Ä‘áº§y Ä‘á»§ lÃ  nguá»“n chÃ­nh Ä‘á»ƒ trÃ¡nh bá» file.
- Node **24.12.0**, npm **11.6.2** Ä‘á»c má»›i trong lÆ°á»£t nÃ y; dependency Ä‘Ã£ cÃ i, shared/server/client dist hiá»‡n cÃ³ nhÆ°ng gitignore. CÃ¡c package version/range á»Ÿ package.json vÃ  lock; agent khÃ¡c nÃªn cÃ i tá»« lock vÃ  build, khÃ´ng mang node_modules lÃ m nguá»“n.
- Python/Pillow dÃ¹ng runtime bundled cá»§a Codex trÃªn mÃ¡y tÃ¡c giáº£ táº¡i `C:/Users/52duc/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`. MÃ¡y khÃ¡c dÃ¹ng Python/Pillow tÆ°Æ¡ng Ä‘Æ°Æ¡ng; khÃ´ng cáº§n Python Ä‘á»ƒ npm run start.
- KhÃ´ng Ä‘á»c/ghi ná»™i dung .env riÃªng hay token. Cáº¥u hÃ¬nh máº«u [../.env.example](../.env.example), quy táº¯c cá»•ng trong README/ARCHITECTURE.

| Process quan sÃ¡t táº¡i bÃ n giao | Lá»‡nh / thÆ° má»¥c / má»¥c Ä‘Ã­ch | CÃ¡ch nháº­n biáº¿t tiáº¿p |
| --- | --- | --- |
| Node, bind **0.0.0.0:3102** | `node server/dist/server.js`, tá»« root; env lÃºc khá»Ÿi Ä‘á»™ng lÆ°á»£t trÆ°á»›c PORT=3102, HOST=0.0.0.0. Báº£n build báº£y vÃ¹ng Ä‘ang phá»¥c vá»¥ localhost:3102. | GET /api/maps tráº£ 7 mapId; /api/network-info ghi port3102. Wi-Fi hiá»‡n `192.168.2.104`, cÃ³ thá»ƒ Ä‘á»•i. Kiá»ƒm listener/process command khi tiáº¿p quáº£n, khÃ´ng dÃ¹ng PID/session cÅ©. |
| Node, bind **127.0.0.1:3100** | Command quan sÃ¡t cÅ©ng server/dist/server.js; suy tá»« API phÃ²ng ART_/V2_ vÃ  mapId thiáº¿u Ä‘Ã¢y lÃ  preview HÃ  Ná»™i cÅ©. KhÃ´ng dÃ¹ng lÃ m báº±ng chá»©ng backend vÃ¹ng má»›i. KhÃ´ng xÃ¡c minh láº¡i toÃ n bá»™ env/cwd cá»§a process cÅ©. | GET /api/rooms quan sÃ¡t thiáº¿u mapId; pháº£i kiá»ƒm láº¡i Ä‘á»ƒ phÃ¢n biá»‡t. ÄÆ°á»£c **giá»¯ nguyÃªn**, khÃ´ng táº¯t/restart trong bÃ n giao. |

ChÆ°a cÃ³ listener 3000/3001 trong quan sÃ¡t cá»•ng cá»§a lÆ°á»£t nÃ y. PID/session khÃ´ng ghi vÃ o báº£ng vÃ¬ chá»‰ tá»“n táº¡i trong mÃ¡y/phiÃªn hiá»‡n táº¡i. Báº£ng lÃ  snapshot cÃ³ ngÃ y, khÃ´ng cam káº¿t process cÃ²n má»Ÿ á»Ÿ mÃ¡y agent má»›i. KhÃ´ng tá»± táº¯t hoáº·c chiáº¿m láº¡i cá»•ng chá»‰ Ä‘á»ƒ chuáº©n hÃ³a mÃ´i trÆ°á»ng.

Concept/báº£n sáº¡ch Ä‘Ã£ mang vÃ o `docs/art-source/hanoi-v2/`, `hanoi-v3/`, `regions/`; prompt trong cÃ¡c *generation.json. Báº£n imagegen gá»‘c cÃ²n á»Ÿ thÆ° má»¥c `.codex/generated_images/...` trÃªn mÃ¡y tÃ¡c giáº£ (Ä‘Æ°á»ng Ä‘áº§y Ä‘á»§ cÃ³ trong manifest); archive repo lÃ  Ä‘áº§u vÃ o Æ°u tiÃªn Ä‘á»ƒ portable. Chá»‰ build/cháº¡y khÃ´ng cáº§n táº¡o áº£nh láº¡i. Script contact sheet cáº§n font Windows; fallback áº£nh v3 cáº§n path mÃ¡y tÃ¡c giáº£ náº¿u archive thiáº¿u.

## 9. Káº¿ hoáº¡ch tiáº¿p quáº£n theo Æ°u tiÃªn

1. **LÃ m ngay:** Ä‘á»c AGENTS â†’ PROJECT_STATUS â†’ README; so HEAD/working tree/fingerprint, giá»¯ nguyÃªn má»i file. Kiá»ƒm /api/maps vÃ  listener Ä‘á»ƒ dÃ¹ng Ä‘Ãºng 3102 náº¿u cÃ²n trÃªn mÃ¡y nÃ y. KhÃ´ng dÃ¹ng HEAD sáº¡ch hoáº·c 3100 cÅ© lÃ m sáº£n pháº©m hiá»‡n táº¡i.
2. Má»Ÿ sáº£nh, chá»n vÃ¹ng vÃ  xem áº£nh final/clean concept Ä‘á»ƒ hiá»ƒu cÃ¡ch dá»±ng. Äá»c MAPS/ART_SOURCES trÆ°á»›c sá»­a scene/POI; Ä‘á»c ARCHITECTURE/MVP_SPEC trÆ°á»›c sá»­a engine/network. YÃªu cáº§u sÃ¡u cáº£nh Ä‘Ã£ triá»ƒn khai, khÃ´ng cáº§n dá»±ng láº¡i tá»« Ä‘áº§u.
3. Náº¿u tiáº¿p tá»¥c kiá»ƒm cháº¥t lÆ°á»£ng theo yÃªu cáº§u ngÆ°á»i dÃ¹ng, Æ°u tiÃªn thiáº¿t bá»‹ váº­t lÃ½ + má»™t tráº­n input tháº­t/600s, rá»“i review cÃ¡c vÃ¹ng/phÆ°Æ¡ng Ã¡n cÃ²n thiáº¿u. Chá»n QA phÃ¹ há»£p khi source má»›i thay Ä‘á»•i; lÆ°u report cÃ³ ngÃ y/source, khÃ´ng tÃ¡i dÃ¹ng sá»‘ 54 nhÆ° káº¿t quáº£ má»›i.
4. Khi Ä‘Æ°á»£c giao sá»­a robustness, tÃ¡i hiá»‡n Q1/Q2/Q3 trong phÃ²ng QA vÃ  xÃ¡c Ä‘á»‹nh bug trÆ°á»›c sá»­a/test; khÃ´ng sá»­a Ä‘áº·c táº£ Ä‘á»ƒ che lá»—i. L1/L2/L3 lÃ  pháº¡m vi validation/auth/load chÆ°a hoÃ n chá»‰nh, cáº§n chá»‘t má»¥c tiÃªu mÃ´i trÆ°á»ng trÆ°á»›c má»Ÿ rá»™ng.
5. Cáº§n ngÆ°á»i dÃ¹ng cung cáº¥p/chá»‘t: feedback má»©c giá»‘ng áº£nh, thiáº¿t bá»‹/browser má»¥c tiÃªu, áº¥n báº£n giÃ¡o trÃ¬nh vÃ  (náº¿u muá»‘n) luáº­t giáº£i Ä‘áº¥u/xáº¿p háº¡ng. KhÃ´ng táº¡o tÃ­nh nÄƒng má»›i chá»‰ vÃ¬ tÃªn game/báº£y vÃ¹ng gá»£i Ã½ cáº¡nh tranh.

## 10. PROMPT CHO AGENT TIáº¾P QUáº¢N

> Tiáº¿p quáº£n repository game â€œQUÃŠ MÃŒNH Äá»¨NG Äáº¦U!â€. Äá»c AGENTS.md, docs/PROJECT_STATUS.md vÃ  README.md trÆ°á»›c; sau Ä‘Ã³ Ä‘á»c ARCHITECTURE/MAPS/ART_SOURCES/TESTING vÃ  source liÃªn quan. PROJECT_STATUS lÃ  tráº¡ng thÃ¡i chÃ­nh. Hiá»‡n Ä‘Ã£ triá»ƒn khai HÃ  Ná»™i + sÃ¡u vÃ¹ng 1672Ã—941, chÆ°a cÃ³ giáº£i Ä‘áº¥u/xáº¿p háº¡ng liÃªn Ä‘á»™i; code vÃ  asset cÃ²n nhiá»u thay Ä‘á»•i chÆ°a commit, pháº£i giá»¯ nguyÃªn. KhÃ´ng dá»±ng láº¡i tá»« Ä‘áº§u, reset/stash/commit hoáº·c táº¯t server Ä‘ang phá»¥c vá»¥. TrÃªn mÃ¡y bÃ n giao cá»•ng 3102 lÃ  backend báº£y vÃ¹ng, cá»•ng 3100 lÃ  preview cÅ©; kiá»ƒm láº¡i thá»±c táº¿ trÆ°á»›c dÃ¹ng. YÃªu cáº§u Ä‘á»“ há»a Ä‘Ã£ triá»ƒn khai, chÆ°a cÃ³ tÃ­nh nÄƒng code Ä‘ang sá»­a dá»Ÿ. Viá»‡c kiá»ƒm cÃ²n thiáº¿u lÃ  Ä‘iá»‡n thoáº¡i váº­t lÃ½, timing solo báº±ng input tháº­t, má»™t sá»‘ negative path Ä‘Æ°á»£c liá»‡t kÃª vÃ  Ä‘á»‘i chiáº¿u giÃ¡o trÃ¬nh. TrÆ°á»›c lá»‡nh phÃ¡t triá»ƒn tiáº¿p theo, xÃ¡c nháº­n báº±ng source/runtime ráº±ng Ä‘Ã£ nháº­n Ä‘Ãºng báº£n, bÃ¡o ngáº¯n pháº§n cÃ²n má»Ÿ; tiáº¿p tá»¥c trong pháº¡m vi tÃ´i giao tiáº¿p, khÃ´ng tá»± triá»ƒn khai giáº£i Ä‘áº¥u hoáº·c sá»­a cÃ¡c nghi váº¥n chÆ°a Ä‘Æ°á»£c giao. Khi cÃ³ thay Ä‘á»•i, kiá»ƒm theo TESTING vÃ  cáº­p nháº­t PROJECT_STATUS cÃ¹ng báº±ng chá»©ng tháº­t.
