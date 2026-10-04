# TASK_CURRENT — Hoàn thiện Implementation Màn chơi Hà Tĩnh

Đối chiếu repository ngày **04/10/2026**. Đọc **AGENTS.md → phần hiện hành của docs/PROJECT_STATUS.md → file này**. Current code là source of truth.

---

## 1. Mục tiêu và Trạng thái

- **Nhiệm vụ:** Đọc gói thiết kế Hà Tĩnh trong `source/HATINH_GAMEPLAY_REDESIGN/` và triển khai HOÀN CHỈNH màn chơi Hà Tĩnh với gameplay multiplayer sâu sắc, 3 khu vực với identity rõ ràng, server-authoritative logic, dynamic team roles, countdown day-to-dusk, và bảo toàn 100% 6 tỉnh thành còn lại.
- **Trạng thái:** **HOÀN THÀNH TOÀN DIỆN (FULL IMPLEMENTATION & ALL TESTS PASS)**.
- **Kết quả kiểm thử:**
  - `npm test`: **103/103 tests PASS (8 test suites)**, bao gồm suite mới `hatinhGameplay.test.ts` (7 tests).
  - `npm run typecheck`: **PASS 0 errors** trên cả 3 workspaces (`shared`, `server`, `client`).
  - `npm run build`: **PASS** biên dịch hoàn tất toàn bộ `shared`, `server`, và `client` (Vite production bundle).

---

## 2. Chi tiết 3 Nhiệm vụ tại Hà Tĩnh

### Quest 1: Lửa Đỏ Tuyến Vũng Áng (Tối đa 30 điểm)
- **Bối cảnh & Cảm giác:** Cảng biển công nghiệp, container, đoàn xe tải nặng, luồng kiểm tra tải trọng, đá dăm rơi vãi.
- **Gameplay trong world:**
  - Tiếp nhận phản ánh từ công nhân Tuấn tại `WORKER_TUAN` (+3đ).
  - Triển khai camera tự động giám sát luồng xe cảng tại `CAMERA` (+4đ).
  - Thu dọn vật liệu đá dăm rơi vãi trên mặt đường tại `SPILL` (+4đ).
  - Phân luồng xe tải nặng vào làn kiểm tra tại `TRAFFIC_VA` (+4đ).
  - Vận hành trạm cân kiểm tra tải trọng (phát hiện vượt 45%) tại `WEIGH_STATION` (+4đ).
  - Phối hợp cùng đ/c Bàng kiểm định phương tiện và giấy tờ tại `INSPECTION_BANG` (+4đ).
  - Lập biên bản vi phạm hành chính, cam kết hạ tải tại `INSPECTION_BANG` (+3đ).
  - Làm việc với ông Doãn (đại diện chủ hàng / doanh nghiệp) tại `DOSSIER_DOAN` (+2đ).
  - Mở lại tuyến đường an toàn cho cảng biển tại `TRAFFIC_VA` (+2đ).
- **Ràng buộc server:** Phải tiếp nhận phản ánh trước khi dọn đá / đặt camera / phân luồng; phải cân trước khi kiểm định; phải lập biên bản trước khi làm việc doanh nghiệp; phải xong cả camera, dọn đá và làm việc chủ hàng mới được mở lại tuyến đường.

### Quest 2: Mây Trắng Đèo Ngang (Tối đa 35 điểm) — Special Team-Wide Rescue Event
- **Bối cảnh & Cảm giác:** Đèo núi hiểm trở, sương mù dày đặc, vực sâu, xe cứu hộ, đèn pha công suất cao, tời cơ khí (winch), điểm neo cáp.
- **Flow sự kiện toàn đội:**
  - Kích hoạt cảnh báo khẩn cấp tại `DEO_GATHER` (+2đ).
  - Toàn đội tập kết tại Trạm chỉ huy cứu hộ (`RESCUE_STAGING`).
  - Ready check: người chơi nhấn Sẵn sàng (Ready) (+2đ).
  - Đếm ngược ngắn 3-2-1 với chuyển biến môi trường: Day → Late Afternoon → Dusk.
  - Sương mù (fog overlay) + ánh sáng cứu nạn (rescue lights) + chuyển sang `rescue-scene.webp`.
- **Phân công vai trò động (Dynamic Team Roles - 4, 5, 6, 7 người hoặc solo assisted):**
  - Traffic Control Bắc tại `RESCUE_TRAFFIC_A` (+2đ).
  - Traffic Control Nam tại `RESCUE_TRAFFIC_B` (+2đ).
  - Technical Zone tại `RESCUE_TECH`: Bật đèn mặt đường (+2đ) → Rọi đèn xuống vực (+2đ) → Đóng điểm neo chịu lực Anchor (+2đ) → Thả dây cứu nạn Rope (+2đ).
  - Chuẩn bị tời cứu nạn tại `RESCUE_WINCH` (+2đ).
  - **Dependency kiểm soát bởi Server:** Phải xong chốt A + chốt B + 2 đèn + neo + dây + tời mới cho phép cứu nạn viên đu dây xuống vực (`DG_DESCEND_RESCUER`) (+2đ).
  - Dưới vực sâu tại `RESCUE_NAM`: Trấn an nạn nhân Nam (+2đ) → Ngắt khóa điện & van xăng xe máy tránh cháy nổ (+2đ) → Sơ cứu băng ép vết thương (+2đ) → Cố định nẹp đùi & đeo đai an toàn (+2đ) → Phát tín hiệu sẵn sàng kéo tời (+1đ).
  - Chuẩn bị cáng tại trạm y tế `RESCUE_MEDICAL` (+2đ).
  - Vận hành tời nâng cáng lên mặt đường tại `RESCUE_WINCH` (+2đ).
  - Bàn giao Nam cho đội ngũ y tế tại `RESCUE_MEDICAL` (+2đ).
  - Kéo cứu nạn viên lên an toàn (+1đ) & Trục vớt xe máy khỏi lòng vực (+1đ) → Kết thúc chiến dịch với 35/35 điểm.

### Quest 3: Nén Hương Trước Chuông Đồng (Tối đa 35 điểm)
- **Bối cảnh & Cảm giác:** Khu di tích lịch sử Ngã ba Đồng Lộc, không gian trang nghiêm, văn minh, đón tiếp cựu chiến binh và du khách.
- **Gameplay 3 nhánh song song:**
  - Gặp Bác Tùng (Ban Quản lý) tại `DONG_LOC_TUNG` tiếp nhận nhiệm vụ (+3đ).
  - *Nhánh 1 (Trật tự văn hóa):* Nhắc nhở và thu ấn phẩm mê tín của Mụ Sáu tại `DONG_LOC_SAU` (+4đ) + Lập biên bản xử lý Tèo đổi tiền lẻ 30% trái phép tại `DONG_LOC_TEO` (+4đ) → Bàn giao tang vật cho Bác Tùng tại `DONG_LOC_TUNG` (+4đ).
  - *Nhánh 2 (Luồng viếng & Hương hoa):* Phân luồng lối đi một chiều tại `DONG_LOC_FLOW` (+4đ) + Hỗ trợ Bác Hải đón đoàn cựu chiến binh tại `DONG_LOC_HAI` (+4đ) + Cung cấp hương hoa miễn phí tại bàn thờ di tích `DONG_LOC_ALTAR` (+4đ).
  - *Nhánh 3 (Thông tin đúng đắn):* Chấn chỉnh TikToker livestream sai lệch lịch sử tại `DONG_LOC_TIKTOKER` (+4đ).
  - *Tổng kết:* Báo cáo hoàn thành toàn bộ nhiệm vụ tại `DONG_LOC_TUNG` (+4đ) → Đạt 35/35 điểm, hoàn tất trận đấu với tổng điểm 100/100, chuyển sang `RESULTS`.

---

## 3. Các file đã triển khai và chỉnh sửa

1. **Asset Pipeline & Images:**
   - Xóa sạch banner văn bản trên cả `docs/art-source/regions/ha-tinh/clean-scene.png` và `rescue-scene.png`.
   - Sinh tự động `scene.webp`, `rescue-scene.webp`, `minimap.webp`, `rescue-minimap.webp`, `icon.webp`.
   - `scripts/prepare-regions.py`: Đăng ký toàn bộ 19 POI đặc thù của Hà Tĩnh vào dữ liệu sinh `regionalMapData.ts` và `regionalLayers.ts`.
   - `scripts/collision-layout.json`: Định nghĩa đầy đủ groundAreas, bờ kè cảng biển, vực đèo, footprint công trình, đảm bảo 100% POI thông suốt, không đi xuyên vật thể vô lý và không kẹt tàng hình.
2. **Shared Data & Types:**
   - `shared/src/types.ts`: Bổ sung `HatinhState`, thêm `hatinhState?: HatinhState` vào `GameSnapshot`, thêm `'HATINH_ACTION'` vào `ClientIntent`.
   - `shared/src/interactions.ts`: Hàm `addHatinhActions` cấp phát đầy đủ hành động ngữ cảnh E cho từng POI theo đúng tiến độ nhiệm vụ; hỗ trợ cả lều clinic khi plan committed cho test fixture.
   - `shared/src/missionGuide.ts`: Cung cấp la bàn, hướng dẫn chi tiết và checklist động trên HUD cho cả 3 nhiệm vụ Hà Tĩnh.
3. **Server Engine (`server/src/gameEngine.ts`):**
   - Khởi tạo `hatinhState` khi `mapId === 'ha-tinh'`.
   - Xử lý intent `HATINH_ACTION` với server validation toàn diện (kiểm tra cự ly, trạng thái, phụ thuộc, phân quyền).
   - Ticking đồng hồ đếm ngược cứu hộ 3-2-1 và chuyển biến môi trường day → afternoon → dusk.
   - Đồng bộ điểm số chặt chẽ: `score.va` (30đ), `score.dg` (35đ), `score.dl` (35đ), tổng 100đ, map trực tiếp sang `m1, m2, m3` để tương thích toàn bộ HUD, bảng tin, màn hình kết quả hiện có.
4. **Client & UI:**
   - `client/src/game/regionalScene.ts`: Preload và chuyển đổi giữa `scene.webp` và `rescue-scene.webp`; tạo dusk tint và fog overlay động; hiển thị hệ thống nhân vật NPC đặc thù của Hà Tĩnh (Anh Tuấn, Đ/c Bàng, Ông Doãn, Chỉ huy cứu hộ, Nạn nhân Nam, Bác Tùng, Mụ Sáu, Tèo, Bác Hải, TikToker).
   - `client/src/ui/hudView.ts`: Tự động tráo đổi minimap Đèo Ngang (`rescue-minimap.webp`) trong sự kiện cứu nạn; vẽ chấm chỉ báo trạng thái nhiệm vụ cho các POI Hà Tĩnh.
5. **Testing Suite:**
   - `server/src/__tests__/hatinhGameplay.test.ts`: 7 bài test chuyên biệt kiểm tra solo, multiplayer 4 người, kiểm tra an toàn đèo núi, phân luồng cảng biển, xử lý văn hóa Đồng Lộc, disconnect/reconnect và độ ổn định receipt.

---

## 4. Bằng chứng nghiệm thu

- `npm test`: **8/8 suites passed (103/103 tests passed)**:
  - `hanoiSolo.test.ts` (2 tests, PASS)
  - `inputInteraction.test.ts` (7 tests, PASS)
  - `hatinhGameplay.test.ts` (7 tests, PASS)
  - `gameEngine.test.ts` (13 tests, PASS)
  - `hanoiMap.test.ts` (7 tests, PASS)
  - `collisionLayout.test.ts` (27 tests, PASS)
  - `regionalMaps.test.ts` (30 tests, PASS)
  - `movement.test.ts` (10 tests, PASS)
- `npm run typecheck`: **0 errors** trên toàn bộ `shared`, `server`, `client`.
- `npm run build`: **0 errors** trên toàn bộ 3 workspaces.
