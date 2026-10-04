# Tìm nguồn có sẵn cho cảnh Hà Nội

Kiểm tra ngày 03/10/2026. Phạm vi lần này: tìm, xem preview công khai, đọc mô tả và điều khoản; chưa mua asset và chưa đổi renderer/source game. Giá USD là giá hiển thị tại thời điểm kiểm tra, một số đang giảm giá.

## Kết luận

Có bộ đồ họa và map mẫu giúp giảm công vẽ nền/đặt cảnh. Chưa tìm thấy template 2D Hà Nội hoàn chỉnh có Hồ Gươm, Tháp Rùa, phố mái ngói, kè/vườn và phong cách sát ảnh concept. Không suy diễn rằng không tồn tại ở mọi nơi trên Internet. Không coi ảnh preview là asset đã được cấp quyền tải/dùng.

Nhận xét về mức phù hợp dưới đây là đánh giá từ preview và ảnh concept, không phải cam kết chất lượng sau tích hợp. Bản tải đầy đủ của các pack trả phí chưa được kiểm tra nên chưa xác nhận tất cả alpha, frame, seams, asset xuất bản và map đều chạy đúng trong Phaser.

## Nguồn đáng xem

| Nguồn chính thức | Giá hiện thấy | Có gì / định dạng | Đánh giá cho project |
| --- | --- | --- | --- |
| [Winlu Fantasy Tileset – Exterior](https://winlu.itch.io/winlu-fantasy-tileset-exterior) | $12.50, giá gốc $25 | Tile 48×48; nhiều terrain/mái/tường; nước, cây, cờ và cửa có animation. Có bản “Other Engines” và demo map RPG Maker 44 KB. Cho phép sửa và dùng thương mại; cấm bán/phân phối lại asset. | Ứng viên mạnh cho cảnh quan chi tiết và chuyển động. Đã xem preview ngoài trời/ao/cây trực tiếp. Kiến trúc chủ yếu trung cổ châu Âu; nước và palette vẫn khác concept. Map demo không được mô tả là có kèm đầy đủ PNG miễn phí. |
| [GuttyKreum – Temples and Shrines vol.2](https://guttykreum.itch.io/templesandshrines) | $9.99 | 1177 tile PNG 32×32, mái đỏ/xanh, nhà module, tường đá, cây/bụi; hai bản có/không bóng, cửa và kênh thoát nước có animation. PNG dùng cho engine tùy chọn. | Đã xem ảnh nhà/đền và phố trực tiếp. Có kiến trúc Á Đông để tham khảo/tận dụng; mang dấu ấn Nhật, chưa phải nhà phố Hà Nội. Nhân vật trong preview không nằm trong pack. License cho phép derivative và dùng trong game thương mại; không phân phối asset riêng. |
| [Chinese Jiangnan Water Town](https://comshadow.itch.io/chinese-ancient-jiangnan-water-town-topdown-pixel-art-tileset) | $3.99 | Cầu đá cong, bến/thuyền, phố ven nước, đường đá; hỗ trợ RPG Maker MV/MZ và autotile tường. Tác giả khai báo AI Assisted. Dùng trong game cá nhân/thương mại, không bán/phân phối riêng. | Đã xem trang/sheet preview. Hữu ích cho thành phần phố ven nước, nhưng mái xám và phong cách Giang Nam khác tường vàng/mái đỏ trong concept. Chưa xác nhận có map dựng sẵn hoặc animation nước; không chọn ngay làm toàn bộ nền. |
| [LimeZu – Serene Village revamped](https://limezu.itch.io/serenevillagerevamped) | Miễn phí | 24 kiểu nhà, terrain/cây/đá, đồ vật có animation, tile cơ sở 16×16. Trang tác giả ghi CC BY 4.0. Nhân vật preview thuộc Modern Interiors. | Phương án miễn phí để dựng map đồng nhất, nhưng chưa tương đương độ chi tiết minh họa của concept. Cần ghi công và ghi nhận thay đổi theo CC BY. |
| [LimeZu – Modern Exteriors](https://limezu.itch.io/modernexteriors) | $2.50, giá gốc $5 | Đường/phố/nhà/props, xe chuyển động; 16/32/48 px; các file riêng có tên. Cho sửa/dùng thương mại; cần credit, không phân phối lại asset. | Nhiều chi tiết sinh hoạt hữu ích, nhưng kiến trúc hiện đại và nét vẽ riêng. Không mặc định ghép vào Winlu/Gutty vì khác phong cách. |

## Nguồn có mẫu đẹp nhưng không phù hợp điều khoản của project hiện tại

- [KR Spirit of Asia](https://kokororeflections.itch.io/kr-spirit-of-asia), $17.99: 32/48 px, nhà/đường/cây/cầu cong, nước động, map mẫu RPG Maker MV/MZ. Đã xem preview trực tiếp. [Điều khoản chính thức](https://kokororeflections.com/terms-use/) cấm “anything AI-related”; project hiện có asset/code AI nên không đề xuất dùng trực tiếp theo giấy phép hiện tại. File map mẫu miễn phí trên shop không kèm PNG, không phải pack hoàn chỉnh miễn phí.
- [Mana Seed Summer Forest](https://seliel-the-shaper.itch.io/summer-forest), sample miễn phí/full $19.99: nước sâu/nông, lá nổi, cây/bụi và map hướng dẫn Tiled TMX. [License](https://selieltheshaper.weebly.com/user-license.html) cấm dùng cùng imagery, writing hoặc code tạo bởi AI. Loại khỏi lựa chọn cho project này theo điều khoản hiện tại.

## Template code và cách đưa vào Phaser

[Phaser tilemap examples của Michael Hadley](https://github.com/mikewesthad/phaser-3-tilemap-blog-posts) có source minh họa map/tầng/collision; hữu ích về kỹ thuật, không cung cấp cảnh Hà Nội như concept. Giấy phép code và asset cần xét riêng nếu lấy từ repository.

[Tài liệu Phaser chính thức](https://docs.phaser.io/phaser-editor/scene-editor/game-objects/tilemap-object) mô tả map Tiled JSON và TilemapLayer. Map RPG Maker MV/MZ là một định dạng khác; cần chuyển cấu trúc/layer/autotile hoặc ráp lại trong Tiled, không nạp nguyên project RPG Maker vào game Phaser hiện có.

Đề xuất: thử một bộ nền có license phù hợp ở quy mô nhỏ — đoạn hồ/kè/đường/cây và một cụm nhà, cùng camera và nhân vật của game. Ưu tiên kiểm tra Winlu cho cảnh quan; Gutty là ứng viên kiến trúc Á Đông cần đánh giá riêng. Chọn một phong cách chính sau đối chiếu; không ghép ngay tất cả pack. Khi chọn xong, dùng tile/map sẵn thay phần nền hình học, dựng lại bố cục Hồ Gươm và làm riêng các điểm đặc trưng VN, đồng bộ collision/nav/minimap, rồi kiểm tra trạng thái cầu/trạm và responsive.

Các phần chưa có nguồn phù hợp trong lần tìm này: Tháp Rùa đúng dáng concept, trụ sở/lều/kho đồng bộ với bộ nền được chọn, cờ/biển tiếng Việt và bố cục Hồ Gươm toàn cảnh. Đây là phần vẫn phải thiết kế/chỉnh sửa riêng. Chưa có cơ sở hứa một tỷ lệ giống ảnh hoặc chi phí/tiến độ tích hợp cụ thể.
