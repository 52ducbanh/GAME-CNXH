# Bàn giao đồ họa Hà Nội MVP v3 — 03/10/2026

V3 sửa trực tiếp project Phaser/TypeScript hiện có, dựa vào bố cục và chất liệu của ảnh concept người dùng. Cảnh hồ, màu nước, đảo/Tháp Rùa, phố mái ngói, cây/liễu, vườn hoa và nền đá được giữ từ một bản cảnh sạch chỉnh bằng imagegen built-in. Ba nhiệm vụ, chi phí, điểm, nội dung học tập, solo và co-op vẫn do engine hiện có quản lý.

## Cách dựng cảnh

- Cảnh native **1672 × 941**, cùng tỷ lệ ảnh gốc. UI, chữ, người, xe, thuyền, trạm và cầu trong concept đã được loại; các vùng bên dưới được phục hồi. Người chơi và nhãn tiếng Việt được render thật trong game.
- 16 vùng mái/tán cây cắt từ chính cảnh sạch, dùng polygon mask và độ sâu theo chân. Nhân vật đi phía sau được lớp tương ứng che; lớp che người chơi cục bộ giảm alpha. Phần địa hình, công trình và cây tĩnh còn lại nằm trong ảnh nền.
- Cầu là atlas alpha thật có ba trạng thái: nguyên, hỏng, sửa. Mặt cầu và lớp lan can phía trước có thứ tự vẽ riêng. Lối qua kênh ở phía Bắc là đường vòng cố định cho phương án DETOUR.
- Trạm chưa triển khai là dấu vị trí; lều, nhân viên y tế và vật tư hiện theo snapshot. Không có trạm hay người vẽ chết trong nền.
- Tái sử dụng spritesheet v2 32 × 48, bốn hướng × bốn frame, props và icon phù hợp. Gợn sáng trên nước, chim nước và NPC dạo bước có hoạt họa nhẹ.
- `shared/src/mapData.ts` chứa shoreline, kênh, các lối đi, footprint, 15 điểm tương tác và vùng cầu dùng cho server/client. Hướng dẫn đi kiểm tra liên tục từng đoạn cách tối đa 4 px; không bỏ qua đoạn nối từ người chơi tới ô đầu tiên.
- Desktop phủ cảnh toàn cửa sổ, HUD đặt trên cảnh; thẻ nhiệm vụ tóm tắt ba mục và có nút xem toàn bộ. Mở bản đồ hoặc bấm M chuyển toàn cảnh/theo người. Tỷ lệ ảnh giữ nguyên; desktop cao hơn tỷ lệ concept có cắt nhẹ hai cạnh.
- Điện thoại dọc/ngang mặc định theo người, có joystick, tương tác và bảng nhiệm vụ dạng bottom sheet. Camera chừa phạm vi ở mép thế giới dưới HUD để nhân vật không bị điều khiển che. Minimap lấy từ cùng cảnh, ghép trạng thái thật.

Điểm vào renderer: `client/src/game/hanoiMap.ts` → `hanoiScene.ts`. Preload: `hanoiAssets.ts`; polygon lớp che: `hanoiSceneLayers.ts`; camera: `MainScene.ts`; HUD: `hudView.ts` và `game.css`; hình học/hướng dẫn: `shared/src/mapData.ts`, `navigation.ts`.

## Nguồn và build

Hai lần tạo/chỉnh ảnh dùng **imagegen built-in**, không dùng CLI/API key. [Prompt và nguồn tạo](hanoi-v3-generation.json), [ghi công asset](ART_SOURCES.md). Concept gốc, cảnh sạch và atlas cầu gốc lưu tại `art-source/hanoi-v3/`; runtime WebP/PNG tại `client/public/assets/hanoi/v3/`. Script `scripts/prepare-hanoi-v3.py` tái đóng tài nguyên từ ảnh đã lưu; build thông thường không cần tạo ảnh lại.

Không mua hoặc tích hợp bộ trả phí. [Nghiên cứu nguồn có sẵn](HANOI_ASSET_RESEARCH.md) ghi các lựa chọn thành phần và lý do không có một template Hà Nội tương ứng toàn cảnh.

```powershell
npm run typecheck
npm test
npm run build
npm run start
```

## Kết quả kiểm tra

- Typecheck cả shared/server/client và build production thành công.
- **18 tests / 3 suites qua**: mọi điểm tương tác đi được, đường vòng khi cầu hỏng, collision nước/công trình, mọi đoạn đường đi qua server, cầu vẫn chặn ở M3 khi chọn DETOUR; solo và logic nhiệm vụ.
- Socket.IO thật: **FIXED + REPAIR = 100/100**, 39 lượt đi tới mục tiêu; [báo cáo](hanoi-v3-fixed-runtime-qa.json).
- Socket.IO thật: **MOBILE + DETOUR = 100/100**, 39 lượt đi tới mục tiêu; [báo cáo](hanoi-v3-mobile-runtime-qa.json).
- Hai client đồng bộ; ngắt/nối lại với cùng token giữ đúng ID và kiện đang mang, trả kho thành công. Đây là kiểm tra trên server localhost, không phải đo mạng LAN hoặc điện thoại vật lý.
- Browser đã kiểm tra **1280 × 720**, **1440 × 900**, **390 × 844**, **844 × 390**; chuyển camera, mở/đóng bảng nhiệm vụ, joystick. Di chuyển joystick được snapshot server xác nhận: y 402.8729 → 394.2184 (8.65 world px).
- Không thấy warning/error trong console browser khi kiểm tra các trạng thái trạm/cầu.

## Ảnh thực tế trong game

Ảnh dưới chụp từ bản production, giữ giao diện và trạng thái gameplay, không ghép lại từ concept.

![M1: trạm cố định đã triển khai, 1280 × 720](screenshots/hanoi-v3-final-1280.jpg)

![M1: trạm cố định đã triển khai, 1440 × 900](screenshots/hanoi-v3-final-1440.jpg)

![M2: hai trạm lưu động và cầu hỏng](screenshots/hanoi-v3-mobile-clinics-broken-1440.jpg)

![Điện thoại dọc](screenshots/hanoi-v3-mobile-follow.jpg)

![Bảng nhiệm vụ điện thoại](screenshots/hanoi-v3-mobile-tasks.jpg)

![Điện thoại ngang](screenshots/hanoi-v3-landscape-follow.jpg)

## Giới hạn thực tế

V3 là map minh họa cố định kết hợp đối tượng động, chưa phải một bộ tileset có thể ghép tự do. Muốn thay toàn bộ phố, bờ hồ hoặc phá từng cây sẽ cần chỉnh phần cảnh và dữ liệu hình học tương ứng. Các mask/footprint được đăng ký thủ công theo cảnh này. Đây là mức độ gần concept đánh giá bằng ảnh; chưa có phép đo khẳng định một tỷ lệ giống cụ thể.

Tài nguyên thư mục v3 khoảng **1.03 MB**, cộng các PNG v2 đang tái sử dụng. Bundle JavaScript production khoảng **1.657 MB**, gzip **388 KB**; Vite còn cảnh báo chunk Phaser lớn. Chưa benchmark FPS/GPU trên điện thoại vật lý hoặc mạng chậm. Ảnh/trạng thái v2 giữ để so sánh trong tài liệu cũ, không dùng làm bằng chứng hoàn thành v3.
