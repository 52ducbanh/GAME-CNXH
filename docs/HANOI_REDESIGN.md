# Bàn giao đồ họa Hà Nội MVP v2

> Tài liệu này là bản đối chiếu v2. Renderer đang chạy đã chuyển sang [v3 theo concept người dùng](HANOI_V3_HANDOVER.md); nguồn và trạng thái đồ họa hiện tại ở [ART_SOURCES.md](ART_SOURCES.md).

Đã sửa trực tiếp game Phaser/TypeScript hiện có. Cảnh là các lớp nền, sprite, người chơi và công trình cập nhật theo snapshot Socket.IO; ảnh concept không được dùng làm nền game. Giữ ba nhiệm vụ, nội dung học thuật, solo, co-op và server quản lý trạng thái.

## Thay đổi

- Bộ đồ họa thống nhất: ba kiểu nhà mái ngói, trụ sở, kho, Tháp Rùa, hai loại trạm, cây/liễu, props và ba trạng thái cầu. Người dân, tình nguyện viên, nhân viên y tế thay ninja; bốn hướng đi, mỗi hướng bốn frame. Bỏ scale nhân vật 2.2, chơi ở kích thước native 32×48.
- Bản đồ 1600×960: hồ trung tâm có đường bờ polygon làm mượt, mặt nước nhẹ, đường dạo và sân be, cỏ sage, cây theo cụm có vùng bảo vệ lối đi và POI. Neo chân, bóng tiếp xúc và depth theo chân; cây/mái có fade khi che người chơi.
- `shared/src/mapData.ts` là hình học chung cho hồ, kênh, lối đi, công trình, vùng tương tác, collision và minimap. Navigation tránh cả hình công trình và kiểm tra đoạn giữa các ô; server chặn nước bằng cùng polygon. Cầu chọn DETOUR vẫn hỏng/chặn trong M3.
- Camera desktop chuyển toàn cảnh/theo người, dành riêng diện tích HUD; camera theo người zoom 1. HUD giấy kem, minimap đồng bộ, mobile có tóm tắt nhiệm vụ và bottom sheet chi tiết; joystick/nút tương tác tách khỏi vùng chơi. Tên người chơi gần nhau được xếp hàng để giảm chồng chữ.
- Trạm chưa triển khai chỉ có vị trí nền; triển khai mới hiện lều/y tế/vật tư. Cầu nguyên/hỏng/đã sửa là các frame khác nhau theo trạng thái thật.

Điểm sửa chính: `client/src/game/{hanoiAssets,hanoiLayout,hanoiMap}.ts`, `client/src/scenes/MainScene.ts`, `client/src/ui/hudView.ts`, `client/src/game.css`, `shared/src/{mapData,navigation}.ts`, `server/src/gameEngine.ts`.

## Chạy và kiểm tra

Tại project root:

```powershell
npm install
npm run build
npm run start
```

Mở `http://localhost:3000`, tạo phòng, vào Host để bắt đầu; dùng “Tham gia chơi” để chơi solo. Phát triển: `npm run dev`. Preview phiên chỉnh sửa: `http://localhost:3100/play/ART_MUS0PNID`; phòng trong bộ nhớ sẽ mất khi server dừng. Server QA 3100 chỉ bind localhost, chưa dùng làm bằng chứng kiểm tra LAN.

```powershell
npm run typecheck
npm test
```

Build production, typecheck shared/server/client và 18 test trong ba suite đều qua. Sau thay đổi cuối về nhãn co-op, TypeScript client và Vite build cũng qua. Test mới kiểm tra mọi POI đi được từ spawn, từng đoạn route gửi qua GameEngine, bờ hồ bị chặn, đường vòng tránh cầu, cầu DETOUR vẫn chặn trong M3 và cả ba nhiệm vụ solo ở các phương án.

Hai lượt trên server Socket.IO đang chạy thật, dùng intent/job và di chuyển được server chấp nhận:

| Lượt | Kết quả cuối | Nhiều client |
| --- | --- | --- |
| FIXED + REPAIR | RESULTS, 100 điểm, 24 người được phục vụ; trạm cố định và cầu sửa hiện đúng | Client thứ hai nhận cùng vật tư; disconnect/rejoin giữ player ID và kiện đang mang |
| MOBILE + DETOUR | RESULTS, 100 điểm, 26 người được phục vụ; hai trạm lưu động và cầu vẫn hỏng | Kiểm tra tương tự; 39 lượt route qua địa điểm nhiệm vụ |

Báo cáo: `hanoi-v2-runtime-qa.json`, `hanoi-v2-mobile-runtime-qa.json`. Script `scripts/verify-hanoi-v2.mjs` tạo phòng QA riêng; mặc định dừng ở mốc chụp ảnh chờ file tiếp tục. `QA_M1`, `QA_M2`, `QA_CAPTURE`, `QA_REPORT` chọn nhánh và báo cáo.

Trình duyệt đã kiểm tra viewport 1280×720, 1440×900, dọc 390×844 và ngang 844×390; chuyển camera, mở/đóng panel nhiệm vụ, kéo joystick thật và mở tương tác cảm ứng. Host, projector và tổng kết hiển thị 100 điểm thực tế; log lỗi cuối trống. Di chuyển đến mọi POI được kiểm tra qua route/server; không mô tả việc này thành tự đi thủ công mọi POI trên trình duyệt.

## Ảnh chụp thực tế

Tất cả ở `docs/screenshots/`. Baseline là pane thực tế 889×720. Ảnh desktop đầy đủ dùng clip đúng viewport, không gắn nhãn 1440 cho ảnh pane 889.

| Tệp | Kích thước / nội dung |
| --- | --- |
| `hanoi-v2-before.jpg` | 889×720; renderer cũ trước lần sửa này |
| `hanoi-v2-final-1440-overview.jpg`, `hanoi-v2-final-1440-follow.jpg` | 1440×900; build cuối, phòng M1 mới |
| `hanoi-v2-final-1280-overview.jpg`, `hanoi-v2-final-1280-follow.jpg` | 1280×720; build cuối, phòng M1 mới |
| `hanoi-v2-mobile-clinics-broken-bridge.jpg` | 1440×900; build cuối, MOBILE triển khai và cầu hỏng trong M2 |
| `hanoi-v2-mobile-follow.jpg`, `hanoi-v2-mobile-tasks.jpg` | 390×844; build cuối, camera và bottom sheet |
| `hanoi-v2-landscape-follow.jpg` | 844×390; build cuối, camera và điều khiển ngang |
| `hanoi-v2-1280-overview.jpg`, `hanoi-v2-1440-overview.jpg` | FIXED triển khai, cầu REPAIR, M3 ở 94 điểm; trước sửa cuối về xếp tên co-op, cùng đồ họa/bản đồ |
| `hanoi-v2-host-results.jpg`, `hanoi-v2-projector-results.jpg`, `hanoi-v2-results-100.jpg` | Host/projector/tổng kết lượt hoàn thành thật |
| `hanoi-v2-style-sample.png`, `hanoi-v2-asset-check.png` | Cụm mẫu và kiểm tra asset native, không phải screenshot gameplay |

## Nguồn và tái tạo asset

15 PNG runtime chính trong `client/public/assets/hanoi/v2/` có tổng 535.304 byte (không tính icon crate phụ và JSON). Bộ này tạo bằng **imagegen built-in**, tham chiếu concept và cụm mẫu; không phải bộ Hà Nội đã tìm đủ trên mạng, không gán CC0 cho ảnh tạo. Ninja/LPC/SVG cũ được giữ cùng credits nhưng không preload trong v2.

Nguồn/ghi công: `docs/ART_SOURCES.md`, `client/public/assets/credits.html`. Prompt đầy đủ và revision: `docs/hanoi-v2-generation.json`; PNG gốc: `docs/art-source/hanoi-v2/`; kích thước/anchor: `client/public/assets/hanoi/v2/manifest.json`. `scripts/prepare-hanoi-v2.py` đóng atlas, trim alpha, chỉnh frame/baseline và resize giữ tỷ lệ. Build bình thường dùng PNG đã lưu, không cần imagegen/API key. Chỉ tái đóng asset mới cần Python + Pillow.

## Giới hạn còn lại

Cảnh đã thống nhất bộ đồ họa, nhưng mật độ phố, vườn ven hồ, hoa và chi tiết mặt đất thấp hơn concept. Ba biến thể nhà còn lặp; chủng loại người dân ít. Asset là minh họa pixel tạo bằng AI rồi chuẩn hóa, chưa tương đương tileset được họa sĩ chỉnh tay từng cụm pixel. Không gán tỷ lệ giống ảnh tùy ý.

Có depth/fade nhưng chưa đi thủ công xuyên mọi trường hợp tán cây/mái. Mobile kiểm tra bằng viewport và tương tác trình duyệt, chưa trên điện thoại vật lý; chưa benchmark FPS, mạng chậm hay reconnect qua mạng di động. Vite vẫn cảnh báo bundle Phaser lớn: JavaScript khoảng 1,658 MB trước gzip, khoảng 389 KB sau gzip. Không suy diễn FPS hay thời gian tải từ build.
