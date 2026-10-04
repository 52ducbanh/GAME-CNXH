# ĐẶC TẢ MVP — “QUÊ MÌNH ĐỨNG ĐẦU!”

Đặc tả gốc 02/10/2026, đối chiếu/cập nhật source ngày 03/10/2026. Ngôn ngữ: Tiếng Việt. Trạng thái kiểm tra và bug ở [PROJECT_STATUS](PROJECT_STATUS.md), không xem ý đồ sản phẩm dưới đây là chứng nhận mọi nhánh server đã được kiểm thử.

---

## 1. Mục đích & Giới hạn phạm vi
- **Chủ đề bài tập (Nhóm chẵn):** “Thiết kế một trò chơi liên quan đến Nhà nước và Nhà nước XHCN, đặc điểm của Nhà nước pháp quyền XHCN Việt Nam.”
- **Phạm vi hiện tại:** Bảy lựa chọn Hà Nội, Hải Phòng, Quảng Ninh, Ninh Bình, Thanh Hóa, Nghệ An, Hà Tĩnh. Mỗi phòng dùng một bản đồ cố định và một đội co-op. Mục tiêu sử dụng 1–10 người/phòng; source chưa có hard cap 10 hoặc kiểm thử tải 10 người. Chưa có giải đấu bảy đội, scoreboard tổng hay xếp hạng cạnh tranh liên đội.
- **Tiêu chí cốt lõi:**
  - **Một người (solo)** phải làm trọn cả ba nhiệm vụ, không phụ thuộc quân số/vai trò; mục tiêu hoàn thành trong 600 giây. Các happy path rules/routes đã được kiểm tra, nhưng chưa có phép đo đủ sáu vùng bằng input người thật ở tốc độ 180/giây.
  - **Nhiều người (co-op)** chia việc, phối hợp làm song song sẽ nhanh và thuận tiện hơn.
  - Không bắt buộc quorum hay đủ chữ ký hay vai trò để mở khóa; vai trò là gợi ý phân công công việc.
  - Mọi hành động di chuyển, gặp NPC, vận chuyển vật tư, triển khai và kiểm tra diễn ra trực quan trên bản đồ 2D.
  - Runtime không gọi API AI/LLM; nội dung/sự kiện được định sẵn. Asset được tạo/chỉnh trước bằng imagegen và lưu trong repository, không phát sinh gọi AI khi chơi.

---

## 2. Thông số cân bằng hạt giống (Seed Parameters)

| Thông số | Giá trị triển khai | Ý nghĩa mô phỏng |
| :--- | :---: | :--- |
| **Kích thước bản đồ** | 1672 × 941 world units | Cùng tọa độ pixel native của bảy cảnh; geometry/camera/minimap khớp |
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
- **Lấy / Giao / Hoàn trả 1 kiện vật tư:** Thao tác trực tiếp có ACK trong source hiện tại; hằng số PICK_CRATE/DELIVER_CRATE 1 giây vẫn có nhưng không được dùng làm job countdown.
- **Lập kế hoạch / Xác nhận hồ sơ tại Trụ sở:** Thao tác có ACK; M1/M2 có phiên vote, M3 xác nhận trực tiếp. Khảo sát cầu M2, nhận phản ánh và đối chiếu danh sách M3 cũng là helper tức thời, khác khảo sát khu dân cư 4 giây.
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

## 5. Phase, nhiệm vụ và điều kiện hoàn thành

Phase: **LOBBY → BRIEFING (60s) → PRACTICE (60s) → RUNNING (600s) → RESULTS**. Host START; briefing/practice hết giờ hoặc skip chuyển tiếp. Vật tư/job tập dượt được reset khi vào RUNNING. Hoàn tất M3 kết thúc sớm; hết đồng hồ hoặc host END cũng ra tổng kết với kết quả đã đạt.

| Nhiệm vụ | Trình tự sản phẩm | Điểm |
| --- | --- | --- |
| M1 mở dịch vụ y tế | Khảo sát A/B/C → về Trụ sở đề xuất/vote FIXED hoặc MOBILE → lấy/giao kiện đúng điểm → triển khai → nghiệm thu → Bảng công khai. FIXED một trạm/2 kiện, MOBILE hai điểm B/C, mỗi điểm 2 kiện. | Khảo sát 3×2=6; triển khai 10 (mobile 5 mỗi điểm); nghiệm thu 8 (mobile 4 mỗi điểm); công khai 6 = **30**. |
| M2 ứng phó cầu hỏng | M1 công khai làm cầu hỏng và mở M2. Khảo sát ở bờ → vote REPAIR/DETOUR. REPAIR giao 2 kiện sửa và hoàn thành hai job rồi mở cầu; DETOUR giữ cầu hỏng, dùng cầu phụ/tuyến vòng. Cả hai giao 2 kiện cứu trợ B → nghiệm thu B → công khai. | Khảo sát 5; cam kết 5; cứu trợ 2×8=16; nghiệm thu 4; công khai 5 = **35**. Sửa cầu không có điểm riêng. |
| M3 khắc phục thiếu tiếp cận | Nhận phản ánh Khu C → đối chiếu tại trạm/điểm y tế đã chọn → Trụ sở xác nhận chi 20 → mỗi C1/C2 giao 1 kiện và job chăm sóc → đối chiếu kho → công khai cuối. Không vote M3. | Phản ánh 5; đối chiếu danh sách 5; hỗ trợ 2×7=14; kiểm kho 5; công khai 6 = **35**. |

M1 publish cần công trình triển khai + nghiệm thu đủ theo phương án; M2 publish hiện kiểm giao đủ cứu trợ/verifiedB; M3 publish cần chăm sóc C1/C2 + kiểm kho. **Ý đồ REPAIR phải sửa cầu trước hoàn tất** được giữ; thiếu guard ở M2 publish nếu có là bug cần negative test, xem PROJECT_STATUS, không biến thành yêu cầu cho phép bỏ sửa.

Nguồn lực chung: ngân sách trừ lúc vote cam kết hoặc xác nhận M3, kèm ledger. Mỗi người mang tối đa một kiện, lấy làm giảm tồn kho; đặt xuống vẫn là tài sản trong thế giới, hoàn trả gần kho phục hồi tồn. Citizen tính theo ID duy nhất, không cộng trùng. Dân phục vụ M1: FIXED 22 (A12/B10/C0), MOBILE 24 (A10/B8/C6, chưa gồm C1/C2); M3 thêm hai Cụ → 24 hoặc 26/30. Đạt 100 điểm **không đồng nghĩa 30/30 dân đều đã phục vụ**.

Manpower 3 là pool chung cho triển khai trạm, sửa cầu, chăm sóc Cụ; job khảo sát/audit không giữ manpower. Một player một job tại một thời điểm; cancel hoặc di chuyển đáng kể trả manpower. Chi tiết validation nằm trong GameEngine, không dùng vai trò để khóa việc.

## 6. Solo/co-op, host và lưu phiên

- Năm role SURVEY/PLANNER/LOGISTICS/AUDIT/RIGHTS là gợi ý phân công. Solo đề xuất tự thông qua vote; nhiều người vote tối đa 15 giây, đóng sớm nếu mọi người online đã vote. Hòa phiếu ưu tiên lựa chọn người đề xuất. Không yêu cầu số chữ ký tối thiểu.
- Host có START, SKIP_BRIEFING, SKIP_PRACTICE, PAUSE, RESUME, ADD_60S, END, RESET. Host/projector xem dưới dạng spectator không giữ player/job; host muốn chơi dùng link tham gia. Cơ chế cấp host hiện đơn giản cho lớp học, xem ARCHITECTURE/PROJECT_STATUS trước triển khai công khai.
- Pause dừng tick timer/job; một số validation/nhánh có giới hạn cần negative test, không mặc định mọi intent bị khóa tuyệt đối. Không có player online trong RUNNING sẽ auto-pause; quay lại cần host resume.
- Reconnect token đúng phòng giữ playerId; grace 10s, quá grace giải phóng job/đặt kiện ở vị trí player. Reset giữ map và player, về spawn, xóa điểm/resources/job/vote để chơi lại.
- Phòng/session lưu RAM, restart mất trận. Không có database, tournament controller, cross-room leaderboard, tài khoản đăng nhập hoặc saved campaign. Hình học là đường trace trên cảnh cố định, không editor tilemap.

Nguồn rules: `shared/src/constants.ts`, `types.ts`, `server/src/gameEngine.ts`; network thực tại `server/src/server.ts`. Map tại [MAPS](MAPS.md), kiểm tra và giới hạn chứng cứ tại [TESTING](TESTING.md).
