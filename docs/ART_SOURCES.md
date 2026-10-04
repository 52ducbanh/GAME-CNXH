# Nguồn đồ họa đang dùng — bảy vùng

Đối chiếu preload/source ngày 03/10/2026. Đây là tài liệu asset/runtime hiện tại; [ASSET_CREDITS](ASSET_CREDITS.md) giữ danh mục SVG ban đầu và liên kết tới nguồn hiện tại. Trạng thái bàn giao chính ở [PROJECT_STATUS](PROJECT_STATUS.md).

## Hà Nội — renderer v3

Cảnh đang chạy do `client/src/game/hanoiScene.ts` dựng, preload trong `hanoiAssets.ts`. V3 dùng một cảnh sạch được chỉnh từ concept người dùng làm nền môi trường, sau đó ghép các lớp che khuất và các đối tượng gameplay động.

## Tài nguyên đang dùng

- `client/public/assets/hanoi/v3/scene.webp`: bản đồ 1672 × 941, giữ bố cục, nước xanh ngọc, phố mái ngói, Tháp Rùa, vườn hoa và cây trong concept. Đã loại giao diện, chữ, nhân vật, trạm và cầu trong ảnh bằng **imagegen built-in**. Phần nền dưới các vùng đó được tái dựng.
- 16 WebP là các vùng mái/tán cây cắt chính xác từ cảnh sạch. Phaser dùng polygon mask và độ sâu tại chân công trình/cây để che nhân vật ở phía sau; giảm alpha khi che người chơi cục bộ.
- `v3/bridge.png`: atlas cầu nguyên/hỏng/sửa, ba frame 216 × 80, nền alpha thật, tạo bằng **imagegen built-in**, tham chiếu concept. Lớp lan can phía trước tách bằng mask để nhân vật đứng giữa mặt cầu và lan can.
- `v3/minimap.webp`: thu nhỏ cùng cảnh, Canvas ghép dấu người chơi, đích, cầu và trạm theo snapshot thật.
- Các PNG v2 còn hoạt động: `clinic.png`, `mobile-clinic.png`, `props.png`, `volunteer.png`, `citizen.png`, `doctor.png`; `tower.png` và `crate.png` dùng làm icon HUD. Chúng là ảnh tạo cho project bằng imagegen, không phải bộ Hà Nội tải từ một tác giả khác.
- Nhãn tiếng Việt, kiện đang mang/rơi, NPC, trạm đã/chưa triển khai, cầu hỏng/sửa, tuyến chỉ đường, gợn nước và chim nước là các đối tượng Phaser/Canvas. Trạng thái nhiệm vụ lấy từ server.

Ảnh gốc v3 giữ tại `docs/art-source/hanoi-v3/`. Hai prompt đầy đủ, mode tạo và tệp đầu ra tại `docs/hanoi-v3-generation.json`. `scripts/prepare-hanoi-v3.py` chỉ cắt vùng, đóng atlas, chuẩn hóa alpha và mã hóa WebP; không cần gọi lại imagegen để build/chạy game. Ảnh gốc v2 và prompt vẫn ở `docs/art-source/hanoi-v2/` và `docs/hanoi-v2-generation.json`.

Đây là đồ họa tạo cho project từ concept người dùng cung cấp. Không gán CC0, LPC hay giấy phép của một bộ asset khác cho ảnh này. Không mua hay tích hợp bộ trả phí trong đợt sửa này; kết quả tìm nguồn có sẵn được ghi ở `docs/HANOI_ASSET_RESEARCH.md`.

## Asset phiên bản trước, không được v3 preload

Các tệp cũ giữ để đối chiếu và bảo toàn ghi công gốc.

| Asset cũ | Nguồn | Giấy phép/ghi công |
| --- | --- | --- |
| LPC Trees | https://opengameart.org/content/lpc-trees | CC BY-SA 3.0; danh sách gốc `client/public/assets/lpc/CREDITS-trees.txt`. |
| Ninja Adventure | https://pixel-boy.itch.io/ninja-adventure-asset-pack và https://github.com/pixel-boy/NinjaAdventure | CC0, Pixel-boy và AAA. |
| townhouse-v1 / turtle-tower-v1 | imagegen built-in; prompt tại `client/public/assets/hanoi/prompts.md` | Bản tạo cho project, không dùng trong v3. |
| Công trình SVG cũ | `scripts/build-hanoi-assets.py` | Source tự dựng của project, không dùng trong cảnh v3. |

V3 cũng không preload nhà/cây/cầu cũ của v2; các công trình và cây tĩnh hiện nằm trong cảnh sạch và các lớp che khuất tương ứng. Nội dung học tập, chi phí, điểm và ba nhiệm vụ được giữ nguyên.

## Sáu vùng bổ sung — 03/10/2026

Hải Phòng, Quảng Ninh, Ninh Bình, Thanh Hóa, Nghệ An và Hà Tĩnh dùng renderer `client/src/game/regionalScene.ts`. Mỗi vùng có một cảnh sạch 1672 × 941 chỉnh bằng **imagegen built-in từ concept tương ứng do người dùng cung cấp**, giữ bố cục địa danh, màu nước, cây và kiến trúc. UI, người trong ảnh, vật tư và cầu nhiệm vụ được gỡ khỏi nền để game ghép đối tượng thật. Nhà trạm y tế cố định vẫn là vỏ công trình, có nhãn chờ mở cửa; bác sĩ/vật tư xuất hiện sau triển khai.

- `client/public/assets/regions/<mapId>/`: `scene.webp`, `minimap.webp`, `icon.webp`, các lớp mái/tán cây và `layers.json` theo cảnh. Khoảng 0,9–1,1 MB cho một vùng, chỉ preload vùng của phòng đang chơi.
- `regions/shared/bridge-stone.png`, `bridge-steel.png`, `bridge-wood.png`: atlas cầu ba trạng thái nguyên/hỏng/sửa, tạo bằng imagegen cho project. Lan can phía trước có lớp che nhân vật.
- `regions/shared/boats.png`: atlas thuyền du lịch, tàu kéo và thuyền chèo, tạo bằng imagegen. Phaser cho chuyển động nhẹ và vệt nước.
- Nhân vật đi bốn hướng, dân, bác sĩ, lều y tế và props dùng lại PNG Hà Nội v2. Các nhãn tiếng Việt, vật tư, route và trạng thái cầu/trạm lấy từ gameplay thật.

### Hai tài nguyên Internet đã tích hợp

| Tài nguyên | Tác giả / nguồn | Giấy phép | Tệp và thay đổi |
| --- | --- | --- | --- |
| Animated Palm Tree Sprite | [Sevarihk / OpenGameArt](https://opengameart.org/content/animated-palm-tree-sprite) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `palme-animation1.png` → `regions/shared/palm-sevarihk.png`. Giữ nguyên PNG; chọn 15 frame 210 × 150 và thu nhỏ khi hiển thị. Dùng tại Hải Phòng và Nghệ An. |
| Animated Water Tiles | [Sevarihk / OpenGameArt](https://opengameart.org/content/animated-water-tiles-0) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | `waterfall-autotiles-anim.png` giữ tại `regions/shared/waterfall-sevarihk.png`; cắt ba nhóm frame thành `waterfall.png`, mỗi frame 64 × 128. Thu nhỏ và giảm alpha để ghép thác Hà Tĩnh. |

Nguồn file trực tiếp: [cây cọ](https://opengameart.org/sites/default/files/palme-animation1.png), [thác](https://opengameart.org/sites/default/files/waterfall-autotiles-anim.png). Ghi công tác giả, nguồn, giấy phép và thay đổi cũng hiển thị ở `/assets/credits.html` trong game.

Phần địa danh Việt Nam và bố cục là đồ họa tạo/chỉnh riêng theo concept, không phải bộ địa danh tải sẵn. Không mua hoặc tích hợp các gói trả phí trong shortlist. [Báo cáo nghiên cứu trước triển khai](REGIONAL_ASSET_RESEARCH.md) giữ nguyên để đối chiếu; bảng trên là các nguồn thực sự đang dùng.

Ảnh concept và bản sạch giữ ở `docs/art-source/regions/<mapId>/`; ảnh cầu/thuyền gốc ở `docs/art-source/regions/shared/`. Prompt và lịch sử sửa Hà Tĩnh giữ trong `docs/regions-generation.json`. `scripts/prepare-regions.py` mã hóa WebP, cắt lớp và sinh dữ liệu hình học; `scripts/prepare-region-sprites.py` chuẩn hóa alpha/atlas. Build và chạy game dùng asset đã lưu, không cần gọi imagegen hoặc tải lại Internet.

## Mỹ thuật và pipeline cần giữ khi tiếp tục

Giữ góc nhìn 3/4 từ trên, mặt tiền công trình đọc được, tỉ lệ người native 32 × 48, chân sprite cùng baseline và bóng nhỏ dưới chân. Cảnh chi tiết với xanh cây nhiều sắc, nước xanh ngọc/xanh cảng theo từng concept, tường kem vàng/mái đỏ, đường đá sáng; UI giấy kem, chữ xanh đậm, tiêu đề đỏ và nút xanh. Không tăng người/cây thành khối lớn hoặc đổi sang SVG/tile đơn giản chỉ để dễ code. Theo ảnh sạch của từng vùng thay vì chọn một màu nước chung cho mọi map.

Preload hiện tại: `hanoiAssets.ts::preloadHanoi` nạp scene/layers v3 khi includeScene=true, luôn nạp sprite/props/trạm v2 và bridge v3. `regionalScene.ts::preloadRegion` gọi preloadHanoi(false), nạp cảnh/layers vùng cùng atlas bridge/boats/palm/waterfall dùng chung. Một số sprite/atlas được nạp dùng chung dù vùng không vẽ chúng; không suy mỗi file preload đều xuất hiện trên mọi map.

Atlas: người 32 × 48, 4 frame mỗi hướng với hàng down/left/right/up, 8 fps; props 64 × 96. Cầu Hà Nội 216 × 80 × 3 frame dọc; cầu vùng 512 × 192 × 3 frame dọc; boats 192 × 104 × 3 frame. Palm 210 × 150, 15 frame; waterfall runtime 64 × 128, 3 frame. Rà frame/origin/alpha khi thay file, không chỉ đổi tên PNG.

Các lớp foreground là crop pixels của **chính scene** kèm polygon mask và ground depth; ảnh mới cần trace lại, không dùng mask cũ cho cảnh khác. Renderer có alpha fade khi layer/lều che người chơi. Nhãn tiếng Việt là chữ Phaser ở world coordinates, HUD/minimap là DOM/Canvas. Chưa có animation cho mọi lá/cây/cối nước trong cảnh; phần lớn trang trí tĩnh đã nằm trong nền.

Thứ tự thay ảnh/geometry/build và file sinh xem [MAPS](MAPS.md). Python 3 + Pillow/WebP cần cho script ảnh, không cần để chạy npm game. Archive đã có bản sạch trong repo. Fallback prepare-hanoi-v3 và một số bước v2 còn tham chiếu thư mục imagegen tuyệt đối trên máy tác giả; không phụ thuộc đó nếu đầu vào archive đã đủ. Script `prepare-region-contact-sheet.py` dùng font `C:/Windows/Fonts/arial*.ttf`, chỉ làm ảnh QA ghép, cần đổi đường font trên máy khác.

Manifest tạo ảnh: [v2](hanoi-v2-generation.json), [v3](hanoi-v3-generation.json), [vùng](regions-generation.json); các đường tuyệt đối bên trong là lịch sử đầu ra, không phải lệnh bắt buộc cho agent mới. Chứng cứ cảnh đang chạy: [Hà Nội v3](HANOI_V3_HANDOVER.md), [sáu vùng](REGIONAL_MAPS_HANDOVER.md). Không gán giấy phép bộ tải ngoài cho ảnh tự tạo/chỉnh từ concept.
