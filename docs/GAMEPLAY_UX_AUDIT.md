# GAMEPLAY_UX_AUDIT.md — BÁO CÁO TOÀN DIỆN TRẢI NGHIỆM GAMEPLAY & UX
**Dự án:** QUÊ MÌNH ĐỨNG ĐẦU! (Bản đồ Hà Nội & 6 vùng miền)  
**Vai trò:** Senior Game UX / Gameplay Reviewer  
**Đối tượng sử dụng báo cáo:** Đội ngũ phát triển / Coding Agent tiếp quản triển khai  
**Mục tiêu:** Chuyển hóa trải nghiệm từ "website có nhân vật đi lại" thành một **trò chơi cộng tác 2D Top-Down thực thụ**, tối ưu cho multiplayer 60 người (7 đội/thành phố).

---

## TỔNG QUAN ĐÁNH GIÁ (EXECUTIVE SUMMARY)

| Trục đánh giá | Trạng thái hiện tại | Nhận định cốt lõi |
|---|---|---|
| **Walkability & Collision** | ⚠️ BẤT CẬP LỚN | Cơ chế di chuyển dựa trên "đường ống hẹp" (path-based spline) khiến mọi khoảng sân, bãi cỏ rộng đều bị chặn bởi tường vô hình. Nhân vật chạy tại chỗ khi đâm vật cản mà không có feedback. |
| **Movement & Controls** | ⚠️ ĐƠN ĐIỆU | Tốc độ di chuyển cố định (180 px/s), bản đồ lớn (1672×941) khiến 60-70% thời lượng là giữ phím đi bộ một chiều. Không có cơ chế chạy nhanh (Sprint) hay hỗ trợ tiếp sức. |
| **Interaction & Feedback** | ⚠️ THIẾU TỰ NHIÊN | Tương tác thông qua các cửa sổ Web Modal chiếm 80% màn hình. Thế giới game phía sau đóng băng; không có hiệu ứng âm thanh (Audio = 0%), không có hoạt ảnh tương tác, không có floating numbers. |
| **Multiplayer 60 người (7 Teams)** | ⚠️ NGHẼN CỔ CHAI | Giới hạn 3 đơn vị nhân lực (`manpower = 3`) khiến trong một đội 8-10 người thì 5-7 người bị rơi vào trạng thái nhàn rỗi, không thể nhận công việc. Không có hệ thống Ping bản đồ nhanh. |
| **Wayfinding & Visual Language** | 🟡 ĐẠT MỨC CƠ BẢN | Đã có đường dẫn BFS chấm vàng và nhãn POI; tuy nhiên các điểm tương tác thiếu hotspot trực quan dưới mặt đất, người chơi khó nhận diện vị trí đứng chuẩn xác. |

---

## CHI TIẾT CÁC VẤN ĐỀ (AUDIT ISSUES)

### ISSUE-01 — Ranh giới di chuyển "đường ống vô hình" (Invisible Path-Tube Collision)
- **Priority:** P0 (Critical)
- **Category:** Walkability / Collision
- **Observed behavior:**
  Người chơi chỉ có thể di chuyển trong phạm vi bán kính `width/2` (khoảng 32–40px) tính từ trục tim các đoạn thẳng `paths` được định nghĩa trong `shared/src/mapData.ts` và `shared/src/regionalMapData.ts`. Về mặt hình ảnh (`scene.webp`), trước Trụ sở, quanh bờ hồ, quảng trường và vỉa hè là các khoảng đất trống bằng phẳng, rộng lớn. Nhưng khi người chơi rẽ ra bãi cỏ hoặc sân gạch, nhân vật lập tức bị khựng lại như đâm vào một bức tường vô hình giữa khoảng không.
- **Expected behavior:**
  Không gian mở (quảng trường, sân trụ sở, bãi cỏ công viên không có rào chắn) phải cho phép nhân vật đi lại tự do. Collider chỉ bao quanh các chướng ngại vật thực sự nhìn thấy bằng mắt (chân tường nhà, mép nước hồ, hàng rào, gốc cây lớn). Người chơi nhìn thấy đất trống là phải đi được.
- **Why it matters:**
  Đây là nguyên nhân lớn nhất khiến người chơi mới cảm thấy ức chế, liên tục hỏi "Tại sao chỗ này trống mà không đi được?", phá vỡ hoàn toàn cảm giác nhập vai trong thế giới 2D.
- **Evidence:**
  - Map Hà Nội: Khu vực sân trước Trụ sở (x: 155–350, y: 200–350) và vỉa hè phía Nam Hồ Gươm.
  - Map Hải Phòng, Thanh Hóa, Quảng Ninh: Các khu vực đất trống xung quanh điểm xuất hiện (Spawn) và kho vật tư.
  - Thao tác: Di chuyển chéo ra khỏi trục đường màu nâu/xám trên hình nền.
- **Relevant files:**
  - `shared/src/mapData.ts` (hàm `isOnWalkway`, `isWalkable`, mảng `WALKWAYS`)
  - `shared/src/worldMaps.ts` (hàm `isWalkableForMap`, dòng 35–45)
  - `shared/src/regionalMapData.ts` (mảng `paths` của từng vùng)
- **Recommended fix:**
  Chuyển đổi logic kiểm tra va chạm từ mô hình **"Whitelisted Narrow Splines"** (chỉ cho đi trên ray) sang mô hình **"Blacklisted Obstacles"** (đi được toàn map, ngoại trừ mép biên, vùng nước polygon hồ/kênh, và các static collider nhà/cây). Mở rộng độ rộng đường đi `width` tại các nút giao/sân bãi lên 120–200px hoặc bổ sung các polygon sân bãi (`WalkablePlaza`).
- **Acceptance test:**
  1. Người chơi từ Trụ sở đi thẳng chéo xuống Khu A xuyên qua khoảng sân trước cửa mà không bị chặn khựng giữa chừng.
  2. Người chơi có thể đi dàn hàng ngang 3-4 người trên các tuyến đường chính mà không bị va vào mép vô hình.
- **Risk:** Medium (Cần đảm bảo nhân vật không đi lọt vào lòng hồ nước hoặc xuyên qua tường nhà).

---

### ISSUE-02 — Thiếu phản hồi va chạm & lỗi "Chạy tại chỗ" (Running in Place on Wall Hit)
- **Priority:** P1 (High)
- **Category:** Collision / Movement / Game Feel
- **Observed behavior:**
  Khi người chơi giữ phím di chuyển đâm thẳng vào tường nhà, thân cây hoặc mép hồ, nhân vật vẫn giữ nguyên animation chạy (`sprite.play(...)` 8 khung hình/giây) nhưng tọa độ không thay đổi. Trò chơi không phát ra bất kỳ âm thanh va chạm, rung nhẹ (bump/recoil) hay hiệu ứng bụi dưới chân.
- **Expected behavior:**
  Khi đâm vào vật thể không thể di chuyển, sprite nhân vật phải dừng animation chạy (chuyển về idle frame) hoặc phát hoạt ảnh tì/chống tay nhẹ; kèm theo phản hồi thị giác/âm thanh rõ ràng để người chơi biết mình đang bị vật cản chặn lại, không phải game bị lag hay mất mạng.
- **Why it matters:**
  Tạo cảm giác nhân vật "trôi nổi" không gắn kết với môi trường vật lý; gây hiểu nhầm nghiêm trọng giữa "bị kẹt mạng / packet loss" và "đụng vật cản".
- **Evidence:**
  - `client/src/scenes/MainScene.ts` (dòng 132–156): `animate(c, dir, Math.hypot(c.x-oldX, c.y-oldY) > 0.05)`. Khi đâm vuông góc vào collider, nếu vận tốc trục bị triệt tiêu về 0 thì sprite dừng, nhưng khi đi chéo cọ vào tường thì animation giật cục liên tục giữa run và idle frame.
- **Relevant files:**
  - `client/src/scenes/MainScene.ts` (hàm `handleMovement` và `animate`)
- **Recommended fix:**
  1. Nếu tổng quãng đường di chuyển thực tế sau khi tính collision `< 0.2px` trong khi người chơi đang nhấn phím điều khiển: lập tức dừng animation bước chân, hiển thị frame đứng yên tương ứng với hướng nhìn.
  2. Thêm hiệu ứng trượt mượt (wall-sliding vector projection) thay vì chỉ kiểm tra độc lập trục X và Y.
- **Acceptance test:**
  Giữ phím W đâm thẳng vào tường Trụ sở: nhân vật đứng yên, animation chân dừng lại ngay lập tức, không có hiện tượng chạy chân liên tục tại chỗ.
- **Risk:** Low.

---

### ISSUE-03 — Cảm giác "Website đóng băng thế giới game" khi tương tác (Heavy Modal Interruption)
- **Priority:** P1 (High)
- **Category:** Gameplay / Interaction / UI
- **Observed behavior:**
  Mỗi lần tương tác với bất kỳ điểm nào (Trụ sở, Kho, Trạm y tế, Người dân), giao diện lập tức bung ra một hộp thoại Web HTML to lớn (`#action-panel`, `#briefing-modal`, `#voting-modal`) che kín trung tâm màn hình với backdrop đen mờ (`bg-black/60 backdrop-blur-sm`). Mọi chuyển động của thế giới game phía sau bị che khuất và đóng băng điều khiển. Khi làm nhiệm vụ (khảo sát 4s, triển khai 8s, sửa cầu 8s), người chơi chỉ nhìn chằm chằm vào thanh phần trăm HTML màu xanh chạy từ 0% đến 100%.
- **Expected behavior:**
  Tương tác trong game 2D nên diễn ra trực tiếp trong bối cảnh thế giới:
  - Bảng tương tác nên là một khung popup nhỏ gọn (Action Wheel hoặc Dialog Box gọn gàng góc dưới/bên hông), không che mất nhân vật và đồng đội xung quanh.
  - Khi nhân vật đang thực hiện công tác (Job progress), nhân vật trên sàn đấu nên có hoạt ảnh làm việc (tay vung búa, mở sổ ghi chép, túi sơ cứu) kèm thanh tiến trình nổi trên đầu nhân vật trong Canvas, giúp các đồng đội khác chạy ngang qua cũng nhìn thấy bạn mình đang làm gì.
- **Why it matters:**
  Đây là lý do cốt lõi người chơi nhận xét game "giống một website có nhân vật đi lại". Người chơi không được sống trong thế giới game mà liên tục bị kéo ra giao diện web form quản trị.
- **Evidence:**
  - `client/src/ui/actionPanel.ts` (dòng 16: fixed inset-0 flex items-center justify-center bg-black/60)
  - `client/src/scenes/MainScene.ts` (dòng 124–125: khóa hoàn toàn movement khi có bất kỳ modal nào mở)
- **Relevant files:**
  - `client/src/ui/actionPanel.ts`
  - `client/src/scenes/MainScene.ts`
  - `client/src/game.css`
- **Recommended fix:**
  1. Giảm kích thước `#action-panel`, đặt lệch sang góc phải hoặc phía dưới màn hình (Side Panel / Bottom Drawer), bỏ backdrop đen che mờ toàn màn hình.
  2. Cho phép người chơi vẫn quan sát được nhân vật và các người chơi khác di chuyển xung quanh trong lúc mở bảng hành động.
  3. Đưa tiến trình công việc (Progress bar) lên đầu nhân vật trong Phaser Canvas (`progressBar` đã có sẵn trong `createPlayerContainer`), giảm phụ thuộc vào thanh tiến độ HTML.
- **Acceptance test:**
  Bấm E tại Trạm y tế: Bảng chọn hiện gọn ở cạnh màn hình; người chơi vẫn nhìn thấy đồng đội đang chạy lại gần mình; khi bấm thi công, thanh tiến độ chạy trên đầu sprite nhân vật.
- **Risk:** Medium (Cần tinh chỉnh CSS responsive cho màn hình điện thoại).

---

### ISSUE-04 — Hoàn toàn không có âm thanh (Zero Audio Feedback)
- **Priority:** P1 (High)
- **Category:** Game Feel / Feedback
- **Observed behavior:**
  Trò chơi hoàn toàn im lặng 100%. Trong toàn bộ thư mục `client/public`, không có bất kỳ một tệp âm thanh nào (`.mp3`, `.ogg`, `.wav`). Không có nhạc nền (BGM), không có tiếng bước chân, không có tiếng nhặt vật tư, không có tiếng hoàn thành nhiệm vụ, không có tiếng đếm ngược biểu quyết.
- **Expected behavior:**
  - Âm thanh môi trường nền nhẹ nhàng phù hợp bản sắc từng vùng (tiếng sóng biển Hải Phòng, tiếng chim hót Làng Sen Nghệ An, tiếng chuông gió Hồ Gươm).
  - Âm thanh phản hồi hành động (SFX): Tiếng nhấc kiện hàng "thud", tiếng giao hàng "chime", tiếng hoàn thành công tác "ding!", tiếng biểu quyết thành công "fanfare", âm thanh cảnh báo khi cầu gãy hoặc sắp hết giờ.
- **Why it matters:**
  Âm thanh chiếm 50% cảm giác game ("Game Feel"). Thiếu âm thanh là nguyên nhân trực tiếp khiến trò chơi cho cảm giác như một trang web tĩnh hay tài liệu tương tác thay vì một game hành động giáo dục sống động.
- **Evidence:**
  Quét toàn bộ thư mục dự án không có file audio nào; mã nguồn `client/src` không có `AudioContext` hay `scene.sound.play`.
- **Relevant files:**
  - `client/src/game/phaserGame.ts`
  - `client/src/scenes/MainScene.ts`
  - Thư mục tài nguyên `client/public/assets/audio/`
- **Recommended fix:**
  Tích hợp hệ thống quản lý âm thanh gọn nhẹ (Sound Manager) trong Phaser:
  1. Thêm bộ SFX cơ bản (UI click, pick crate, deliver crate, task complete, vote alert, count down).
  2. Bổ sung track BGM nhạc cụ dân tộc / không lời hào sảng ở mức âm lượng 30% với nút bật/tắt (Mute) trên HUD.
- **Acceptance test:**
  Lấy kiện hàng từ kho phát ra tiếng "vác vật tư"; giao hàng thành công phát ra âm thanh tích điểm rõ ràng.
- **Risk:** Low (Chỉ tải asset nhẹ khi người chơi tương tác lần đầu để tuân thủ autoplay policy trình duyệt).

---

### ISSUE-05 — Nghẽn cổ chai nhân lực trong Multiplayer 60 người (`manpower = 3`)
- **Priority:** P1 (High)
- **Category:** Gameplay / Team System
- **Observed behavior:**
  Tổng số đơn vị nhân lực của cả phòng chỉ có 3 (`TOTAL_MANPOWER_UNITS = 3`). Khi có một đội 8–10 người cùng tham gia vào một thành phố: nếu 3 người đang nhận công tác (ví dụ 1 người triển khai trạm y tế 8s, 2 người sửa cầu 8s), thì toàn bộ 5–7 người chơi còn lại trong đội BỊ KHÓA HÀNH ĐỘNG. Khi họ chạy đến POI bấm E, hệ thống báo lỗi "Không đủ nhân lực sẵn sàng (0/3 rảnh)".
- **Expected behavior:**
  Trong chế độ nhiều người chơi (Multiplayer lớp học):
  - Số lượng người chơi tham gia phải tỷ lệ thuận với khả năng đóng góp.
  - Người chơi không trực tiếp thi công vẫn phải có việc làm giá trị cao: hỗ trợ tăng tốc công việc của đồng đội (Co-op Speedup: 2 người cùng thi công thì thời gian giảm từ 8s xuống 4s), lập dây chuyền chuyển kiện hàng tiếp sức (chuyền tay vật tư), bảo vệ tuyến đường, hoặc khảo sát song song các khu dân cư.
- **Why it matters:**
  Với quy mô 60 người chia 7 đội (~8-9 người/đội), thiết kế hiện tại sẽ biến 70% số người chơi thành "khán giả đi dạo", gây ức chế và mất tập trung trong buổi học.
- **Evidence:**
  - `shared/src/constants.ts` (dòng 31: `TOTAL_MANPOWER_UNITS = 3`)
  - `server/src/gameEngine.ts` (dòng 710–760: kiểm tra `this.manpower.busy >= this.manpower.total`)
- **Relevant files:**
  - `shared/src/constants.ts`
  - `server/src/gameEngine.ts`
  - `client/src/ui/actionPanel.ts`
- **Recommended fix:**
  1. Điều chỉnh số lượng nhân lực động theo số người chơi online: `totalManpower = Math.max(3, Math.min(8, onlinePlayers))`.
  2. Thêm cơ chế **Hỗ trợ đồng đội (Co-op Boost)**: Khi một người đang làm Job, đồng đội đứng gần bấm E sẽ tham gia "Hỗ trợ" giúp thanh tiến độ chạy nhanh gấp đôi.
- **Acceptance test:**
  Tạo phòng có 6 người chơi: cả 6 người đều có thể đồng thời nhận các công việc khác nhau hoặc cùng hỗ trợ nhau hoàn thành nhanh một công trình lớn.
- **Risk:** Medium (Cần cân bằng lại điểm số và thời gian trận đấu để giữ tính thử thách).

---

### ISSUE-06 — Quãng đường di chuyển quá dài, thiếu cơ chế Chạy nhanh (Sprint / Relay)
- **Priority:** P1 (High)
- **Category:** Movement / Gameplay Flow
- **Observed behavior:**
  Tốc độ nhân vật cố định ở mức 180 unit/s. Kích thước bản đồ là 1672×941. Để đi một lượt từ Kho (Tây) sang Khu B (Đông) qua đường vòng phía Bắc, người chơi phải nhấn giữ phím liên tục trong 12–15 giây. Trong M2 (tuyến vòng cần 2 kiện) và M3 (2 cụ già cần 2 kiện), người chơi phải đi đi lại lại tuyến đường này 4–6 lần, tiêu tốn hơn một nửa tổng thời lượng 10 phút của trận đấu chỉ để giữ phím đi bộ.
- **Expected behavior:**
  - Có phím chạy nhanh (giữ `Shift` hoặc `Space` để Sprint tăng tốc lên 260 unit/s trong thời gian ngắn với thanh thể lực nhẹ).
  - Có cơ chế vận chuyển tiếp sức (Relay Transport): Người chơi A có thể đặt kiện hàng xuống nửa đường (Drop Crate), người chơi B đứng đón nhặt lên chạy tiếp sang bờ Đông; hoặc có xe đẩy vật tư công cộng.
- **Why it matters:**
  Lặp lại thao tác đi bộ đơn điệu trên cùng một lộ trình nhiều lần làm gameplay bị "chết nhịp" (dead time), giảm hứng thú học tập và tạo cảm giác mỏi tay vô ích.
- **Evidence:**
  - `shared/src/constants.ts` (dòng 4: `PLAYER_SPEED = 180`)
  - Kho cách Khu B hơn 1800 units đường đi bộ thực tế.
- **Relevant files:**
  - `shared/src/constants.ts`
  - `client/src/scenes/MainScene.ts` (`handleMovement`)
  - `server/src/gameEngine.ts` (`handleMove`)
- **Recommended fix:**
  1. Bổ sung cơ chế Sprint (giữ Shift để chạy nhanh 1.4x tốc độ thường khi không mang vác nặng, hoặc 1.2x khi mang vác).
  2. Hiển thị rõ cơ chế "Chuyền kiện hàng cho nhau" trên HUD để khuyến khích tinh thần làm việc nhóm nhiều người.
- **Acceptance test:**
  Nhấn giữ phím Shift: nhân vật tăng tốc rõ rệt kèm hoạt ảnh chạy nhanh hơn; thời gian vượt cầu/tuyến vòng giảm 30%.
- **Risk:** Low (Server cần cập nhật ngưỡng kiểm tra tốc độ tối đa cho phép trong `handleMove`).

---

### ISSUE-07 — Điểm tương tác thiếu chỉ báo hình ảnh dưới mặt đất (Missing In-World Hotspots)
- **Priority:** P1 (High)
- **Category:** Wayfinding / Interaction Clarity
- **Observed behavior:**
  Các điểm tương tác (Trụ sở, Kho, Điểm B, C, Cụ C1, C2) chỉ có một biển chữ tĩnh màu vàng gắn lơ lửng trên nóc nhà ở tọa độ y rất cao (`size: 10-17px`). Dưới chân mặt đất nơi người chơi thực sự cần đứng vào thì hoàn toàn trống trơn. Người chơi không biết phải đứng ở bậc thềm, trước cửa hay bên hông nhà thì mới kích hoạt được tương tác.
- **Expected behavior:**
  Mỗi điểm tương tác POI đang hoạt động trong nhiệm vụ hiện tại phải có một vòng tròn tương tác sáng nhẹ dưới mặt đất (Interactive Pulsing Ring / Decal), có biểu tượng loại hình (icon hòm thuốc, hộp vật tư, biểu tượng đối thoại). Khi người chơi bước chân vào vòng tròn, vòng sáng rực lên và nút [E] hiện ra ngay tại vị trí nhân vật.
- **Why it matters:**
  Người chơi mới thường chạy vòng quanh chân tường nhà hoặc đâm sầm vào góc tường để tìm chỗ bấm nút, gây mất thời gian và bối rối.
- **Evidence:**
  - `client/src/game/hanoiScene.ts` (dòng 16–22): Chỉ vẽ `label(x, y, text)` dạng Phaser Text tĩnh ở độ cao y-100.
  - Tọa độ POI thực tế trong `POINTS_OF_INTEREST` nằm dưới đất (ví dụ Trụ sở x:155, y:255 nhưng label ở y:158).
- **Relevant files:**
  - `client/src/game/hanoiScene.ts`
  - `client/src/game/regionalScene.ts`
  - `client/src/scenes/MainScene.ts`
- **Recommended fix:**
  Trong hàm `drawHanoi` và `drawRegion`, thêm một lớp vẽ hiệu ứng nền đất (Ground Decals) cho các POI đang active: vòng tròn nét đứt pulsing xoay nhẹ, đổi màu sang xanh ngọc khi người chơi bước vào phạm vi.
- **Acceptance test:**
  Đi lại gần bất kỳ điểm nhiệm vụ nào: Dưới chân điểm đó có vòng sáng đánh dấu rõ ràng phạm vi `INTERACTION_RADIUS = 72px`.
- **Risk:** Low.

---

### ISSUE-08 — Xung đột tương tác tại hai điểm sửa cầu bờ Tây (Bridge Tasks Overlap)
- **Priority:** P1 (High)
- **Category:** Interaction / Map
- **Observed behavior:**
  Trong Nhiệm vụ 2 (Sửa cầu), hai điểm công tác `BRIDGE_TASK_1` (Mố cầu Tây, x: 1338, y: 393) và `BRIDGE_TASK_2` (Dầm cầu, x: 1338, y: 435) chỉ cách nhau 42 pixels theo trục dọc. Trong khi đó, bán kính tương tác là 72 pixels. Khi người chơi đứng ở giữa (y = 414), cả hai điểm cùng thỏa mãn điều kiện tương tác. Chỉ cần người chơi nhích một bước nhỏ, POI được chọn sẽ nhảy loạn xạ giữa Task 1 và Task 2, khiến người chơi bấm nhầm công việc.
- **Expected behavior:**
  - Hoặc hợp nhất hai điểm sửa cầu thành **một trạm chỉ huy sửa cầu duy nhất** tại đầu cầu, bên trong ActionPanel cho phép chọn lần lượt: "Bước 1: Khắc phục mố Tây" rồi đến "Bước 2: Gia cố dầm Đông".
  - Hoặc dời khoảng cách giữa 2 điểm xa nhau tối thiểu 100px (ví dụ Task 1 ở mố phía Tây, Task 2 ở giữa nhịp cầu).
- **Why it matters:**
  Người chơi rất dễ bị nhầm lẫn, bấm vào task chưa đủ điều kiện (chưa giao đủ vật tư) hoặc bấm hủy nhầm task đang làm của đồng đội bên cạnh.
- **Evidence:**
  - `shared/src/mapData.ts` (dòng 224–243: `BRIDGE_TASK_1` y=393, `BRIDGE_TASK_2` y=435).
  - `client/src/scenes/MainScene.ts` (hàm `checkNearestPoi` chỉ so sánh `d < distance`).
- **Relevant files:**
  - `shared/src/mapData.ts`
  - `shared/src/regionalMapData.ts`
  - `client/src/scenes/MainScene.ts`
  - `client/src/ui/actionPanel.ts`
- **Recommended fix:**
  Gộp 2 điểm sửa cầu trên bờ Tây thành một điểm tương tác logic duy nhất (`BRIDGE_REPAIR_STATION`), hiển thị tuần tự 2 giai đoạn sửa chữa trong giao diện tương tác.
- **Acceptance test:**
  Đứng tại đầu cầu bờ Tây: Chỉ có 1 tương tác duy nhất, hiển thị rõ ràng tiến độ của cả 2 hạng mục mố cầu và dầm cầu.
- **Risk:** Low.

---

### ISSUE-09 — Thiếu hiệu ứng trực quan tại hiện trường khi hoàn thành nhiệm vụ (Missing In-Game Feedback)
- **Priority:** P2 (Medium)
- **Category:** Game Feel / Visual Feedback
- **Observed behavior:**
  Khi người chơi hoàn thành một hành động lớn (khảo sát xong, giao đủ 2 kiện hàng, chăm sóc cụ C1, niêm yết kết quả), thế giới game phản ứng rất lạnh lùng:
  - Điểm số chỉ nhảy số trên thanh HUD phía trên.
  - Không có số điểm bay lên trên đầu nhân vật (`+2 Điểm`, `+8 Điểm` dạng Floating Combat Text).
  - Không có NPC vẫy tay chào hay nói lời cảm ơn dạng bong bóng thoại (Speech bubble).
  - Cụ Lan, Cụ Bình sau khi được chăm sóc vẫn đứng im với dấu ba chấm `...` như cũ.
- **Expected behavior:**
  - Khi cộng điểm: Hiển thị chữ số nổi màu vàng bay lên từ đầu nhân vật (`+8 ĐIỂM!`) trong Phaser Canvas.
  - Khi giao hàng hoặc chăm sóc dân: NPC đổi biểu cảm sang mặt cười `^ _ ^`, bong bóng thoại hiện lời cảm ơn ngắn gọn ("Cảm ơn cán bộ!", "Cầu thông rồi!").
  - Khi trạm y tế hoàn thành: Bụi khói tan ra, cờ đỏ bay phấp phới, bác sĩ vẫy tay chào.
- **Why it matters:**
  Tạo ra cảm giác thành tựu và sự công nhận ngay lập tức cho người chơi, giúp người chơi hiểu rõ hành động của mình đã mang lại lợi ích gì cho xã hội.
- **Evidence:**
  - `client/src/scenes/MainScene.ts`: Không có hệ thống floating text.
  - `client/src/game/hanoiScene.ts`: NPC chỉ vẽ một lần lúc khởi tạo, không có state reaction.
- **Relevant files:**
  - `client/src/scenes/MainScene.ts`
  - `client/src/game/hanoiScene.ts`
  - `client/src/game/regionalScene.ts`
- **Recommended fix:**
  Thêm hàm tiện ích `showFloatingText(scene, x, y, text, color)` trong `MainScene` kích hoạt mỗi khi nhận snapshot có điểm số tăng hoặc audit event liên quan đến người chơi.
- **Acceptance test:**
  Hoàn thành khảo sát Khu A: Ngay trên đầu nhân vật hiện chữ `+2 ĐIỂM` màu vàng bay lên và mờ dần trong 1.5 giây.
- **Risk:** Low.

---

### ISSUE-10 — Chồng lấn nhân vật khi đông người (No Player Soft-Collision / Pushback)
- **Priority:** P2 (Medium)
- **Category:** Multiplayer / Visual Clarity
- **Observed behavior:**
  Trong phòng có đông người (6–10 người chơi), khi cả đội cùng tập trung trước cửa Trụ sở hoặc Kho vật tư, các sprite nhân vật đứng chồng khít lên nhau thành một khối pixel lộn xộn. Người chơi không biết nhân vật của mình đang đứng chính xác ở đâu giữa đám đông.
- **Expected behavior:**
  - Thêm lực đẩy nhẹ giữa các nhân vật (Soft Player-Player Separation / Repulsion): Khi 2 nhân vật đứng quá sát nhau (`distance < 20px`), tự động có một lực trượt nhẹ đẩy tách nhau ra một khoảng nhỏ.
  - Nhân vật của người chơi cục bộ (Local Player) luôn được vẽ viền sáng nổi bật (Highlight Outline) hoặc có mũi tên đánh dấu nhỏ trên đầu để không bị chìm giữa các đồng đội.
- **Why it matters:**
  Đặc biệt quan trọng với kịch bản chơi multiplayer lớp học 60 người (chia 7 đội), giúp các thành viên dễ dàng định vị bản thân và đồng đội.
- **Evidence:**
  - `client/src/scenes/MainScene.ts` (dòng 109–115): Đã cố gắng xử lý xếp tầng nameplate nhưng chân và thân sprite vẫn đè bẹp lên nhau.
- **Relevant files:**
  - `client/src/scenes/MainScene.ts` (`updateFromSnapshot`, `handleMovement`)
- **Recommended fix:**
  Thêm vòng lặp tính repulsion vector nhẹ giữa các player sprites trong `MainScene.update`.
- **Acceptance test:**
  Ba người chơi cùng chạy vào một điểm: Các nhân vật tự động tản ra đứng cạnh nhau thành hàng ngang/vòng tròn, không bị đè bẹp lên nhau.
- **Risk:** Low.

---

### ISSUE-11 — Thiếu hệ thống Đánh dấu / Báo hiệu nhanh trong đội (In-Game Ping System)
- **Priority:** P2 (Medium)
- **Category:** Multiplayer / Team Communication
- **Observed behavior:**
  Người chơi trong đội không có cách nào giao tiếp hay chỉ đường cho nhau trong không gian game. Nếu muốn bảo đồng đội "Khu B đang thiếu 1 kiện hàng, ai mang sang đi", người chơi chỉ có thể hét to ngoài đời thực hoặc không thể phối hợp nếu ngồi xa nhau trong lớp.
- **Expected behavior:**
  Có tính năng Ping nhanh: Nhấp đúp chuột hoặc bấm phím `G` tại một vị trí trên bản đồ / minimap để thả một dấu hiệu tạm thời (Ping Marker: "Cần hỗ trợ ở đây!", "Vật tư ở đây!") hiển thị cho tất cả thành viên trong phòng trong 5 giây.
- **Why it matters:**
  Tăng cường tính gắn kết đồng đội, thúc đẩy tinh thần làm việc nhóm và phân công lao động xã hội chủ nghĩa đúng như mục tiêu giáo dục của trò chơi.
- **Evidence:**
  Mã nguồn client và server hiện tại chỉ hỗ trợ intent di chuyển và thực hiện công việc, không có intent chat hay ping.
- **Relevant files:**
  - `shared/src/types.ts` (`ClientIntent`)
  - `server/src/gameEngine.ts`
  - `client/src/scenes/MainScene.ts`
- **Recommended fix:**
  Thêm ClientIntent type `PING_LOCATION` và vẽ marker hình giọt nước có hoạt ảnh tỏa sóng trên bản đồ của tất cả thành viên trong phòng.
- **Acceptance test:**
  Người chơi 1 bấm phím G tại trạm y tế: Người chơi 2 ở đầu kia bản đồ nhìn thấy biểu tượng Ping nhấp nháy trên màn hình và minimap.
- **Risk:** Low.

---

## CÁC ĐIỂM ĐÃ LÀM TỐT (PASS / COMMENDATIONS)

1. **Hệ thống dẫn đường BFS (Route Guidance): PASS**
   - Thuật toán `findWalkingRoute` với lưới 20px tính toán tuyến đường đi bộ rất thông minh, tự động né hồ nước và biết chuyển hướng lên tuyến vòng phía Bắc khi cầu gãy.
2. **Minimap đồng bộ trực quan: PASS**
   - Bản đồ con góc dưới bên phải vẽ trạng thái cầu (nâu khi gãy, sáng khi lành), trạng thái trạm y tế và vị trí thời gian thực của đồng đội rất mượt mà.
3. **Chống gian lận Server-Authoritative: PASS**
   - Server kiểm soát toàn bộ logic vật tư, ngân sách, nhân lực và điểm số; client chỉ gửi intent và nhận snapshot, không thể hack điểm.
4. **Hệ thống phân việc đồng bộ (TaskPanel & Toast mới): PASS**
   - Đã đồng bộ 100% với `MissionGuide`, thông báo Toast nổi thời gian thực khi có mốc sự kiện mới hoạt động chính xác.

---

# TOP PRIORITY FIX ORDER (THỨ TỰ ƯU TIÊN SỬA CHỮA)

Sắp xếp theo mức độ ảnh hưởng trực tiếp đến trải nghiệm thực tế của người chơi:

1. **ISSUE-01 (P0): Mở rộng Walkability & Gỡ bỏ ranh giới đường ống vô hình**
   *Tác động:* Loại bỏ 100% cảm giác ức chế bị tường vô hình chặn lại giữa các khoảng đất trống bằng phẳng.
2. **ISSUE-04 (P1): Tích hợp Hệ thống Âm thanh (SFX & Ambient BGM)**
   *Tác động:* Đột phá cảm giác từ "website tĩnh" thành "trò chơi 2D sống động" chỉ bằng âm thanh môi trường và phản hồi xúc giác.
3. **ISSUE-03 (P1): Tinh gọn Action Modal & Chuyển tiến trình công việc vào Canvas**
   *Tác động:* Không còn bị che đen màn hình mỗi lần bấm nút; đồng đội nhìn thấy nhau đang làm việc trong thế giới thực.
4. **ISSUE-05 (P1): Tăng giới hạn nhân lực động & Thêm cơ chế Hỗ trợ đồng đội (Co-op Boost)**
   *Tác động:* Giải phóng 60 người chơi / 7 đội khỏi tình trạng "ngồi chơi xơi nước" vì hết chỉ tiêu nhân lực.
5. **ISSUE-02 (P1): Dừng animation khi va chạm & Sửa trượt tường (Wall-slide)**
   *Tác động:* Loại bỏ hiện tượng "chạy tại chỗ" gây hiểu nhầm lag mạng khi đâm vào vật cản.
6. **ISSUE-06 (P1): Thêm cơ chế Chạy nhanh (Sprint / Shift) & Tiếp sức vật tư**
   *Tác động:* Giảm 40% thời gian chết chỉ giữ phím đi bộ qua lại giữa các khu vực xa xôi.
7. **ISSUE-07 (P1): Bổ sung vòng sáng chỉ báo trực quan dưới đất (Ground Hotspots)**
   *Tác động:* Người chơi biết chính xác điểm cần đứng để tương tác, không còn chạy quanh chân tường tìm chỗ bấm E.
8. **ISSUE-08 (P1): Hợp nhất 2 điểm sửa cầu bờ Tây thành một trạm công tác duy nhất**
   *Tác động:* Chấm dứt tình trạng nhảy loạn xạ giữa Task 1 và Task 2 khi đứng ở đầu cầu.
9. **ISSUE-09 (P2): Hiệu ứng chữ nổi nhận điểm (+ĐIỂM) và phản ứng của người dân**
   *Tác động:* Tạo cảm giác thành tựu và phản hồi thị giác tức thì sau mỗi công tác xã hội hoàn thành.
10. **ISSUE-11 (P2): Hệ thống Ping nhanh vị trí trên bản đồ cho đồng đội**
    *Tác động:* Thúc đẩy khả năng giao tiếp và cộng tác thực chất trong kịch bản nhiều người chơi cùng phòng.
