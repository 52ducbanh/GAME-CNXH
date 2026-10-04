# Phân công sửa lỗi hình ảnh và di chuyển — 04/10/2026

Người dùng báo game còn lỗi hình ảnh và di chuyển. Đợt này chỉ tái hiện và sửa các lỗi đó; không giao tính năng mới. Ba người làm trên nhánh cùng tên, không giao nhiệm vụ cho ducbanh.

Baseline code: `69d95bb` trên main. Typecheck/build và 141 tests đã PASS ở lượt push trước, nhưng không chứng minh hình ảnh hoặc cảm giác di chuyển đã đúng. Các triệu chứng dưới đây là nhóm cần kiểm tra, chưa phải kết luận mọi lỗi đều đã tái hiện hoặc xác định nguyên nhân.

| Người / nhánh | Nhóm lỗi phụ trách | Kết quả cần giao |
| --- | --- | --- |
| leeduc | Nền bản đồ, ảnh vật thể, lớp che/mask | Sửa ảnh/lớp che sai vị trí, viền cắt, nền và vật thể bị chồng hoặc thiếu; ảnh trước–sau từng vị trí lỗi |
| chuowng | Nhân vật, thứ tự vẽ, animation và camera khi di chuyển | Sửa nhân vật che khuất sai, sprite/origin sai, animation trượt chân/sai hướng, camera hoặc hình nhân vật giật; video trước–sau cùng thao tác |
| datmup | Va chạm, đường đi và solver di chuyển | Sửa vị trí nhìn đi được nhưng bị chặn, đi xuyên vật cản/nước, kẹt góc/cửa/cầu, lệch vị trí chân so với vùng đi; route trace và test tái hiện lỗi |

## Phạm vi file chốt để làm song song

Mỗi file có một người được commit sửa trực tiếp trong đợt này. Người còn lại đọc/debug và gửi trace hoặc đề xuất; chủ file áp dụng phần sửa đó. Quyền phụ trách không phải yêu cầu sửa mọi file hoặc mở rộng ngoài bug đã tái hiện.

| Chủ file | File / thư mục | Phần được sửa |
| --- | --- | --- |
| leeduc | `client/public/assets/hanoi/`, `client/public/assets/regions/` | Pixel ảnh nền, atlas, alpha, ảnh crop và asset sinh; giữ bố cục, kích thước và state gameplay |
| leeduc | `scripts/prepare-hanoi-v3.py`, `scripts/prepare-region-sprites.py` | Crop, mask, đóng atlas và xuất ảnh đúng pipeline |
| leeduc | **Toàn bộ** `scripts/prepare-regions.py` | Pipeline ảnh và dữ liệu lớp che. Geometry trong DATA chỉ đổi theo đề xuất có trace của datmup; datmup không cùng commit vào script |
| leeduc | `client/src/game/hanoiSceneLayers.ts`, `client/src/game/regionalLayers.ts`, asset `layers.json` | Đầu ra sinh từ nguồn/pipeline; không sửa tay |
| leeduc | `shared/src/regionalMapData.ts` | Đầu ra sinh chứa cả DATA và metadata hình ảnh; độc quyền commit để tránh hai pipeline ghi đè nhau |
| chuowng | **Toàn bộ** `client/src/scenes/MainScene.ts` | Camera, player containers, origin/depth, animation, nội suy người khác; nếu có bug ở `handleMovement`, `flushMovement`, `updateFromSnapshot` thì chuowng áp dụng sửa sau khi nhận trace datmup |
| chuowng | `client/src/gameplay/core/regionalRenderer.ts`, `client/src/gameplay/provinces/hanoi/presentation.ts` | Vị trí hiển thị, origin, depth, alpha/fade và vẽ đối tượng động; không sửa asset hoặc collision |
| chuowng | `client/src/game/hanoiAssets.ts` | Đường preload, kích thước frame, CHARACTER_ROWS và animation; pixel atlas do leeduc sửa |
| datmup | `scripts/collision-layout.json` | Footprints, vùng nước/ground/floor/cửa theo ảnh runtime và chân14px |
| datmup | `shared/src/collisionLayout.ts` | Đầu ra sinh từ collision-layout.json; không sửa tay |
| datmup | `shared/src/mapData.ts`, `shared/src/worldMaps.ts` | Geometry Hà Nội, walkability và lấy collision flags; không thay kích thước world, nhiệm vụ hoặc metadata hình ảnh |
| datmup | `shared/src/collisionGeometry.ts`, `shared/src/movement.ts`, `shared/src/navigation.ts`, `shared/src/movementFeedback.ts` | Kiểm đoạn, swept/sliding, route và feedback tính từ di chuyển; giữ các quy tắc movement trong AGENTS |
| datmup | `client/src/game/inputController.ts`, `client/src/ui/touchControls.ts`, `client/src/game/movementDebug.ts` | Phím/joystick bị kẹt, reset khi blur/ẩn tab, vector input và trace; không đổi layout/UI hay hành vi E/G/M |
| datmup | `server/src/gameEngine.ts` | Chỉ nhánh MOVE, `handleMove` và collision flags/recovery liên quan khi trace chứng minh bug; không sửa lifecycle/điểm/luật tỉnh |
| datmup | `server/src/__tests__/movement.test.ts`, `collisionLayout.test.ts`, `regionalMaps.test.ts`, `hanoiMap.test.ts` | Regression cho bug collision/route/movement thật |

File ngoài bảng không có người được tự mở rộng phạm vi sửa. Nếu root cause nằm ngoài bảng, ghi rõ trong báo cáo và thống nhất chủ file trước khi bắt đầu sửa. Cả ba không cùng sửa AGENTS, TASK_CURRENT, PROJECT_STATUS hoặc TESTING; chỉ báo cáo riêng và PR.

## Danh sách việc cụ thể theo thứ tự

### leeduc / nhánh leeduc

1. **IMG-01 — Ảnh nền/vật thể:** kiểm bảy map ở overview/follow; tìm nền bị chồng, mất asset, sai crop/scale và viền alpha. Ghi đúng địa điểm và sửa pixel/pipeline; không di chuyển landmark hoặc đường đi để chữa ảnh.
2. **IMG-02 — Lớp che:** đi trước/sau mái nhà, tán cây và lan can; sửa polygon crop, ảnh foreground lệch/mất và phần nền bị cắt vào mask. Nếu mask đúng nhưng depth runtime sai, chuyển cho chuowng.
3. **IMG-03 — Atlas/state:** kiểm ảnh cầu nguyên/hỏng/sửa và trạm chưa/đã triển khai, cảnh Hà Tĩnh trước/sau rescue. Pixel/frame ảnh sai thuộc leeduc; index frame/renderer chọn state sai gửi chuowng.

Giao `docs/bugfix-leeduc.md` và ảnh trước–sau. Không đổi geometry/POI; trường hợp cần đổi DATA dùng đề xuất datmup đã thống nhất.

### chuowng / nhánh chuowng

1. **RENDER-01 — Nhân vật và depth:** kiểm chân, bóng, tên và kiện đang cầm; đi trước/sau cây/nhà/cầu/lều. Sửa origin/depth/fade runtime, không sửa ảnh và không dùng sprite bounds làm collision.
2. **RENDER-02 — Animation:** đi bốn hướng/chéo, sprint, đổi hướng và dừng; sửa sai hàng/frame, đứng vẫn chạy animation, trượt chân do trạng thái animation hoặc kích thước frame sai. Không đổi tốc độ di chuyển để khớp animation.
3. **RENDER-03 — Camera và giật hiển thị:** giữ phím liên tục, theo dõi local/remote player, chuyển M và resize. Tách giật camera/nội suy khỏi bị server kéo vị trí. Chuowng là người duy nhất sửa MainScene, kể cả phần reconcile nếu nhận trace nguyên nhân từ datmup; giữ prediction/reconcile/rejoin hoạt động.

Giao `docs/bugfix-chuowng.md` và video trước–sau. Không sửa input controller, collision, wire protocol hoặc nhiệm vụ.

### datmup / nhánh datmup

1. **MOVE-01 — Chân so với vật cản:** bật F2 và trace đường quanh mép nước, góc nhà, cầu/lan can; sửa footprint/floor lệch ảnh hoặc solver chặn sai. C11 phải xác minh theo transform thật, không nới floor/foot cho qua test.
2. **MOVE-02 — Tuyến đi và cửa:** kiểm spawn → điểm nhiệm vụ ở bảy map, cầu hỏng/sửa và lều chưa/đã dựng; sửa kẹt góc/cửa, đi xuyên tường/nước hoặc tuyến vòng không tới được. Nếu phải sửa spawn/paths/bridge/detour/POI/colliders trong DATA của prepare-regions, gửi tọa độ và trace cho leeduc áp dụng; không sửa script đó trực tiếp.
3. **MOVE-03 — Điều khiển và server kéo lại:** kiểm đi chéo/sprint, giữ rồi nhả phím/joystick, blur/tab ẩn; sửa vector/reset/solver và server MOVE khi bug ở các file mình phụ trách. Gửi predicted/authoritative positions, MOVE path/ACK và đề xuất sửa MainScene cho chuowng nếu bug ở client flush/reconcile.

Giao `docs/bugfix-datmup.md`, route trace và regression test. Không sửa renderer/asset/MainScene; không đổi chân14px, cornerAssist0, sliding/sweep hoặc luật nhiệm vụ.

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
- Điểm sửa trực tiếp: `scripts/collision-layout.json`, `shared/src/mapData.ts` cho Hà Nội và các file solver/walkability/input/server MOVE trong bảng ownership. DATA/hình học trong `scripts/prepare-regions.py` thuộc leeduc; datmup gửi đề xuất có trace, không cùng sửa script.
- Geometry-only: sửa nguồn rồi chạy `python scripts/prepare-regions.py --geometry-only`, build shared trước test/server. Không sửa ảnh hoặc renderer; không nới footprint14px, bật corner assist, bỏ swept/sliding, chặn người chơi đi xuyên nhau hoặc đổi server sang kiểm endpoint-only.
- Client/server/navigation phải dùng cùng bridge/deployment flags. Với lỗi server kéo vị trí, gửi trace predicted/authoritative và đoạn MOVE; datmup chỉ sửa phần server MOVE mình sở hữu khi chứng minh được nguyên nhân. Phần flush/reconcile trong MainScene luôn do chuowng áp dụng.
- Nghiệm thu: tuyến lỗi đi được đúng phần nền, vẫn không xuyên vật cản/nước; cầu hỏng/sửa, lều chưa/đã triển khai và cửa giữ đúng; đi chéo/sprint không kẹt mới. Thêm regression test cho bug tái hiện. Báo cáo riêng ở `docs/bugfix-datmup.md`.

## Tránh xung đột và kiểm tra chung

- leeduc là người duy nhất commit prepare-regions và regionalMapData. datmup được chạy `--geometry-only` để sinh collisionLayout nhưng không stage regionalMapData nếu chỉ thay collision-layout.json; nếu output đó đổi, kiểm nguồn và chuyển đề xuất cho leeduc. leeduc chạy full pipeline không stage collisionLayout có thay đổi ngoài phần đã thống nhất với datmup. Không reset hoặc xóa diff của người kia để dọn.
- chuowng là người duy nhất commit MainScene. datmup gửi trace/đề xuất thay vì sửa cùng file; chuowng áp dụng trong nhánh chuowng. Nếu cần đổi chủ file, phải thống nhất trước và cập nhật phân công, không cùng sửa song song.
- Merge PR datmup và leeduc từng cái; PR vào sau cập nhật main và tái sinh từ nguồn đã ghép, kiểm toàn bộ generated diff. Nếu sửa geometry và hình ảnh phụ thuộc nhau, chưa coi vị trí đó nghiệm thu trước khi kiểm bản ghép. Sau đó tích hợp renderer/animation/camera chuowng và chạy lại tuyến lỗi trên bản chung; không chấp nhận giải conflict bằng chọn toàn bộ một phía.
- Mỗi người ghi evidence và tiến độ trong báo cáo riêng, tránh cùng sửa TASK_CURRENT/PROJECT_STATUS. Khi tích hợp sẽ tổng hợp trạng thái; các lịch sử kiểm tra vẫn giữ nguyên.
- Đọc AGENTS → PROJECT_STATUS → TASK_CURRENT rồi MAPS/ART_SOURCES/TESTING theo lỗi. Bảo toàn working tree và asset lịch sử. QA dùng instance riêng với CLIENT_DIST_PATH; không overwrite client/dist hoặc restart server đang dùng.
- Với thay code/geometry/renderer: build shared, typecheck, test và build phù hợp; client dùng outDir QA riêng. Thay map/renderer bắt buộc nhìn game và đi lại route đã sửa. Không có thiết bị thật thì ghi NOT TESTED, không coi viewport mobile là điện thoại thật.
- Ưu tiên đầu tiên: lỗi khiến không tới được điểm nhiệm vụ hoặc nhân vật bị che/mất/giật đến mức không điều khiển được. Sau đó mới sửa viền ảnh và lỗi trang trí nhỏ. Giữ tiếng Việt, nội dung học thuật, ba nhiệm vụ và điểm/luật hiện hành.
