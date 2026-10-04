# Tiếp quản project bằng tài khoản Codex khác

Cập nhật 04/10/2026. File này giúp lấy lại context; không tự giao thêm công việc phát triển.

## Cập nhật sau task input / interaction

PC dùng WASD/Arrows + Shift + E/G + M/Esc; mobile joystick analog sprint + E/G + Map/Menu. G ưu tiên cancel/drop rồi ping. Resolver/catalogue chung ở shared/src/interactions.ts, input ở client/src/game/inputController.ts. Đọc [report](INPUT_INTERACTION_IMPLEMENTATION_REPORT.md) và PROJECT_STATUS hiện hành.

Mốc mới:102/102 tests PASS; các số95 bên dưới là validation collision trước đó. QA input dùng3112/client/dist-input; listener cuối task không thấy3102/3110/3111. C11/C13 và physical multitouch/LAN playtest vẫn mở. Không tự tiếp tục task còn mở.

## Bắt đầu trong 5 phút

1. Mở **cùng thư mục project** trong tài khoản mới. Mốc hiện tại: `C:/Users/52duc/Desktop/Game CNXH`. Các file/code/ảnh trên ổ đĩa không phụ thuộc lịch sử chat của tài khoản cũ.
2. Đọc `AGENTS.md`, phần hiện hành ở đầu `docs/PROJECT_STATUS.md`, rồi phần **Latest update** của `HANDOFF.md`.
3. Nếu nhiệm vụ liên quan collision, đọc `docs/COLLISION_IMPLEMENTATION_REPORT.md`. Chỉ đọc code tại entry point của nhiệm vụ; không audit toàn repository để làm quen.
4. Kiểm tra `git status --short`, `git diff --stat`, diff/file liên quan và server đang chạy. Mọi số cổng/kết quả QA trong tài liệu đều là mốc kiểm tra, không đảm bảo còn đúng sau khi đổi phiên.
5. Tóm tắt đã hiểu và chờ nhiệm vụ tiếp theo. Không tự triển khai C11/C13, TODO cũ, rollback Gemini hay khôi phục code từ trí nhớ của agent.

Khi nguồn mâu thuẫn: **repository hiện tại → PROJECT_STATUS hiện hành → HANDOFF mới nhất → report có ngày/source → lịch sử chat/memory**. Xác minh chỗ khác biệt bằng code; không sửa code chỉ để làm nó khớp báo cáo.

## Game đang làm gì?

“Quê mình đứng đầu!” là game web 2D tiếng Việt phục vụ bài tập CNXHKH/Nhà nước pháp quyền XHCN. Monorepo npm workspaces: `shared` (TypeScript dùng chung), `server` (Node/Express/Socket.IO), `client` (Vite/Phaser).

- Bảy map/phòng: Hà Nội, Hải Phòng, Quảng Ninh, Ninh Bình, Thanh Hóa, Nghệ An, Hà Tĩnh. World 1672 × 941; mapId thuộc từng phòng.
- M1: khảo sát, chọn trạm cố định hoặc lưu động, giao vật tư, triển khai, giám sát/công khai.
- M2: xử lý cầu hỏng bằng sửa cầu hoặc tuyến vòng, vận chuyển/giám sát/công khai.
- M3: xử lý phản hồi và quyền lợi người dân C1/C2, hỗ trợ, đối chiếu kho/công khai.
- Solo là một người trong cùng kiến trúc phòng multiplayer; vẫn hoàn thành 100 điểm. Vai trò là gợi ý, không khóa thao tác.
- Bảy map chưa phải giải đấu bảy đội. Mục tiêu lớp học/60 người chưa được kiểm chứng thành capacity/team system hoàn chỉnh.

## Ý định và ưu tiên của người dùng

- Đồ họa cần sinh động, bám các concept Việt Nam đã lưu; mục tiêu từng trao đổi khoảng80%, **không có phép đo xác nhận đạt80%**.
- Ưu tiên tìm/tái sử dụng asset phù hợp có quyền sử dụng; địa danh chưa có asset có thể tạo riêng. Renderer hiện dùng cảnh sạch + lớp che + vật thể động, không phải tileset ghép tự do. Không tự đổi sang map ô vuông/SVG sơ sài.
- Concept không nằm riêng trong clipboard/chat: `docs/art-source/hanoi-v3/user-concept.png`, `docs/art-source/regions/<mapId>/user-concept.png`; cảnh sạch/atlas/prompt/credits cũng đã lưu. Xem `docs/ART_SOURCES.md` nếu đổi asset.
- Tiếp tục trong phạm vi người dùng giao, không hỏi duyệt lại từng chỉnh sửa thông thường đã được phép; nếu chỉ được yêu cầu re-sync/bàn giao thì không sửa code.

## Mốc triển khai mới nhất

Movement: chân14px, swept movement và trượt theo contact normal, sprint; corner assist đang tắt. Server kiểm tra **toàn đoạn MOVE**, không chỉ endpoint. Client prediction/reconciliation/reconnect dùng snapshot. Người chơi đi xuyên nhau. Âm thanh local dựa trên quãng đường/contact,10 sample Kenney CC0; F2 hiện collision/state/debug, mặc định tắt.

Collision: C01–C10/C12 đã triển khai và kiểm tra geometry/Socket.IO; thêm63 named solids, tách bờ nước khỏi ripple, sửa tiếp cận trạm, collider lều phụ thuộc triển khai, server recovery. Navigation dùng cùng segment validator, grid20px rồi thử10px khi không tìm được đường. Xem report cho vị trí và giới hạn từng ca.

**Còn mở:**

- **C11:** chưa chứng nhận chính xác sàn/lan can thật theo sprite/perspective. Band nominal60px vùng /62px Hà Nội không phải trace rail đã xác minh. Không kết luận “tâm lệch31px là lỗi”; không giảm foot radius để hợp thức hóa mặt cầu.
- **C13:** source/build mới và instance riêng đã kiểm tra, nhưng server cũ3102 chưa restart do còn state phòng trong RAM. Chưa có cơ chế backup/restore phòng được kiểm chứng.
- Continuous WASD giữ phím, feel/sprint cạnh vật cản, nghe âm thanh thật, thiết bị di động/latency/load chưa kiểm đầy đủ. Socket.IO MOVE không phải playtest WASD.
- Đường vòng phía bắc Hà Tĩnh đi trên đất quanh đầu suối, chưa vẽ thêm đường trên ảnh; cần review cảm nhận/trực quan. Không tuyên bố mọi vật thể trên toàn ảnh đều có footprint chính xác.

Đây là danh sách bàn giao, **không phải lệnh tự tiếp tục**.

## Entry points và nguồn được sinh

| Việc được giao | Đọc/sửa ở đâu |
|---|---|
| Quest/job/resources/vote/host | `server/src/gameEngine.ts`, `shared/src/constants.ts`, `types.ts` |
| Phòng/API/network/rejoin | `server/src/server.ts`, `roomManager.ts`, `client/src/network/socketClient.ts` |
| Footprint/nước/floor vùng | `scripts/collision-layout.json`, `scripts/prepare-regions.py`, `shared/src/worldMaps.ts`, `collisionGeometry.ts` |
| Hanoi geometry | `shared/src/mapData.ts`; additions trong collision-layout cũng áp dụng Hà Nội |
| Solver/segment/recovery/route | `shared/src/movement.ts`, `navigation.ts` |
| Input/prediction/camera/animation | `client/src/scenes/MainScene.ts` |
| Renderer/occlusion/art | `client/src/game/hanoiScene.ts`, `regionalScene.ts`; archive + `docs/ART_SOURCES.md` |
| Mission target/UX | `shared/src/missionGuide.ts`, `client/src/ui/` |
| Audio/debug | `client/src/game/soundManager.ts`, `movementDebug.ts` |
| Kiểm tra | `server/src/__tests__/`, `scripts/verify-regions.mjs`, `docs/TESTING.md` |

Không sửa riêng output `shared/src/collisionLayout.ts` / `regionalMapData.ts`. Sửa nguồn rồi chạy:

```powershell
python scripts/prepare-regions.py --geometry-only
npm run build --workspace=shared
```

Python cần Pillow vì generator import Pillow, kể cả chế độ geometry-only. Build npm thông thường không cần tái sinh ảnh. Full `prepare-regions.py` còn ghi asset/layers; `prepare-hanoi-v2.py` có tác dụng phụ sửa bounds `mapData.ts`; đọc script trước khi dùng. Các script/source archive nằm trong repo, không trông chờ cache công cụ của tài khoản cũ.

## Chạy và kiểm tra đúng bản

Từ root, dependency đã có thì không cần cài lại chỉ vì đổi tài khoản. Checkout mới có lockfile: `npm ci`, rồi build shared trước khi test/server vì server import `shared/dist`.

```powershell
npm run build --workspace=shared
npm run typecheck
npm test
```

Chỉ chạy các check này khi sửa code hoặc được giao kiểm tra; lượt bàn giao Markdown không cần rerun. Mốc trước bàn giao: **95/95 tests**, typecheck và build PASS; server thật bảy map hoàn thành M1/M2/M3=100, cargo reconnect, hai socket nhận state triển khai. Live overlap recovery đã thử ở Hanoi B/Thanh Hoa B/Ha Tinh C; map/placement khác có unit fixture, không tự gán thành live gameplay PASS.

**Đừng build client/dist mới rồi để server cũ phục vụ frontend/backend lệch bản.** Nếu cần kiểm tra riêng khi live server còn phòng, dùng bundle riêng:

```powershell
npm run build --workspace=shared
npm run build --workspace=server
npm run build --workspace=client -- --outDir dist-collision
# Xác minh cổng3112 trống trước; đây là ví dụ, không mặc định mở thêm process.
$env:PORT='3112'
$env:SERVER_PORT='3112'
$env:HOST='127.0.0.1'
$env:CLIENT_DIST_PATH=Join-Path (Get-Location) 'client/dist-collision'
node server/dist/server.js
```

Dev mặc định Vite3000/server3001, proxy cố định trong `client/vite.config.ts`. `npm start` chạy server source qua tsx; `node server/dist/server.js` chạy build. Đổi source/shared/dist **không** cập nhật module đã cache trong process đang chạy.

Kiểm tra process/cổng và đọc `/api/rooms` trước mọi restart. Phòng/session ở RAM; zero online không có nghĩa được xóa tiến độ của phòng RUNNING. Không dừng process của người dùng để “dọn bàn giao”. Không lưu host token/player token/.env vào tài liệu.

Mốc 04/10:3102 bản cũ vẫn nhận MOVE xuyên hồ, có VN2336/VN4705 RUNNING;3110 preview cũ có segment validation;3111 instance collision riêng đã kiểm tra. **Phải kiểm lại**, không dựa vào PID/port lịch sử để kill/restart.

## Chuyển tài khoản / chuyển máy

- Đổi tài khoản trên cùng máy: mở lại đúng folder; project/docs vẫn ở đó, không cần truy cập chat cũ để tiếp quản.
- Nếu đổi máy: mang toàn bộ working tree gồm file chưa tracked, `client/public/assets/`, `docs/art-source/`, `docs/audio-source/`, `scripts/`, `shared/server/client`, docs và `.git` nếu cần lịch sử. Không chỉ clone/checkout HEAD: nhiều code/ảnh hiện tại chưa commit. `git diff` không chứa nội dung untracked.
- Các dist/node_modules bị ignore, có thể rebuild/cài lại. `.env` riêng cấu hình tại máy mới, không đưa vào tài liệu/chat. Thay tài khoản không tự bảo toàn phòng RAM nếu máy/process tắt.
- Không tự reset/stash/commit hoặc xóa asset vì working tree “bẩn”. Diff so HEAD chứa nhiều lượt Codex/Gemini; không gán toàn bộ cho lần sửa gần nhất.
- `HANDOVER_SOURCE.json`, các handover v2/v3/regions và phần Historical là mốc cũ; không lấy số tests/claim capacity cũ làm hiện trạng.

## Prompt gửi cho Codex mới

> Hãy tiếp quản project ở thư mục đang mở. Đọc AGENTS.md, docs/ACCOUNT_TRANSFER.md, phần hiện hành của docs/PROJECT_STATUS.md và Latest update trong HANDOFF.md; nếu cần đọc docs/COLLISION_IMPLEMENTATION_REPORT.md. Đối chiếu git status/diff và code liên quan, lấy repository hiện tại làm source of truth. Chưa sửa code, chưa chạy TODO/C11/C13, chưa rollback hay restart server. Tóm tắt ngắn trạng thái, quy tắc cần giữ và phần còn mở, rồi chờ tôi giao nhiệm vụ.
