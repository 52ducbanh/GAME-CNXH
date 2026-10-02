# ĐẶC TẢ TRIỂN KHAI THỰC TẾ MVP — “QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI”

Đặc tả hoàn thiện ngày 02/10/2026. Ngôn ngữ giao diện & tài liệu: Tiếng Việt.

---

## 1. Mục đích & Giới hạn phạm vi
- **Chủ đề bài tập (Nhóm chẵn):** “Thiết kế một trò chơi liên quan đến Nhà nước và Nhà nước XHCN, đặc điểm của Nhà nước pháp quyền XHCN Việt Nam.”
- **Phạm vi MVP:** 1 thành phố Hà Nội duy nhất trong mỗi phòng, 1 đội hợp tác chung (co-op), hỗ trợ từ 1 đến 10 người chơi trong một phòng. Không triển khai 7 địa phương hay bảng xếp hạng cạnh tranh liên đội trong bản MVP này.
- **Tiêu chí cốt lõi:**
  - **Một người (solo)** có thể hoàn thành toàn bộ 3 nhiệm vụ từ đầu đến cuối trong thời hạn 600 giây (10 phút).
  - **Nhiều người (co-op)** chia việc, phối hợp làm song song sẽ nhanh và thuận tiện hơn.
  - Không bắt buộc quorum hay đủ chữ ký hay vai trò để mở khóa; vai trò là gợi ý phân công công việc.
  - Mọi hành động di chuyển, gặp NPC, vận chuyển vật tư, triển khai và kiểm tra diễn ra trực quan trên bản đồ 2D.
  - Không sử dụng API AI / LLM ngoài đời; nội dung và sự kiện được thiết kế định sẵn, bảo đảm tính học thuật.

---

## 2. Thông số cân bằng hạt giống (Seed Parameters)

| Thông số | Giá trị triển khai | Ý nghĩa mô phỏng |
| :--- | :---: | :--- |
| **Kích thước bản đồ** | 1280 x 960 world units | Thu nhỏ gọn để solo không mất nhiều phút đi lại |
| **Tốc độ di chuyển** | 180 world units / giây | Chuẩn hóa hướng chéo, mượt mà |
| **Bán kính tương tác** | 72 world units | Đủ rộng để chạm/nhấn [E] dễ dàng |
| **Ngân sách khởi đầu** | 100 đơn vị | Nguồn tài chính công ban đầu của thành phố |
| **Kiện vật tư ban đầu** | 12 kiện | Tài sản công (thuốc men, thiết bị, vật tư sửa cầu) |
| **Đơn vị công tác (Manpower)** | 3 đơn vị chung | Đội ngũ cán bộ triển khai thực địa (tối đa 3 việc cùng lúc) |
| **Tổng số dân cư** | 30 người | A: 12 dân; B: 10 dân; C: 8 dân (gồm C1, C2 cao tuổi) |
| **Thời gian trận đấu chính** | 600 giây (10 phút) | Đủ thời gian đọc bài học, khảo sát và hoàn thành |
| **Thời gian dẫn nhập (Briefing)** | 60 giây | Trình bày lý luận Mác - Lênin (Host có thể bỏ qua) |
| **Thời gian thực hành (Practice)** | 60 giây | Tập dượt lấy & giao 1 kiện mẫu (Host có thể bỏ qua) |
| **Thời gian biểu quyết (Vote)** | 15 giây | Thảo luận và chốt phương án tập thể theo nguyên tắc tập trung dân chủ |

---

## 3. Thời gian công việc (Job Durations)

- **Khảo sát nhu cầu / lập hồ sơ sự cố:** 4 giây.
- **Lấy / Giao / Hoàn trả 1 kiện vật tư:** 1 giây (hoặc thao tác trực tiếp có ACK).
- **Lập kế hoạch / Xác nhận hồ sơ tại Trụ sở:** Trực quan qua bảng điều khiển, không có countdown giả.
- **Thi công Trạm y tế cố định (M1 FIXED):** 8 giây (giữ 1 đơn vị công tác).
- **Triển khai Điểm y tế lưu động (M1 MOBILE):** 6 giây mỗi điểm (B và C có thể làm song song).
- **Sửa chữa cầu (M2 REPAIR):** Hai công tác độc lập (Mố Tây và Dầm Đông), mỗi công tác 8 giây.
- **Chăm sóc y tế tận nhà Cụ C1 / C2 (M3):** 5 giây mỗi người (giữ 1 đơn vị công tác).
- **Kiểm tra / Nghiệm thu kết quả:** 4 giây mỗi điểm.
- **Đối chiếu sổ sách Kho vật tư (M3):** 4 giây.

---

## 4. Bảng tính khả thi tài nguyên (Resource Feasibility Check)

Trận đấu có 4 tổ hợp phương án hợp lệ, tất cả đều nằm trong giới hạn 100 ngân sách và 12 kiện vật tư:

| Tổ hợp phương án | Chi ngân sách (M1 + M2 + M3) | Ngân sách còn lại | Dùng kiện (M1 + M2 + M3) | Kiện còn lại | Dân phục vụ cuối trận |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **FIXED + REPAIR + M3** | 40 + 25 + 20 = **85** | **15** | 2 + 4 + 2 = **8** | **4** | **24 / 30** (C1, C2 đã khắc phục) |
| **MOBILE + REPAIR + M3**| 30 + 25 + 20 = **75** | **25** | 4 + 4 + 2 = **10** | **2** | **26 / 30** (C1, C2 đã khắc phục) |
| **FIXED + DETOUR + M3** | 40 + 10 + 20 = **70** | **30** | 2 + 2 + 2 = **6** | **6** | **24 / 30** (C1, C2 đã khắc phục) |
| **MOBILE + DETOUR + M3**| 30 + 10 + 20 = **60** | **40** | 4 + 2 + 2 = **8** | **4** | **26 / 30** (C1, C2 đã khắc phục) |

- **Điểm số tối đa:** Đều đạt **100 / 100 điểm** (M1: 30 điểm, M2: 35 điểm, M3: 35 điểm).
- Không có phương án nào bị coi là "sai"; mỗi phương án thể hiện bài toán đánh đổi chính sách thực tế (giữa chi phí đầu tư hạ tầng lâu dài và tiết kiệm ngân sách khẩn cấp; giữa quy mô tập trung và độ phủ công bằng cho vùng xa).
