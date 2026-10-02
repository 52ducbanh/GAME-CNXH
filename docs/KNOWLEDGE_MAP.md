# BẢN ĐỒ KIẾN THỨC LÝ LUẬN & MAPPING GAMEPLAY (KNOWLEDGE MAP)

Tài liệu phục vụ học tập học phần Chủ nghĩa Xã hội Khoa học & Nhà nước Pháp quyền XHCN Việt Nam.

---

## 1. Dẫn nhập Lý luận Mác – Lênin về Nhà nước

### 1.1. Nguồn gốc của Nhà nước
- **Lý luận khoa học:** Nhà nước không phải là hiện tượng vĩnh cửu hay siêu nhiên, mà ra đời trong những điều kiện lịch sử nhất định khi xã hội xuất hiện chế độ tư hữu và phân chia giai cấp, mâu thuẫn giai cấp phát triển đến mức không thể điều hòa được. Nhà nước là cơ quan thống trị giai cấp, nắm giữ quyền lực công đặc biệt có sức mạnh cưỡng chế, đồng thời thực hiện chức năng xã hội nhằm duy trì trật tự chung của cộng đồng.
- **Minh họa trong Game:** Game đặt bối cảnh một chính quyền địa phương (Hà Nội) quản lý tài sản công (ngân sách 100, vật tư 12) và điều tiết nguồn lực để bảo đảm lợi ích chung của 30 người dân.

### 1.2. Bản chất của Nhà nước Xã hội Chủ nghĩa
- **Lý luận khoa học:** Nhà nước XHCN là kiểu nhà nước mới trong lịch sử, mang bản chất của giai cấp công nhân, gắn liền với quyền làm chủ của nhân dân lao động. Bản chất ấy thể hiện toàn diện trên:
  - *Chính trị:* Mở rộng nền dân chủ XHCN cho đại đa số quần chúng nhân dân lao động.
  - *Kinh tế:* Thiết lập quan hệ sản xuất tiến bộ, công hữu về tư liệu sản xuất chủ yếu, phân phối theo lao động và bảo đảm phúc lợi xã hội.
  - *Văn hóa – xã hội:* Giải phóng con người, xây dựng nền văn hóa tiên tiến, phát triển giáo dục, y tế và bảo đảm an sinh xã hội.
- **Giới hạn mô phỏng:** Trò chơi không đồng nhất toàn bộ Nhà nước với một tổ chức cứu trợ, mà chọn tình huống cung cấp dịch vụ y tế thiết yếu và khắc phục hạ tầng để làm rõ mục tiêu tối thượng là phụng sự đời sống nhân dân.

### 1.3. Bối cảnh Việt Nam: Đảng lãnh đạo, Nhà nước quản lý, Nhân dân làm chủ
- Tất cả quyền lực nhà nước thuộc về Nhân dân mà nền tảng là liên minh giữa giai cấp công nhân với giai cấp nông dân và đội ngũ trí thức, dưới sự lãnh đạo của Đảng Cộng sản Việt Nam.
- Trong game, nguyên lý này được quán triệt xuyên suốt trong dẫn nhập, bảng chỉ tiêu phục vụ nhân dân và phần tổng kết chính sách sau trận đấu; không tạo ra "nút bấm lãnh đạo" tùy tiện để tránh tầm thường hóa vai trò lãnh đạo chính trị của Đảng.

---

## 2. Bảng Ma trận Mapping Kiến thức -> Cơ chế Gameplay -> Nhiệm vụ

| Khái niệm / Nguyên lý Lý luận | Cơ chế Gameplay tương ứng | Nhiệm vụ áp dụng | Giới hạn mô phỏng cần lưu ý |
| :--- | :--- | :---: | :--- |
| **Chức năng xã hội của Nhà nước**<br>Quản lý và tổ chức dịch vụ công thiết yếu | Phân bổ ngân sách, vận chuyển vật tư, thi công trạm y tế để phục vụ sức khỏe cộng đồng | **M1** | Nguồn lực được số hóa thành 100 ngân sách và 12 kiện vật tư để người chơi trải nghiệm bài toán cân đối nguồn lực có hạn. |
| **Nhà nước của Dân, do Dân, vì Dân**<br>Phục vụ nhân dân, bảo đảm độ phủ tiếp cận | Khảo sát nhu cầu thực tế từng khu (A, B, C); nghiệm thu số công dân được hưởng lợi | **M1, M2, M3** | Đếm unique citizen IDs (30 người); không tuyên bố 100% hoàn hảo nếu nguồn lực chỉ mới phủ được 24 hoặc 26 người. |
| **Nguyên tắc Tập trung dân chủ**<br>Dân chủ bàn thảo, tập trung thống nhất | Biểu quyết tập thể 15 giây tại Trụ sở; phương án trúng cử là cam kết chung toàn đội | **M1, M2** | Biểu quyết 15s là cơ chế tương tác nhóm lớp học, không mô phỏng đầy đủ quy trình bầu cử Quốc hội hay HĐND các cấp. |
| **Tổ chức & hoạt động theo Hiến pháp, pháp luật**<br>Thượng tôn pháp luật, hành động có căn cứ | Server kiểm tra khoảng cách, điều kiện tiên quyết, thẩm quyền (`GAME_RULE_xxx`) | **Xuyên suốt** | Sử dụng mã định danh luật mô phỏng (`GAME_RULE_001` đến `005`), tuyệt đối không tự bịa đặt số điều của các đạo luật thực tế. |
| **Quyền lực thống nhất có phân công, phối hợp**<br>Hợp tác công vụ, giám sát trách nhiệm | 5 vai trò gợi ý (Tiếp nhận, Lập án, Thực hiện, Giám sát, Bảo vệ quyền) | **Xuyên suốt** | 5 vai trò là gợi ý chia việc co-op; việc 1 người chơi làm được hết là sự giản lược hóa kỹ thuật, không khẳng định 1 cá nhân được kiêm nhiệm mọi quyền ngoài đời. |
| **Công nhận, tôn trọng, bảo vệ quyền con người**<br>Bảo đảm an sinh xã hội, không để ai bị bỏ lại | Nhận phản ánh từ Khu C; hỗ trợ y tế tận nhà cho hai Cụ C1, C2 có hoàn cảnh đặc biệt | **M3** | M3 không cần mở biểu quyết vì biện pháp trợ giúp người yếu thế đã có sẵn căn cứ pháp lý trong hiến định và tính cấp bách xã hội. |
| **Công khai, minh bạch & Trách nhiệm giải trình**<br>Dân biết, dân bàn, dân làm, dân kiểm tra | Niêm yết Bảng công khai sau mỗi nhiệm vụ; đối chiếu sổ sách Kho vật tư khi có tin đồn | **M1, M2, M3** | Sổ sách lưu giữ đầy đủ lịch sử giao dịch (Ledger); kết luận phản ánh dựa trên số liệu khách quan, không trừng phạt tùy tiện. |

---

## 3. Hệ thống Quy tắc Luật Mô phỏng (Game Rules)

- **`GAME_RULE_001_PUBLIC_SERVICE`:** Mọi chính sách phân bổ ngân sách công phải hướng tới việc cung ứng dịch vụ thiết yếu phục vụ đời sống nhân dân, không vì lợi nhuận.
- **`GAME_RULE_002_DEMOCRATIC_CENTRALISM`:** Mọi phương án phân bổ lớn đều được thảo luận dân chủ và quyết định theo đa số; khi đã chốt, toàn đội thống nhất tổ chức thực hiện.
- **`GAME_RULE_003_RULE_OF_LAW`:** Mọi hành vi công vụ phải tuân thủ điều kiện thực thi, kiểm tra số dư và khoảng cách; không hành động vượt thẩm quyền hoặc tiêu dùng ngoài kế hoạch.
- **`GAME_RULE_004_TRANSPARENCY`:** Toàn bộ các khoản chi tiêu và kết quả phục vụ nhân dân phải được niêm yết công khai tại Bảng thông báo sau khi hoàn thành công tác.
- **`GAME_RULE_005_HUMAN_RIGHTS`:** Khi phát hiện công dân có hoàn cảnh đặc biệt bị bỏ sót dịch vụ, chính quyền có trách nhiệm bố trí nguồn lực khắc phục kịp thời tận nơi cư trú.

---

## 4. Tài liệu Nguồn tham khảo

1. **Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam (2013 và các văn bản sửa đổi, bổ sung):**
   - *Link:* [Chính phủ điện tử](https://xaydungchinhsach.chinhphu.vn/toan-van-hien-phap-nuoc-cong-hoa-xa-hoi-chu-nghia-viet-nam-119231225213002261.htm)
   - *Lưu ý:* Cần kiểm tra văn bản hợp nhất hiện hành khi trích dẫn các điều luật cụ thể.
2. **Nghị quyết số 27-NQ/TW của Ban Chấp hành Trung ương Đảng khóa XIII:**
   - *Link:* [Nghị quyết 27-NQ/TW về Nhà nước pháp quyền](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-27-nq-tw-tiep-tuc-xay-dung-va-hoan-thien-nha-nuoc-phap-quyen-119221126114455251.htm)
   - *Nội dung cốt lõi:* Tiếp tục xây dựng và hoàn thiện Nhà nước pháp quyền XHCN Việt Nam trong giai đoạn mới.
3. **Giáo trình Chủ nghĩa xã hội khoa học (Bộ Giáo dục và Đào tạo):**
   - *Lưu ý cho sinh viên:* Trước khi nộp bài tập lớn của lớp, nhóm cần đối chiếu số trang, chương mục và thuật ngữ chính xác theo cuốn giáo trình CNXHKH được giảng viên bộ môn quy định.
