# Bản đồ và pipeline hình học

Cập nhật geometry04/10/2026: xem [collision report](COLLISION_IMPLEMENTATION_REPORT.md) và [PROJECT_STATUS](PROJECT_STATUS.md). Các handover hình ảnh03/10 là lịch sử. Tất cả bảy vùng đã có registry, cảnh, geometry, POI và gameplay; không có vùng thứ tám chỉ dự kiến trong source. Đồ họa là cảnh minh họa cố định + lớp che + đối tượng động, không có Tiled/TMX hoặc thư viện tileset ghép tự do.

## Gameplay/map binding sau refactor 7/7

Bảy definitions ở `shared/src/gameplay/provinces/<id>/definition.ts` bind bằng MapId đến `worldMaps.ts`. Province metadata chứa NPC/palms/waterfall/rescue scene; renderer nhận metadata. Native Hà Nội ở `client/src/gameplay/provinces/hanoi/presentation.ts`, renderer các vùng ở `client/src/gameplay/core/regionalRenderer.ts`; registry chọn presentation cho một MainScene. Hà Tĩnh module cung cấp rescue visual/minimap theo state; renderer không kiểm rescue business flags. Geometry, generator, asset paths và generated TS không đổi trong refactor.

## Registry và kích thước

Đối chiếu input/camera04/10/2026: lượt input không đổi art, POI, geometry hoặc generator. Các thay đổi camera/candidate tương tác nằm ở MainScene/shared interactions; [TASK_CURRENT](../TASK_CURRENT.md) xác định phạm vi bàn giao.

`shared/src/worldMaps.ts`: `MAP_IDS`, `MapId`, `WorldMap`, `GAME_MAPS`, `getGameMap`, `isMapId`, `isWalkableForMap`. World **1672 × 941** ở `constants.ts` và cảnh; mapId theo phòng, reset giữ map. `getGameMap` fallback Hà Nội, nhưng API create kiểm tra `isMapId` trước. Metadata map client phải lấy từ phòng trước preload.

| ID | Landmark | Phòng mặc định | Nguồn geometry |
| --- | --- | --- | --- |
| `hanoi` | Hồ Gươm / Tháp Rùa | `HANOI_01` | `shared/src/mapData.ts` viết tay theo cảnh v3 |
| `hai-phong` | Nhà hát thành phố / Cảng Hải Phòng | `HAIPHONG_01` | `scripts/prepare-regions.py::DATA` |
| `quang-ninh` | Vịnh Hạ Long | `QUANGNINH_01` | Cùng script |
| `ninh-binh` | Tràng An | `NINHBINH_01` | Cùng script |
| `thanh-hoa` | Thành Nhà Hồ | `THANHHOA_01` | Cùng script |
| `nghe-an` | Làng Sen · Kim Liên | `NGHEAN_01` | Cùng script |
| `ha-tinh` | Ngã ba Đồng Lộc | `HATINH_01` | Cùng script |

Spawn Hà Nội `(490,400)`; spawn từng vùng ở DATA, chuyển thành `map.spawn`. AddPlayer có jitter nhỏ; reset đưa về spawn. Cần kiểm tra cả điểm spawn và vùng jitter khi đổi layout.

## POI, đường đi và cầu

Mỗi map có 15 ID chung: HEADQUARTERS, NOTICE_BOARD, WAREHOUSE, ZONE_A/B/C, CLINIC_FIXED, CLINIC_MOBILE_B/C, BRIDGE, BRIDGE_TASK_1/2, CITIZEN_C1/2, PRACTICE_TARGET. Vùng mới lấy tên/type/mô tả từ POI Hà Nội và thay tọa độ; thay ID/metadata phải kiểm tra cả hai nguồn. Bán kính tương tác gameplay 72, radius người dùng va chạm mặc định 14.

Hà Nội: WALKWAYS + polygon hồ/kênh + footprint nhà/thân cây; NORTH_CROSSING cố định và BRIDGE_COLLIDER động. Vùng mới: đường ống rộng 64 quanh polyline, footprint rect, giới hạn biên 25; cầu động rộng 60. Khi hỏng, `isWalkableForMap` khóa khoảng tham số 0,22–0,78 giữa a/b, chừa đầu bờ làm việc. Các polygon `water` vẫn chỉ phục vụ gợn nước. Collision dùng `waterCollision` riêng từ `scripts/collision-layout.json`: path tubes không override nước; chân14px chỉ đi trên phần nước có floor support. Solids được xét kể cả trên floor. Named footprints/groundAreas bổ sung các vùng công cộng và vật thể có base rõ. C11 floor/rail alignment còn mở: support band nominal chưa phải trace rail theo sprite đã chứng nhận.

`map.bridge` là hình học cầu, độc lập POI BRIDGE. POI BRIDGE/work points cần ở bờ để vẫn giao vật tư/khảo sát khi bridge giữa sông bị chặn. Tuyến vòng có cầu phụ cố định trong cảnh; `map.detour` mô tả chỗ vượt phụ, đường thực nằm trong paths. Ba loại sprite cầu: đá, thép, gỗ; frame nguyên/hỏng/sửa theo snapshot.

`navigation.ts::findWalkingRoute` dùng BFS lưới20, thử lại10 khi không tìm được tuyến coarse; kiểm đoạn nối/route bằng cùng `isMovementSegmentClear` như solver/server. Client/server/navigation dùng CollisionState chung gồm bridgeBlocked/fixedDeployed/mobileBDeployed/mobileCDeployed. Lều chưa triển khai không có collider; sau triển khai rear/side walls có collider, cửa mở; recovery do server. `MainScene` vẽ route/đích từ `getMissionGuide`, cập nhật khoảng một giây; chỉ định vị, không tự chạy nhân vật. HudView minimap thu cùng cảnh 256 × 144 rồi ghép người chơi/đích/cầu/trạm theo snapshot; M đổi toàn cảnh/follow.

## Camera và điểm tương tác hiện tại

- `MainScene.resizeCamera`: phone theo width<=700, landscape theo height<550. Follow zoom1, mở bounds chừa HUD/controls: phone top195/bottom116; landscape top78/bottom100/right200 khi không phải phone. Overview căn giữa cảnh, fit phone/landscape; desktop dùng fill. Framing này không đổi world coordinates/collision.
- Sửa 05/10/2026: follow offset `(-right/2, (top-bottom)/2)` đặt chân giữa phần màn hình còn lại; không làm tròn scroll, smoothing theo delta với hằng số84ms. Actor/NPC dùng baseline46 trong frame48px; nhãn người chơi và shadow/ring có lớp riêng, thân/crate vẫn sort theo world foot-y. Fade foreground theo giao thân/polygon, chuyển alpha90ms; không đổi crop/polygon sinh từ pipeline.
- M hoặc Map/minimap đổi overview/follow; đi bộ/sprint không tự đóng overview. `setWaypoint` chuyển follow. Menu khóa input cá nhân; drawer lựa chọn không khóa movement.
- Vòng tương tác theo `resolveInteraction`, gồm POI và từng kiện DROPPED có ID. Range72 kiểm predicted và authoritative. Sửa POI cần kiểm prompt/HUD/drawer/server cùng lúc.

## Nguồn sinh và đầu ra

| Nguồn chỉnh | Script | Đầu ra được ghi đè |
| --- | --- | --- |
| `scripts/collision-layout.json` + DATA/điều chỉnh cuối prepare-regions | `scripts/prepare-regions.py --geometry-only` | `shared/src/collisionLayout.ts`, `shared/src/regionalMapData.ts`; không ghi ảnh/layers |
| `docs/art-source/regions/<mapId>/clean-scene.png`, `DATA`/điều chỉnh cuối script | `scripts/prepare-regions.py` | `shared/src/regionalMapData.ts`, `client/src/game/regionalLayers.ts`, scene/minimap/icon/foreground WebP và layers.json mỗi vùng |
| `docs/art-source/hanoi-v3/clean-scene.png`, `bridge-states.png`; mảng layers trong script | `scripts/prepare-hanoi-v3.py` | `client/src/game/hanoiSceneLayers.ts`, asset v3 WebP/layers.json/bridge.png |
| `docs/art-source/regions/shared/bridges-source.png`, `boats-source.png`, waterfall-sevarihk.png | `scripts/prepare-region-sprites.py` | Ba bridge PNG, boats.png, waterfall.png ở regions/shared |
| PNG/prompt v2 và `docs/hanoi-v2-generation.json` | `scripts/prepare-hanoi-v2.py` | Sprite v2/manifest/contact sheet; **còn sửa BUILDINGS bounds trong mapData.ts** |

Geometry Hà Nội (mapData.ts) không do prepare-hanoi-v3 sinh: phải sửa riêng khi thay đường bờ/công trình. `hanoiLayout.ts` là dữ liệu trang trí phiên bản trước, không là nguồn layout runtime v3.

## Thay cảnh/layout đúng thứ tự

1. Giữ concept và bản sạch gốc trong archive; chỉnh ảnh sạch bằng công cụ ảnh phù hợp, giữ 1672 × 941. Build thường không tạo ảnh mới và không cần Internet.
2. Trace lại spawn, paths, colliders, 15 POI, bridge/detour, polygon mái/tán cây với foot depth, nhãn và vị trí thuyền/nước. Với vùng mới sửa DATA **và các update/extend cuối script**; với Hà Nội sửa mapData.ts cùng mảng layers trong script v3.
3. Kiểm archive đầu vào có đủ trước chạy: script vùng bỏ qua slug thiếu clean-scene, không tự báo thiếu toàn bộ. Không chỉnh trực tiếp TS được sinh vì sẽ mất lần tái sinh sau.
4. Có Python 3 + Pillow hỗ trợ WebP; từ root:

   ```bash
   python scripts/prepare-hanoi-v3.py
   python scripts/prepare-region-sprites.py
   python scripts/prepare-regions.py
   npm run build
   npm test
   ```

   Chỉ chạy script cho phần đã đổi; thứ tự trên dùng khi làm cả cảnh và atlas. Không chạy prepare-hanoi-v2 nếu không thay sprite v2; nếu cần, đọc tác dụng phụ, chạy trước và kiểm diff mapData.ts. Script contact sheet chạy sau có screenshot mới, không thay asset game.
5. Kiểm route qua server, điểm tương tác còn đến được khi cầu hỏng, các phần che đúng chân và state công trình; chụp desktop/follow/mobile. Chi tiết tại [TESTING](TESTING.md).

Các chỉnh vị trí gần nhất: Thanh Hóa mobile B `(1180,550)` tránh tán cây, C2 `(875,855)` xuống lối đi; Hà Tĩnh bridge a `(775,595)` → b `(1260,815)` khớp khoảng suối sạch. Những con số này là tọa độ cảnh mô phỏng, không dữ liệu địa lý.

Script v3 có fallback đường ảnh imagegen tuyệt đối trên máy tác giả khi archive thiếu; archive hiện đã có nên không cần đường đó. Xem [ART_SOURCES](ART_SOURCES.md) trước đổi pipeline/atlas.
