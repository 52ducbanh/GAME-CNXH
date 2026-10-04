# QUÊ MÌNH ĐỨNG ĐẦU! — GAME WEB 2D MULTIPLAYER

> **Bài tập nhóm chẵn:** “Thiết kế một trò chơi liên quan đến Nhà nước và Nhà nước XHCN, đặc điểm của Nhà nước pháp quyền XHCN Việt Nam.”  
> **Phiên bản:** MVP — 7 vùng Việt Nam (1 đội hợp tác, 1–10 người chơi).<br>
> **Ngôn ngữ:** Tiếng Việt.

Đổi tài khoản Codex: xem [hướng dẫn tiếp quản + prompt cho agent mới](docs/ACCOUNT_TRANSFER.md). Giữ cả working tree/untracked; không chỉ checkout HEAD.

Agent tiếp quản bắt đầu ở [AGENTS.md](AGENTS.md) và [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md). PROJECT_STATUS là nguồn trạng thái hiện tại; các handover đồ họa dưới đây là bằng chứng của lần triển khai trước. Bảy vùng đang có lựa chọn map/phòng riêng, chưa có giải đấu hoặc xếp hạng liên đội.

Đồ họa Hà Nội v3 theo ảnh concept: xem [bàn giao, ảnh trong game và kết quả kiểm tra](docs/HANOI_V3_HANDOVER.md), [nguồn asset và ghi công](docs/ART_SOURCES.md), [prompt tạo/chỉnh ảnh](docs/hanoi-v3-generation.json). [Bàn giao v2](docs/HANOI_REDESIGN.md) được giữ để đối chiếu.

Đã hoàn thiện toàn diện **7 tỉnh** với **21 nhiệm vụ** đặc thù (mỗi tỉnh 3 nhiệm vụ độc lập, thang điểm chuẩn 100 điểm/tỉnh):
- **Hà Nội:** Mở trạm y tế, Ứng phó sự cố cầu, Bảo vệ quyền tiếp cận công dân.
- **Hà Tĩnh:** Tuyến Vũng Áng (giám sát tải trọng cảng biển), Cứu hộ Đèo Ngang (chuyển cảnh sương mù/chập tối), Di tích Ngã ba Đồng Lộc (quản lý văn minh dâng hương).
- **Ninh Bình:** Bái Đính (quản lý hòm công đức & văn minh tín ngưỡng), Rừng Cúc Phương (tuần tra đêm, gỡ bẫy thú, chống lâm tặc), Bến đò Tam Cốc (niêm yết giá vé, trang bị áo phao, điều phối xuất bến).
- **Quảng Ninh:** Tổ dân phố (dẹp tờ rơi độc hại & tuyên truyền), Công trường Bãi Cháy (bảo vệ môi trường vịnh & quây phao chắn dầu), Kho than & Tuyến cầu (kiểm soát hai đầu cầu, bắt than lậu).
- **Hải Phòng:** Foodtour bánh đa cua (phân luồng vỉa hè & bãi đỗ xe), Lò đúc Chè Lò (xử lý khói bụi & công nghệ lọc khí), Đồ Sơn (minh bạch đền bù quy hoạch & an toàn thi công).
- **Thanh Hóa:** Cơ sở nem chua Thành Nhà Hồ (phân giải tranh chấp, kiểm định ATTP & dán tem QR), Hành lang đường sắt (tuần tra chống tháo trộm bu lông), Vali mười tỏi (kiên quyết từ chối hối lộ, đấu trí nghiệp vụ, niêm phong tang vật).
- **Nghệ An:** Phố cháo lươn (hòa giải tranh chấp hè phố, kẻ vạch 1.5m), Vây bắt lừa đảo đất đai (truy tìm ngõ chợ, chặn đường tắt ngõ cụt), Phá án Quỹ khuyến học (khám nghiệm hiện trường, suy đoán vô tội, thu hồi nguyên vẹn 10 triệu đồng).

Chọn vùng ngay tại sảnh, bấm **Chơi một mình** để bắt đầu hoặc **Tạo phòng cho đội** để điều khiển trận. Projector và Host dashboard hỗ trợ theo dõi đồng thời cả 7 tỉnh.

---

## 🌟 1. Giới thiệu Cốt lõi & Trải nghiệm Gameplay

Trò chơi mô phỏng công tác quản trị và phục vụ nhân dân trong khuôn khổ Nhà nước pháp quyền Xã hội Chủ nghĩa Việt Nam, trên bảy bản đồ vùng:
- **Di chuyển & Tương tác thực tế trên bản đồ 2D:** Nhân vật trực tiếp di chuyển qua các địa danh và khu dân cư A, B, C, Kho vật tư, Trụ sở chính quyền và Bảng công khai. Mỗi vùng có cảnh quan, vị trí tương tác, cầu và tuyến vòng riêng.
- **Một người (Solo) chơi trọn vẹn được từ đầu đến cuối:** Không bị kẹt bởi yêu cầu quorum, không đòi hỏi đủ 5 vai trò hay đủ phiếu online.
- **Nhiều người (Co-op) cùng phối hợp:** Phân chia nhiệm vụ khảo sát, vận chuyển vật tư song song giúp hoàn thành nhanh và nhàn hơn.
- **Tác động trực tiếp vào thế giới game:** Chọn phương án sẽ trừ ngân sách thật trên sổ sách công, vận chuyển vật tư thật, công trình mở ra đổi diện mạo thật, người dân được phục vụ được đếm ID độc nhất.
- **Nội dung học thuật gắn liền hành động:** Không biến game thành trắc nghiệm A/B/C/D hay form điền câu hỏi; dẫn nhập và tổng kết kết nối trực tiếp với lý luận Mác – Lênin và Hiến pháp Việt Nam.

---

## 🚀 2. Hướng dẫn Khởi chạy Dự án

### Yêu cầu môi trường:
- Node.js 18+; môi trường đã chạy trong phiên phát triển: **Node 24.12.0**, **npm 11.6.2**. `package-lock.json` được giữ trong repo, chưa có field engines khóa phiên bản.
- npm 9+; Python/Pillow chỉ cần khi tái sinh ảnh/map, không cần để chơi/build bằng npm.

### Bước 1: Cài đặt phụ thuộc
```bash
npm install
```

Nếu khôi phục đúng dependency theo lock trong checkout mới, dùng `npm ci`. Shared có entry ở `shared/dist`; trước chạy dev/test trên checkout chưa build, chạy `npm run build --workspace=shared`. Copy `.env.example` thành `.env` nếu cần cấu hình riêng; không commit `.env`.

### Bước 2: Chạy môi trường Phát triển (Development)
Chạy đồng thời cả Server (Socket.IO + API) và Client (Vite + Phaser) chỉ bằng một lệnh duy nhất:
```bash
npm run dev
```
- **Máy tính (Desktop):** Mở trình duyệt truy cập `http://localhost:3000`
- **Điện thoại cùng mạng Wi-Fi/LAN:** Truy cập theo địa chỉ IP mạng nội bộ được hiển thị trên console (Ví dụ: `http://192.168.1.xxx:3000`).

Dev dùng Vite 3000, proxy API/socket sang server 3001. `PORT=3000`, `SERVER_PORT=3001`, `HOST=0.0.0.0`, optional `PUBLIC_HOST=http://<IP-LAN>:3000` có mẫu trong [.env.example](.env.example). Nếu đổi cổng dev, phải đổi target proxy trong `client/vite.config.ts` và lệnh Vite tương ứng; chỉ đổi env chưa đổi proxy cố định. Production phục vụ frontend/API/socket chung PORT.

### Bước 3: Kiểm tra Kiểu dữ liệu & Chạy Test tự động
```bash
# Kiểm tra TypeScript toàn bộ monorepo (shared, server, client)
npm run typecheck

# Chạy toàn bộ test suites (4 tổ hợp phương án, concurrency, grace period...)
npm test
```

### Bước 4: Đóng gói & Chạy Bản Build (Production)
```bash
# Đóng gói toàn bộ client và server
npm run build

# Chạy server độc lập phục vụ trực tiếp client dist
npm run start
```
*Truy cập trực tiếp tại `http://localhost:3000` (hoặc IP mạng LAN).*

Có thể chọn cổng khác trong PowerShell, ví dụ bản bàn giao chạy ở cổng 3102:

```powershell
$env:PORT='3102'
$env:HOST='0.0.0.0'
npm run start
```

Mở `http://localhost:3102/`; địa chỉ Wi-Fi/LAN cho điện thoại được server in khi khởi động.

Với bản build đã có cũng có thể chạy `node server/dist/server.js` từ root; `npm run start` hiện chạy `tsx src/server.ts` của workspace server. Không mở process khác vào cùng cổng nếu server còn chạy. Trạng thái process hiện tại ở PROJECT_STATUS, cần kiểm lại tại máy tiếp quản.

### Cấu trúc chính

| Đường dẫn | Vai trò |
| --- | --- |
| `client/src/main.ts`, `scenes/MainScene.ts`, `ui/` | Route, Phaser, input/camera và giao diện |
| `client/public/assets/` | Ảnh runtime và trang nguồn đồ họa |
| `server/src/server.ts`, `roomManager.ts`, `gameEngine.ts` | API/socket, phòng/session, rules/tick |
| `shared/src/` | Types, thông số, học thuật, map/route/mission guide |
| `scripts/` | Pipeline ảnh/geometry và QA Socket.IO |
| `docs/` | Đặc tả, source ảnh, báo cáo và trạng thái bàn giao |

Chi tiết entry point và nơi sửa: [ARCHITECTURE](docs/ARCHITECTURE.md).

---

## 📱 3. Hướng dẫn Cách Chơi & Điều khiển

### 3.1. Các đường dẫn (Routes) chính:
- `/`: Sảnh đón (Lobby) — Nhập tên, tạo phòng hoặc vào phòng, quét mã QR điện thoại.
- `/play/:roomCode`: Giao diện chơi game chính (Phaser 2D + HUD + Bảng tương tác).
- `/host/:roomCode`: Bảng điều khiển dành riêng cho Host (Bắt đầu, Bỏ qua, Tạm dừng, +60s, Reset). Có nút **"Tham gia chơi"** để Host chơi một mình.
- `/projector/:roomCode`: Màn hình máy chiếu lớn trong lớp học (hiển thị radar, bảng chỉ tiêu, nhật ký hoạt động thời gian thực).

Solo: chọn vùng, nhập tên → **Chơi một mình** tạo phòng riêng và START. Co-op: **Tạo phòng cho đội** → host START, dùng link tham gia/QR hoặc mã phòng để mời các client khác. Host và projector chỉ xem không tính là player; host muốn trực tiếp làm nhiệm vụ dùng link **Tham gia chơi**. Phòng trống RUNNING tự pause, host resume khi người chơi trở lại. Restart server mất tiến độ.

Kiểm tra hai người bằng browser/profile/device độc lập để tránh dùng chung `token_<ROOM>` trong localStorage. Mở host/projector cùng mã để theo dõi score/ledger. Checklist và scripts QA ở [TESTING](docs/TESTING.md).

### 3.2. Điều khiển nhân vật:

- **Máy tính / Laptop:** WASD hoặc mũi tên để đi, Shift để chạy; E thực hiện hành động được HUD gợi ý. Khi cần chọn phương án, E mở bảng lựa chọn.
- **G:** hủy công việc đang làm; nếu đang cầm vật tư thì đặt xuống; còn lại gửi báo hiệu.
- **M:** mở/đóng toàn cảnh bản đồ, vẫn có thể di chuyển. **Esc:** đóng menu/bảng đang mở hoặc mở Menu/Cài đặt; Menu chỉ khóa điều khiển của bạn, phòng vẫn chạy.
- **Điện thoại / Tablet:** joystick trái (đẩy nhẹ để đi, hết biên để chạy); E lớn và G nhỏ bên phải; Map/Menu phía trên. Labels thay đổi theo context, không phải nhớ thao tác cho từng quest.
- Chờ ACK khi nút báo đang gửi. Nếu bị từ chối, đọc lý do trên HUD. Sau khi đóng menu/mất focus cần thao tác mới để di chuyển.

Chi tiết implementation, các test đã chạy và giới hạn playtest: [INPUT_INTERACTION_IMPLEMENTATION_REPORT](docs/INPUT_INTERACTION_IMPLEMENTATION_REPORT.md).

---

## 📋 4. Hành trình 3 Nhiệm vụ của Trận đấu (600 giây)

Trận đấu diễn ra liên tục qua 3 giai đoạn nhiệm vụ nối tiếp:

### Nhiệm vụ 1 (M1) — Mở dịch vụ y tế cho nhân dân (Tối đa 30 điểm)
1. Đến khảo sát nhu cầu tại 3 Khu dân cư A, B, C (+6 điểm).
2. Về Trụ sở chính quyền đề xuất và biểu quyết kế hoạch:
   - **Phương án FIXED (Trạm cố định):** Chi 40 ngân sách, 2 kiện vật tư. Phục vụ 22 dân (A12, B10, C0).
   - **Phương án MOBILE (Điểm lưu động):** Chi 30 ngân sách, 4 kiện vật tư. Phục vụ 24 dân (A10, B8, C6).
3. Ra Kho lấy vật tư, giao đến địa điểm đã chọn và thi công triển khai (+10 điểm).
4. Kiểm tra, nghiệm thu dịch vụ tại trạm (+8 điểm).
5. Đến Bảng công khai niêm yết kết quả ngân sách (+6 điểm) ➔ Kích hoạt M2!

### Nhiệm vụ 2 (M2) — Cầu hỏng, Khu B cần hỗ trợ khẩn cấp (Tối đa 35 điểm)
1. Cầu qua kênh dẫn sang Khu B bị sụt lún, đường ngắn bị chặn. Ra Cầu khảo sát sự cố (+5 điểm).
2. Về Trụ sở cam kết phương án xử lý (+5 điểm):
   - **Phương án REPAIR (Sửa cầu):** Chi 25 ngân sách, 4 kiện vật tư (2 kiện sửa cầu + 2 kiện cứu trợ). Hai công tác sửa mố Tây và dầm Đông xong thì cầu mở lại.
   - **Phương án DETOUR (Tuyến vòng):** Chi 10 ngân sách, 2 kiện cứu trợ. Đi theo tuyến đường vòng phía Bắc dài hơn; cầu vẫn giữ nguyên trạng thái hỏng.
3. Giao 2 kiện cứu trợ đến Khu dân cư B (+16 điểm).
4. Nghiệm thu bàn giao tại Khu B (+4 điểm).
5. Niêm yết Bảng công khai kết quả xử lý M2 (+5 điểm) ➔ Kích hoạt M3!

### Nhiệm vụ 3 (M3) — Bảo vệ quyền công dân & Khắc phục khoảng trống (Tối đa 35 điểm)
1. Đến Khu C tiếp nhận phản ánh về Cụ C1, C2 (người cao tuổi, khó khăn vận động bị bỏ sót) (+5 điểm).
2. Đến Trạm y tế đối chiếu danh sách phục vụ (+5 điểm).
3. Về Trụ sở xác nhận phương án chăm sóc tận nhà (Chi 20 ngân sách, 2 kiện vật tư, không cần biểu quyết vì đây là trách nhiệm bảo đảm quyền con người).
4. Mang vật tư đến tận nhà chăm sóc y tế cho Cụ C1 và Cụ C2 (+14 điểm).
5. Đến Kho vật tư đối chiếu sổ sách để làm rõ tin đồn thất thoát (Kết luận: Sổ sách minh bạch, không phát hiện hao hụt) (+5 điểm).
6. Niêm yết bản tổng hợp M3 lên Bảng công khai (+6 điểm) ➔ **Hoàn thành xuất sắc 100/100 điểm!**

---

## 🔍 5. Checklist Nghiệm thu Kỹ thuật

- [x] **Build & Typecheck:** Chạy qua không có bất kỳ lỗi TypeScript nào ở cả 3 gói `shared`, `server`, `client`.
- [x] **Unit tests trong lượt phát triển trước bàn giao:** 54 bài ở 4 suite, gồm 9 bài engine ban đầu và các bài Hà Nội/map/vùng bổ sung. Cả bốn tổ hợp được kiểm ở từng vùng; kết quả qua server thật và giới hạn kiểm thử ở [TESTING](docs/TESTING.md). Lượt viết bàn giao tài liệu không chạy lại toàn bộ test.
- [x] **Chơi Solo độc lập:** Một người chơi từ đầu đến cuối hoàn thành cả 3 nhiệm vụ, không bị khóa quyền bởi vai trò.
- [x] **Chơi Hợp tác Co-op:** Nhiều người cùng phòng chia việc song song, đồng bộ thời gian thực qua Socket.IO.
- [x] **Cơ chế Reconnect an toàn:** Rớt mạng trong 10 giây giữ nguyên vị trí và kiện mang; quá 10 giây tự động đặt kiện an toàn xuống đất, không sinh bản sao vật tư.
- [x] **Tự động tạm dừng:** Khi 0 người chơi online phòng tự pause đồng hồ; khi có người vào lại host có thể resume.
- [x] **Mạng nội bộ LAN:** Mã QR và liên kết tạo trực tiếp từ địa chỉ IP LAN thực tế của máy chủ, không hiển thị URL `localhost` gây lỗi khi quét bằng điện thoại.
- [x] **Giới hạn phiên bản MVP:** Dữ liệu phòng lưu trữ trong bộ nhớ server (In-Memory). Khởi động lại server sẽ làm mới các phòng chơi; không yêu cầu database ngoài.

---

## 📚 6. Tài liệu Đi kèm trong Thư mục `docs/`

- [PROJECT_STATUS.md](docs/PROJECT_STATUS.md): Trạng thái bàn giao chính, việc tiếp theo, working tree và bằng chứng.
- [MVP_SPEC.md](docs/MVP_SPEC.md): Phase, ba nhiệm vụ, điểm và bảng nguồn lực bốn tổ hợp.
- [KNOWLEDGE_MAP.md](docs/KNOWLEDGE_MAP.md): Kiến thức → hành động, nguồn và phần chưa đối chiếu giáo trình.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): Entry point, network/session/state và nơi sửa từng tính năng.
- [MAPS.md](docs/MAPS.md): Registry bảy vùng, collision/route và nguồn sinh geometry/layers.
- [ART_SOURCES.md](docs/ART_SOURCES.md): Asset/runtime hiện tại và pipeline mỹ thuật.
- [ASSET_CREDITS.md](docs/ASSET_CREDITS.md): Danh mục SVG lịch sử và liên kết ghi công hiện tại.
- [TESTING.md](docs/TESTING.md): Lệnh, suite/script QA, checklist và giới hạn chứng cứ.
