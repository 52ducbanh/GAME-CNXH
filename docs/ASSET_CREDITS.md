# DANH MỤC NGUỒN VÀ BẢN QUYỀN ĐỒ HỌA (ASSET CREDITS & LICENSES)

Dự án game: **QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI** (MVP)  
Ngày rà soát: 02/10/2026.

---

## 1. Phong cách Đồ họa & Nguyên tắc Thiết kế
- **Phong cách:** Top-down 2D Pixel / Vector sắc nét, màu sắc tươi sáng, giao diện tối ưu cho màn hình lớp học và điện thoại di động (không bị nhòe pixel, tỷ lệ nguyên).
- **Mặt trước công trình:** Tất cả công trình chính (Trụ sở, Kho, Trạm y tế, Nhà dân, Tháp Rùa) đều có mặt tiền nhận diện rõ ràng, cửa vòm, biển hiệu tiếng Việt, không gây hiểu nhầm vùng tương tác.
- **Không chặn đường:** Đồng đội di chuyển xuyên qua nhau (non-blocking) để tránh tắc nghẽn trong các khu vực hẹp.

---

## 2. Danh mục Asset Đồ họa và Tình trạng Bản quyền

| Tên tệp | Vị trí lưu trữ | Vai trò trong Game | Nguồn & Bản quyền | Ghi chú kỹ thuật |
| :--- | :--- | :--- | :--- | :--- |
| `thap_rua.svg` | `client/public/assets/` | Địa danh nhận diện Hồ Gươm - Tháp Rùa | Tự thiết kế vector 2D chuyên biệt cho bản MVP | Mô phỏng kiến trúc 3 tầng, cửa vòm, mái ngói đỏ và đảo cỏ. Đạt độ sắc nét ở mọi độ phân giải. |
| `headquarters.svg` | `client/public/assets/` | Trụ sở chính quyền thành phố | Tự thiết kế vector 2D | Kiến trúc màu vàng đặc trưng, hàng cột trắng, quốc kỳ cờ đỏ sao vàng trên đỉnh. |
| `warehouse.svg` | `client/public/assets/` | Kho vật tư thành phố | Tự thiết kế vector 2D | Nhà kho công nghiệp gạch kiên cố, cửa cuốn, biển hiệu "KHO VẬT TƯ". |
| `clinic_fixed.svg` | `client/public/assets/` | Trạm y tế cố định (M1 FIXED) | Tự thiết kế vector 2D | Nhà trạm y tế tường trắng, mái ngói xanh dương, biểu tượng chữ thập y tế. |
| `clinic_mobile.svg` | `client/public/assets/` | Tổ y tế lưu động (M1 MOBILE) | Tự thiết kế vector 2D | Lều bạt y tế dã chiến, cờ hiệu chữ thập, bàn khám và hộp thuốc. |
| `bridge_intact.svg` | `client/public/assets/` | Cầu đường bộ hư cấu (Lành lặn) | Tự thiết kế vector 2D | Cầu bê tông lát đá bắc qua kênh sang Khu B, có đèn và vạch kẻ đường. |
| `bridge_broken.svg` | `client/public/assets/` | Cầu đường bộ hư cấu (Bị sự cố) | Tự thiết kế vector 2D | Cầu nứt vỡ sụt lún, có rào chắn sọc vàng đen và biển cấm nguy hiểm. |
| `notice_board.svg` | `client/public/assets/` | Bảng công khai kết quả & ngân sách | Tự thiết kế vector 2D | Bảng gỗ mái ngói, niêm yết các bản báo cáo tài chính và tiến độ. |
| `house_a.svg` | `client/public/assets/` | Dãy nhà Khu dân cư A (Tây Bắc) | Tự thiết kế vector 2D | Nhà phố mái ngói đỏ, huy hiệu nhận diện "A". |
| `house_b.svg` | `client/public/assets/` | Dãy nhà Khu dân cư B (Đông) | Tự thiết kế vector 2D | Dãy nhà màu xanh lá, huy hiệu nhận diện "B". |
| `house_c.svg` | `client/public/assets/` | Dãy nhà Khu dân cư C (Nam) | Tự thiết kế vector 2D | Dãy nhà màu vàng cam, huy hiệu nhận diện "C". |
| `crate.svg` | `client/public/assets/` | Kiện vật tư công | Tự thiết kế vector 2D | Thùng gỗ nẹp sắt góc và đinh tán, biểu tượng tài sản công. |
| `player_base.svg` | `client/public/assets/` | Nhân vật người chơi | Tự thiết kế vector 2D | Cán bộ công chức với trang phục chỉnh tề, đổi màu theo ID người chơi. |
| `npc_elder.svg` | `client/public/assets/` | Nhân vật Cụ C1, C2 | Tự thiết kế vector 2D | Người cao tuổi tóc bạc, gậy chống, biểu tượng trái tim cần quan tâm. |
| `npc_rep.svg` | `client/public/assets/` | Đại diện cộng đồng dân cư | Tự thiết kế vector 2D | Cán bộ cơ sở mang cặp hồ sơ khảo sát và mũ tai bèo. |

---

## 3. Tham khảo Cảm hứng & Giấy phép Tài nguyên Thứ ba

- **Kenney Tiny Town (CC0 1.0 Universal):**  
  - *Tham khảo tại:* https://kenney.nl/assets/tiny-town  
  - Bộ asset miễn phí CC0 được tham khảo về bảng màu gạch, ngói và tỷ lệ phân bố khối công trình top-down 2D.
- **Mô hình tham khảo Tháp Rùa 3D (Sketchfab):**  
  - *Link tham khảo:* https://sketchfab.com/3d-models/thap-rua-e1b8f3371a0a4f3c99e72e91a795db1a  
  - Nhóm phát triển **không** đưa trực tiếp mesh 3D hàng triệu polygon vào game 2D nhằm bảo đảm hiệu năng chạy mượt trên mọi thiết bị và điện thoại di động. Thay vào đó, toàn bộ đặc điểm kiến trúc tiêu biểu (3 tầng thu nhỏ, vòm cửa cuốn, mái cong cổ kính) đã được chuyển thể thành bản vẽ 2D SVG tối ưu, trong suốt và tải tức thời.
