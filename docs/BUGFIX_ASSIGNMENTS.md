# Phân công sửa lỗi hình ảnh và di chuyển — 04/10/2026

Người dùng báo game còn lỗi hình ảnh và di chuyển. Đợt này chỉ tái hiện và sửa các lỗi đó; không giao tính năng mới. Ba người làm trên nhánh cùng tên, không giao nhiệm vụ cho ducbanh.

Baseline code: `69d95bb` trên main. Typecheck/build và 141 tests đã PASS ở lượt push trước, nhưng không chứng minh hình ảnh hoặc cảm giác di chuyển đã đúng. Các triệu chứng dưới đây là nhóm cần kiểm tra, chưa phải kết luận mọi lỗi đều đã tái hiện hoặc xác định nguyên nhân.

| Người / nhánh | Nhóm lỗi phụ trách | Kết quả cần giao |
| --- | --- | --- |
| leeduc | Nền bản đồ, ảnh vật thể, lớp che/mask | Sửa ảnh/lớp che sai vị trí, viền cắt, nền và vật thể bị chồng hoặc thiếu; ảnh trước–sau từng vị trí lỗi |
| chuowng | Nhân vật, thứ tự vẽ, animation và camera khi di chuyển | Sửa nhân vật che khuất sai, sprite/origin sai, animation trượt chân/sai hướng, camera hoặc hình nhân vật giật; video trước–sau cùng thao tác |
| datmup | Va chạm, đường đi và solver di chuyển | Sửa vị trí nhìn đi được nhưng bị chặn, đi xuyên vật cản/nước, kẹt góc/cửa/cầu, lệch vị trí chân so với vùng đi; route trace và test tái hiện lỗi |

## Cách nhận và sửa một lỗi

1. Build đúng source vào bundle QA riêng, xác định map và state đang xem. Không lấy server/bundle lịch sử làm bằng chứng bản hiện tại.
2. Ghi map, tọa độ hoặc địa điểm, kích thước màn hình, phím/thao tác, trạng thái cầu/lều và bước tái hiện. Chụp ảnh hoặc quay video trước sửa. Với mỗi lỗi đặt mã IMG-01, RENDER-01 hoặc MOVE-01 theo nhóm.
3. So ảnh với F2/debug: ảnh sai vị trí do asset/mask thuộc leeduc; tọa độ đúng nhưng thứ tự vẽ/animation/camera sai thuộc chuowng; vị trí/đường đi bị solver hoặc server chặn sai thuộc datmup. Giật có thể đến từ camera hoặc reconcile; xác định nguyên nhân trước khi chuyển người phụ trách.
4. Sửa một lỗi có thể kiểm lại được. Dùng cùng route và cùng state để lấy bằng chứng sau sửa. Ghi lỗi đã sửa, lỗi còn mở và phần chưa kiểm; không chỉ ghi “tests PASS” hoặc “đã sửa toàn bộ”.
5. Mỗi nhánh gửi PR vào main gồm lỗi tái hiện, nguyên nhân, file đổi và evidence. Không tự merge PR của người khác.

## leeduc — Nền và lớp che

- Kiểm bảy map: nền/cầu/trạm/thuyền có chồng ảnh cũ, ảnh mất hoặc lệch không; mái nhà/tán cây/lan can có crop, polygon mask, alpha hoặc vị trí sai không. Chỉ sửa khi có ảnh tái hiện và đối chiếu đúng concept.
- Điểm sửa: asset runtime trong `client/public/assets/hanoi/` và `client/public/assets/regions/`; nguồn tạo lớp ảnh ở `scripts/prepare-hanoi-v3.py`, phần crop/mask/layers của `scripts/prepare-regions.py`, hoặc `scripts/prepare-region-sprites.py` khi atlas thực sự sai.
- Không thay bố cục bản đồ, geometry, POI, kích thước world hoặc luật game. Không viết tay các TS/layers.json/WebP được sinh. Không chuyển cảnh thành bản đồ ô vuông hoặc SVG đơn giản.
- Ảnh gốc trong docs/art-source đang ở máy chủ dự án và chưa được push. Checkout GitHub đủ chạy game, nhưng trước khi regenerate phải lấy đúng ảnh nguồn tương ứng; không chạy pipeline với đầu vào thiếu hoặc đường tuyệt đối của máy khác.
- Nghiệm thu: chụp overview và follow ở desktop/mobile; đi trước/sau vật thể đã sửa để thấy mask không cắt sai; kiểm state cầu và trạm liên quan. Báo cáo riêng ở `docs/bugfix-leeduc.md`.

## chuowng — Nhân vật và hiển thị lúc đi

- Giữ WASD và đi chéo, đổi hướng/đứng lại/sprint; kiểm sprite, chân/bóng, frame và tốc độ animation. Đi qua cây, nhà, cầu, lều để kiểm thứ tự vẽ nhân vật. Kiểm camera follow/overview, resize và M khi đang đi.
- Điểm sửa: `client/src/scenes/MainScene.ts`, `client/src/gameplay/core/regionalRenderer.ts`, `client/src/gameplay/provinces/hanoi/presentation.ts`; cấu hình frame/animation trong `client/src/game/hanoiAssets.ts` nếu sai nguồn nạp.
- Phụ trách origin/depth/fade và camera trong renderer. leeduc phụ trách pixel ảnh và polygon crop. Không thay hình học/collision để che lỗi vẽ. Giữ một MainScene, chân sprite đúng world position, M không tự đóng khi di chuyển, không tạo tiến độ nhiệm vụ bằng UI.
- Nếu debug cho thấy authoritative position bị kéo lại, chuyển trace cho datmup; không tắt reconcile/prediction hoặc bỏ kiểm MOVE để làm hình có vẻ mượt.
- Nghiệm thu: video trước–sau giữ phím liên tục và đi chéo; frame đứng/đi đúng hướng, camera ổn định, chân và lớp che đúng ở các vị trí lỗi; desktop và viewport mobile. Báo cáo riêng ở `docs/bugfix-chuowng.md`.

## datmup — Va chạm và đường di chuyển

- Đi thử các vị trí người dùng báo lỗi và tuyến spawn → điểm nhiệm vụ; tập trung mép nước, góc nhà/tán cây, cửa lều, hai đầu cầu và lan can. Đối chiếu sprite transform với chân14px; C11 floor/rail alignment là vùng cần xác minh, chưa phải bug đã có root cause.
- Điểm sửa: `scripts/collision-layout.json`; DATA/hình học trong `scripts/prepare-regions.py`; `shared/src/mapData.ts` cho Hà Nội; `shared/src/collisionGeometry.ts`, `movement.ts`, `navigation.ts`, `worldMaps.ts` khi trace chứng minh solver/state sai.
- Geometry-only: sửa nguồn rồi chạy `python scripts/prepare-regions.py --geometry-only`, build shared trước test/server. Không sửa ảnh hoặc renderer; không nới footprint14px, bật corner assist, bỏ swept/sliding, chặn người chơi đi xuyên nhau hoặc đổi server sang kiểm endpoint-only.
- Client/server/navigation phải dùng cùng bridge/deployment flags. Với lỗi server kéo vị trí, gửi trace predicted/authoritative và đoạn MOVE; chỉ sửa `server/src/gameEngine.ts` hoặc phần reconcile MainScene nếu đã chứng minh nguyên nhân, phối hợp chuowng trước khi cùng sửa MainScene.
- Nghiệm thu: tuyến lỗi đi được đúng phần nền, vẫn không xuyên vật cản/nước; cầu hỏng/sửa, lều chưa/đã triển khai và cửa giữ đúng; đi chéo/sprint không kẹt mới. Thêm regression test cho bug tái hiện. Báo cáo riêng ở `docs/bugfix-datmup.md`.

## Tránh xung đột và kiểm tra chung

- leeduc giữ phần ảnh/layers của prepare-regions; datmup giữ DATA/hình học/collision. Full asset generation cũng sinh geometry: chỉ nhận diff đúng phạm vi, trao đổi thay đổi nguồn trước khi regenerate và kiểm generated diff sau merge. Không ghi đè sửa của người kia để dọn diff.
- chuowng giữ renderer/MainScene. Khi datmup cần sửa reconcile/MOVE cùng file, thống nhất hunk hoặc để PR chuowng vào main trước rồi cập nhật nhánh; không cùng viết lại cả file.
- Mỗi người ghi evidence và tiến độ trong báo cáo riêng, tránh cùng sửa TASK_CURRENT/PROJECT_STATUS. Khi tích hợp sẽ tổng hợp trạng thái; các lịch sử kiểm tra vẫn giữ nguyên.
- Đọc AGENTS → PROJECT_STATUS → TASK_CURRENT rồi MAPS/ART_SOURCES/TESTING theo lỗi. Bảo toàn working tree và asset lịch sử. QA dùng instance riêng với CLIENT_DIST_PATH; không overwrite client/dist hoặc restart server đang dùng.
- Với thay code/geometry/renderer: build shared, typecheck, test và build phù hợp; client dùng outDir QA riêng. Thay map/renderer bắt buộc nhìn game và đi lại route đã sửa. Không có thiết bị thật thì ghi NOT TESTED, không coi viewport mobile là điện thoại thật.
- Ưu tiên đầu tiên: lỗi khiến không tới được điểm nhiệm vụ hoặc nhân vật bị che/mất/giật đến mức không điều khiển được. Sau đó mới sửa viền ảnh và lỗi trang trí nhỏ. Giữ tiếng Việt, nội dung học thuật, ba nhiệm vụ và điểm/luật hiện hành.
