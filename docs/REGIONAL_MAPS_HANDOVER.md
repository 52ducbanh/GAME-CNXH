# Bàn giao sáu bản đồ vùng — 03/10/2026

Đã triển khai sáu vùng bên cạnh Hà Nội v3. Cảnh game bám bố cục, bảng màu, mật độ cây và kiến trúc trong concept người dùng. Địa danh và phần môi trường được chỉnh riêng từ ảnh tham chiếu; các đối tượng gameplay và giao diện hoạt động trên cảnh đó.

![Sáu vùng trong game](screenshots/regions-final-contact-sheet.jpg)

## Mở và chơi

Bản đang chạy: **http://localhost:3102/**. Điện thoại cùng Wi-Fi: **http://192.168.2.104:3102/**; IP có thể đổi khi máy đổi mạng. Server đang phục vụ bản build mới. Khi khởi động lại, dùng lệnh PowerShell trong README; phòng và tiến độ được lưu trong bộ nhớ của lần chạy server.

Chọn vùng ở sảnh, nhập tên và bấm **Chơi một mình** để tạo phòng riêng và bắt đầu dẫn nhập. **Tạo phòng cho đội** mở trang điều khiển của chủ phòng. **Khám phá vùng này** vào phòng mặc định để xem cảnh; chủ phòng dùng trang điều khiển để bắt đầu nhiệm vụ. Mã phòng và QR dùng chung cho đồng đội, vùng được cố định theo phòng.

| Vùng | Cảnh đặc trưng | Phòng mặc định |
| --- | --- | --- |
| Hà Nội | Hồ Gươm, Tháp Rùa; renderer v3 hiện có | `HANOI_01` |
| Hải Phòng | Nhà hát thành phố, phượng đỏ, cảng, tàu kéo, cầu thép | `HAIPHONG_01` |
| Quảng Ninh | Vịnh Hạ Long, đảo đá vôi, bến và tàu du lịch | `QUANGNINH_01` |
| Ninh Bình | Tràng An, núi/hang, ruộng và thuyền chèo | `NINHBINH_01` |
| Thanh Hóa | Thành Nhà Hồ, sân thành, cây đa, suối và cối nước | `THANHHOA_01` |
| Nghệ An | Làng Sen–Kim Liên, nhà mái rạ, ao sen, cau và ruộng | `NGHEAN_01` |
| Hà Tĩnh | Cụm Đồng Lộc, tháp chuông, bậc cấp, suối và thác | `HATINH_01` |

Máy tính: WASD/mũi tên di chuyển, E tương tác, M xem toàn cảnh. Điện thoại: cần ảo bên trái và nút tương tác bên phải. Bảng nhiệm vụ có nút định vị điểm tiếp theo.

## Phần đã làm

- Sáu cảnh sạch 1672 × 941, nén WebP; chỉ nạp cảnh của vùng đang chơi. Mỗi vùng khoảng 0,9–1,1 MB cảnh/minimap/icon/lớp che; sprite dùng chung khoảng 1,4 MB.
- Mái/tán cây cắt theo đúng cảnh, có độ sâu và giảm alpha khi che người chơi. Nhân vật, dân và bác sĩ là sprite hoạt họa, có bóng và tên.
- Nước có gợn, thuyền di chuyển nhẹ và vệt nước; cây cọ hoạt họa ở Hải Phòng/Nghệ An và lớp thác ở Hà Tĩnh.
- Cầu đá/gỗ/thép đổi giữa nguyên, hỏng và sửa. Cầu hỏng chặn tuyến chính trên server và client, mỗi vùng có lối vòng qua cầu phụ.
- Trạm cố định có nhãn đóng/mở, bác sĩ và vật tư theo trạng thái triển khai; lều lưu động B/C xuất hiện đúng phương án. Kho thay đổi số kiện theo snapshot.
- Server quản lý vùng riêng cho từng phòng; minimap, HUD, dẫn nhập, host, máy chiếu, nhiệm vụ và tổng kết dùng tên/điểm của vùng đó. Nội dung học tập, ba nhiệm vụ, chi phí và điểm được giữ nguyên.
- Sảnh chọn bảy vùng, chơi solo hoặc tạo phòng đội. QR lấy IP Wi-Fi/LAN ưu tiên hơn adapter máy ảo. Giao diện điện thoại đã xử lý chồng nút tập dượt với minimap.

Đây là cách dựng cảnh nền chi tiết kết hợp đối tượng/lớp tương tác. Công trình và phần lớn cây trang trí nằm trong ảnh môi trường; chưa phải một thư viện tile/nhà/cây để di chuyển tùy ý. Các ảnh là cảnh mô phỏng theo concept, không phải bản đồ địa lý đo đạc. Mức giống ảnh là đánh giá trực quan, chưa gán một phần trăm đo lường.

## Kiểm tra

- `npm run build`: shared, server và client build thành công. Client được build lại sau sửa giao diện điện thoại.
- `npm run typecheck`: cả ba workspace đạt trên mã cuối cùng.
- `npm test`: **54/54 bài đạt**. Bao gồm kiểm tra Hà Nội hiện có, các điểm tương tác/tuyến đi, nước và cầu hỏng, reset/co-op theo vùng, và cả bốn tổ hợp FIXED/MOBILE × REPAIR/DETOUR ở mỗi vùng.
- `scripts/verify-regions.mjs`: cả sáu vùng chạy đủ ba nhiệm vụ qua HTTP + Socket.IO thật, **100/100 điểm mỗi vùng**, tổng **228 tuyến đi được server xác nhận**, kết nối lại giữ người chơi/kiện vật tư, trạng thái đồng bộ giữa hai client. Thanh Hóa được chạy lại thành công sau khi dời điểm y tế ra khỏi tán cây và đưa Cụ C2 xuống lối đi.
- Kiểm tra trình duyệt desktop 1280 × 720: cảnh, landmark, nhân vật, nhãn, trạm, cầu sửa/hỏng và HUD. Không có console error/warning trong các lượt đã đọc.
- Kiểm tra viewport điện thoại 390 × 844: sảnh chọn vùng, tạo solo, bỏ qua dẫn nhập, nút vào trận, cần ảo di chuyển, minimap và mở/đóng bảng nhiệm vụ. Đây là kiểm tra trình duyệt ở kích thước điện thoại; chưa đo FPS trên thiết bị vật lý.

[Báo cáo sáu lượt chạy](regions-runtime-qa.json) và các `regions-<mapId>-runtime-qa.json` lưu snapshot cuối. Mã/URL phòng QA trong báo cáo là lịch sử của lần chạy; có thể không còn khi server khởi động lại. Các ảnh `screenshots/<mapId>-final.jpg` chụp ở bước 94 điểm ngay trước công khai kết quả để giữ cảnh nhìn rõ, còn [ảnh tổng kết Hà Tĩnh](screenshots/regions-results-100.jpg) thể hiện kết quả 100 điểm.

![Tập dượt trên điện thoại](screenshots/regions-mobile-practice.jpg)

## Nguồn và chỉnh sửa tiếp

Hai nguồn Internet thực sự dùng là cây cọ và nước/thác của Sevarihk, CC BY 4.0; ghi công trong [ART_SOURCES.md](ART_SOURCES.md) và trang nguồn trong game. Địa danh, cảnh sạch, cầu và thuyền được tạo/chỉnh bằng imagegen theo concept; nhân vật/lều/props tái sử dụng Hà Nội v2. Không mua bộ trả phí.

- Renderer: `client/src/game/regionalScene.ts`; HUD/sảnh: `client/src/ui/`, `client/src/game.css`, `client/src/regions.css`.
- Registry và va chạm: `shared/src/worldMaps.ts`; dữ liệu vùng: `shared/src/regionalMapData.ts`, sinh từ `scripts/prepare-regions.py`.
- Ảnh gốc/concept: `docs/art-source/regions/`; prompt: [regions-generation.json](regions-generation.json).
- Tài nguyên phục vụ: `client/public/assets/regions/`; atlas dùng chung ở `regions/shared/`.
- Muốn thay vị trí/độ sâu/path: sửa dữ liệu gốc trong `prepare-regions.py`, chạy script rồi build. Muốn thay ảnh cảnh: chỉnh `clean-scene.png` bằng công cụ ảnh trước khi chạy script. Không chỉnh thủ công file TypeScript được sinh rồi chạy script đè lên.

Chạy lại kiểm tra qua server đang mở bằng `node scripts/verify-regions.mjs`. Có thể đặt `PREVIEW_URL` nếu dùng cổng khác và `QA_MAP` để chỉ kiểm tra một vùng. Chế độ `QA_HOLD=1` dừng tại bước chụp cảnh, tiếp tục khi tạo `docs/regions-qa-continue.signal`; xóa signal sau kiểm tra.
