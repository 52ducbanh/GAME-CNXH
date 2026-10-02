# QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI — GAME WEB 2D MULTIPLAYER

> **Bài tập nhóm chẵn:** “Thiết kế một trò chơi liên quan đến Nhà nước và Nhà nước XHCN, đặc điểm của Nhà nước pháp quyền XHCN Việt Nam.”  
> **Phiên bản:** MVP Hoàn chỉnh — Thành phố Hà Nội (1 đội hợp tác, 1–10 người chơi).  
> **Ngôn ngữ:** Tiếng Việt.

---

## 🌟 1. Giới thiệu Cốt lõi & Trải nghiệm Gameplay

Trò chơi mô phỏng công tác quản trị và phục vụ nhân dân của chính quyền Thủ đô Hà Nội trong khuôn khổ Nhà nước pháp quyền Xã hội Chủ nghĩa Việt Nam:
- **Di chuyển & Tương tác thực tế trên bản đồ 2D:** Nhân vật cán bộ trực tiếp di chuyển qua các phố, Hồ Gươm, Tháp Rùa, các khu dân cư A, B, C, Kho vật tư, Trụ sở chính quyền và Bảng công khai.
- **Một người (Solo) chơi trọn vẹn được từ đầu đến cuối:** Không bị kẹt bởi yêu cầu quorum, không đòi hỏi đủ 5 vai trò hay đủ phiếu online.
- **Nhiều người (Co-op) cùng phối hợp:** Phân chia nhiệm vụ khảo sát, vận chuyển vật tư song song giúp hoàn thành nhanh và nhàn hơn.
- **Tác động trực tiếp vào thế giới game:** Chọn phương án sẽ trừ ngân sách thật trên sổ sách công, vận chuyển vật tư thật, công trình mở ra đổi diện mạo thật, người dân được phục vụ được đếm ID độc nhất.
- **Nội dung học thuật gắn liền hành động:** Không biến game thành trắc nghiệm A/B/C/D hay form điền câu hỏi; dẫn nhập và tổng kết kết nối trực tiếp với lý luận Mác – Lênin và Hiến pháp Việt Nam.

---

## 🚀 2. Hướng dẫn Khởi chạy Dự án

### Yêu cầu môi trường:
- Node.js version 18+ (Đã kiểm nghiệm hoàn hảo trên Node v24).
- npm 9+.

### Bước 1: Cài đặt phụ thuộc
```bash
npm install
```

### Bước 2: Chạy môi trường Phát triển (Development)
Chạy đồng thời cả Server (Socket.IO + API) và Client (Vite + Phaser) chỉ bằng một lệnh duy nhất:
```bash
npm run dev
```
- **Máy tính (Desktop):** Mở trình duyệt truy cập `http://localhost:3000`
- **Điện thoại cùng mạng Wi-Fi/LAN:** Truy cập theo địa chỉ IP mạng nội bộ được hiển thị trên console (Ví dụ: `http://192.168.1.xxx:3000`).

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

---

## 📱 3. Hướng dẫn Cách Chơi & Điều khiển

### 3.1. Các đường dẫn (Routes) chính:
- `/`: Sảnh đón (Lobby) — Nhập tên, tạo phòng hoặc vào phòng, quét mã QR điện thoại.
- `/play/:roomCode`: Giao diện chơi game chính (Phaser 2D + HUD + Bảng tương tác).
- `/host/:roomCode`: Bảng điều khiển dành riêng cho Host (Bắt đầu, Bỏ qua, Tạm dừng, +60s, Reset). Có nút **"Tham gia chơi"** để Host chơi một mình.
- `/projector/:roomCode`: Màn hình máy chiếu lớn trong lớp học (hiển thị radar, bảng chỉ tiêu, nhật ký hoạt động thời gian thực).

### 3.2. Điều khiển nhân vật:
- **Máy tính / Laptop:**
  - `W, A, S, D` hoặc các phím mũi tên: Di chuyển nhân vật (tốc độ 180 units/giây, chuẩn hóa góc chéo).
  - Phím `E`: Mở bảng hành động tương tác khi đứng gần mục tiêu (khoảng cách $\le 72$ units).
  - Chuột: Bấm các nút chức năng trên giao diện HUD.
- **Điện thoại di động / Màn hình cảm ứng:**
  - Cần điều khiển ảo (Virtual Joystick) góc dưới bên trái để di chuyển mượt mà 360 độ.
  - Nút tròn lớn **TƯƠNG TÁC [E]** góc dưới bên phải để thao tác.

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
- [x] **Unit & Integration Tests:** Đã kiểm thử tự động 9 kịch bản trọng yếu (toàn bộ 4 tổ hợp phương án đạt 100 điểm, bảo toàn ngân sách không âm, chống double spend khi nhặt kiện cùng lúc, chống gian lận khoảng cách).
- [x] **Chơi Solo độc lập:** Một người chơi từ đầu đến cuối hoàn thành cả 3 nhiệm vụ, không bị khóa quyền bởi vai trò.
- [x] **Chơi Hợp tác Co-op:** Nhiều người cùng phòng chia việc song song, đồng bộ thời gian thực qua Socket.IO.
- [x] **Cơ chế Reconnect an toàn:** Rớt mạng trong 10 giây giữ nguyên vị trí và kiện mang; quá 10 giây tự động đặt kiện an toàn xuống đất, không sinh bản sao vật tư.
- [x] **Tự động tạm dừng:** Khi 0 người chơi online phòng tự pause đồng hồ; khi có người vào lại host có thể resume.
- [x] **Mạng nội bộ LAN:** Mã QR và liên kết tạo trực tiếp từ địa chỉ IP LAN thực tế của máy chủ, không hiển thị URL `localhost` gây lỗi khi quét bằng điện thoại.
- [x] **Giới hạn phiên bản MVP:** Dữ liệu phòng lưu trữ trong bộ nhớ server (In-Memory). Khởi động lại server sẽ làm mới các phòng chơi; không yêu cầu database ngoài.

---

## 📚 6. Tài liệu Đi kèm trong Thư mục `docs/`
- [MVP_SPEC.md](file:///c:/Users/52duc/Desktop/Game%20CNXH/docs/MVP_SPEC.md): Bảng thông số chi tiết, bảng tính khả thi tài nguyên 4 tổ hợp.
- [KNOWLEDGE_MAP.md](file:///c:/Users/52duc/Desktop/Game%20CNXH/docs/KNOWLEDGE_MAP.md): Ma trận đối chiếu lý luận Mác - Lênin & Hiến pháp với các hành động game.
- [ASSET_CREDITS.md](file:///c:/Users/52duc/Desktop/Game%20CNXH/docs/ASSET_CREDITS.md): Nguồn gốc, giấy phép bản quyền và giải pháp đồ họa Tháp Rùa 2D.
