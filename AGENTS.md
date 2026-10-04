# Hướng dẫn tiếp quản

Agent mới đọc **AGENTS.md → phần hiện hành của [PROJECT_STATUS](docs/PROJECT_STATUS.md) → [TASK_CURRENT](TASK_CURRENT.md)**. Đây là luồng tiếp quản chính. [ACCOUNT_TRANSFER](docs/ACCOUNT_TRANSFER.md) dùng khi chuyển máy/tài khoản; [HANDOFF](HANDOFF.md) và report có ngày dùng để truy vết. Chỉ đọc thêm khi cần: [gameplay](docs/MVP_SPEC.md), [kiến trúc](docs/ARCHITECTURE.md), [bản đồ](docs/MAPS.md), [mỹ thuật](docs/ART_SOURCES.md), [kiểm tra](docs/TESTING.md), [kiến thức](docs/KNOWLEDGE_MAP.md).

PROJECT_STATUS là điểm đọc chính về trạng thái/công việc còn mở; **repository hiện tại quyết định implementation thật**. Handoff/report có ngày là bằng chứng tương ứng, không đảm bảo server vẫn chạy cùng bản. Phần lịch sử có các số tests/claim cũ. Khi chỉ được yêu cầu đọc/bàn giao, không tự sửa code, chạy TODO, rollback Gemini hoặc restart server.

Trạng thái/test/runtime cập nhật ở PROJECT_STATUS; phạm vi tiếp theo ở TASK_CURRENT. Không dùng số tests, cổng hay phòng trong report lịch sử làm chứng nhận bản đang chạy.

## Quy tắc phải giữ

- Giữ tiếng Việt, nội dung CNXHKH, ba nhiệm vụ, solo làm trọn được và co-op chia việc. Vai trò chỉ gợi ý, không khóa hành động hay bắt đủ quân số.
- Giữ chân14px, swept movement/sliding, sprint/audio, corner assist tắt, prediction/reconcile/rejoin và người chơi đi xuyên nhau. Collision client/server/navigation dùng cùng deployment/bridge flags; server kiểm toàn đoạn MOVE, không nới thành endpoint-only.
- Server quyết định ngân sách, vật tư, điểm, điều kiện nhiệm vụ và quyền host. Client gửi intent và đọc snapshot; không dựng tiến độ giả bằng UI.
- Giữ một InputController cho PC/mobile và catalogue tương tác chung. E theo context; G ưu tiên hủy job → đặt kiện → ping. Action qua MainScene.executeAction, pending đến ACK; START_JOB helper qua GameEngine.handleIntent. Menu khóa input cá nhân, không pause phòng; M không tự đóng khi đi.
- Bảy vùng là bảy lựa chọn bản đồ/phòng. Host + Projector dùng chung dashboard so điểm của bảy phòng mặc định, thay dòng tỉnh bằng phòng riêng đang xem; đây là projection đọc state, chưa có giải đấu/bộ điều phối trận liên đội. Không tự mở rộng luật hoặc điều khiển thành toàn bộ bảy phòng.
- Hình ảnh bám concept đã lưu, dùng cảnh nền chi tiết + lớp che + đối tượng động. Không thay bằng bản đồ ô vuông/SVG đơn giản hoặc coi đây là tileset ghép tự do.
- Bảo toàn working tree chưa commit và asset/báo cáo lịch sử. Không tự reset/stash/commit, xóa asset hoặc tắt server đang dùng để “dọn” bàn giao. Không lưu token, `.env` riêng hoặc ID tiến trình như dữ kiện bền vững trong tài liệu.
- Khi đổi học thuật, đối chiếu giáo trình/nguồn và ghi giới hạn mô phỏng; `GAME_RULE_*` là mã mô phỏng, không phải số điều luật.

## Nơi sửa

| Việc | Điểm vào |
| --- | --- |
| Gameplay tỉnh / luật dùng chung | `shared/src/gameplay/provinces/<id>/`; rules/state ở `server/src/gameplay/presets/public-service/` và `server/src/gameplay/provinces/ha-tinh/`; registry chọn runtime/module |
| Coordination / capability chung | `server/src/gameEngine.ts`, `server/src/gameplay/core/`; types/commands ở `shared/src/gameplay/core/`, thông số `shared/src/constants.ts` |
| API, Socket.IO, session/phòng | `server/src/server.ts`, `roomManager.ts`; `client/src/network/socketClient.ts` |
| Map/collision/route | `scripts/collision-layout.json`, `scripts/prepare-regions.py`, `shared/src/worldMaps.ts`, `mapData.ts`, `collisionGeometry.ts`, `movement.ts`, `navigation.ts`; xem [MAPS](docs/MAPS.md) |
| Renderer/camera | Một `client/src/scenes/MainScene.ts`; `client/src/gameplay/registry.ts`, `core/regionalRenderer.ts`, `provinces/hanoi/presentation.ts`; metadata/view ở shared province/preset |
| Input/tương tác/ACK | `client/src/game/inputController.ts`, `shared/src/interactions.ts`, `MainScene.ts::executeAction`, `socketClient.ts`; server `gameEngine.ts::handleIntent` |
| UI/mobile | `client/src/ui/`, CSS; gameplay presentation qua ProvinceView, không thêm branch tỉnh vào HUD/minimap/TaskPanel |
| Học thuật | `shared/src/knowledgeMap.ts`, `docs/KNOWLEDGE_MAP.md` |
| Test | `server/src/__tests__/`, `scripts/verify-province-parity.mjs`, `verify-province-network.mjs`, `verify-hatinh-runtime.mjs`; xem [TESTING](docs/TESTING.md) |

Tính năng tỉnh dùng capability hiện có: ưu tiên module + test, không sửa GameEngine/UI core. Province handler nhận narrow ports, không import GameEngine. m1/m2/m3 là wire projections; test cần canonical state dùng fixture runtime factory, không ghi vào getter/projection. Locality proof test-only không được đăng ký production.

Collision-only: sửa nguồn rồi `python scripts/prepare-regions.py --geometry-only`; build shared trước test/server. Không overwite client/dist đang được server cũ phục vụ; dùng CLIENT_DIST_PATH và bundle riêng nếu cần QA cách ly.

Không sửa riêng các đầu ra được sinh: `shared/src/collisionLayout.ts` từ `scripts/collision-layout.json` qua `scripts/prepare-regions.py`; `shared/src/regionalMapData.ts` và `client/src/game/regionalLayers.ts` từ `scripts/prepare-regions.py`; `client/src/game/hanoiSceneLayers.ts` từ `scripts/prepare-hanoi-v3.py`. Các `layers.json`/WebP/atlas tương ứng cũng được sinh. `prepare-hanoi-v2.py` còn có tác dụng sửa bounds trong `shared/src/mapData.ts`; đọc pipeline trước khi chạy.

Kiểm tra theo mức ảnh hưởng: `npm run typecheck`, `npm test`, `npm run build`; thay map/renderer cần thêm QA tuyến đi và nhìn game. Không chạy lại toàn bộ chỉ vì đổi Markdown. Ghi lệnh, kết quả, nguồn tương ứng và phần chưa kiểm tra vào PROJECT_STATUS/TESTING; cập nhật đặc tả khi quyết định sản phẩm đổi, không sửa đặc tả để hợp thức hóa bug.

Tại mốc bàn giao 03/10/2026 chưa có `AGENTS.md` khác trong repository; nếu xuất hiện sau này, đọc và tuân thủ hướng dẫn trong phạm vi thư mục đó.
