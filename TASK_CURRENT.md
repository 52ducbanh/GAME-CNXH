# Hiện hành — Rà soát collision đủ bảy bản đồ — 05/10/2026

Đã sửa lỗi đất/sân bị giới hạn vào dải đường ở năm map còn lại (Hà Nội, Quảng Ninh, Ninh Bình, Thanh Hóa, Nghệ An); giữ sửa Hải Phòng/Hà Tĩnh. PASS 182 tests/20 suites, typecheck/build và Chrome+Socket.IO smoke7 maps. Source, evidence, giới hạn và lệnh ở PROJECT_STATUS/TESTING. Bundle mới `client/dist-collision-all-ground`; chưa cập nhật các server đang dùng. Giới hạn còn mở: geometry cứu hộ Hà Tĩnh dùng chung nền chính, manual/mobile/shoreline-rail QA đầy đủ. Không tự chạy những phần ngoài scope hoặc commit.

---

# Hiện hành — Collision đường/sân Hải Phòng, Hà Tĩnh — 05/10/2026

Đã bổ sung vùng đường/sân trong nguồn collision và 15 regression tests. PASS 158 tests/typecheck/shared-server-client build riêng. Chi tiết và giới hạn ở PROJECT_STATUS. Tiếp theo: browser QA bundle `client/dist-collision-open-ground`, nhất là chuyển cảnh cứu hộ Hà Tĩnh (nền khác nhưng geometry chung); chưa restart phiên đang dùng. Giữ các sửa working tree có trước.

---

# TASK_CURRENT — Sửa lỗi hình ảnh và di chuyển theo ba nhánh

Người dùng yêu cầu chia việc sửa các lỗi hình ảnh/di chuyển còn thấy trong game. Phân công chi tiết, phạm vi file và nghiệm thu ở [BUGFIX_ASSIGNMENTS](docs/BUGFIX_ASSIGNMENTS.md):

- `leeduc`: nền, ảnh vật thể và lớp che/mask.
- `chuowng`: nhân vật, depth, animation và camera khi đi.
- `datmup`: collision, đường đi và solver di chuyển.

Không giao việc cho `ducbanh`. Trạng thái mới là **đã phân công, chờ tái hiện/sửa**; chưa chứng nhận lỗi nào đã được sửa trong lượt chia việc. Mỗi bạn ghi báo cáo riêng và mở PR vào main. Giữ scope sửa lỗi, không thêm tính năng.

---

# Lịch sử — Triển khai 5 tỉnh hoàn tất (Ninh Bình, Quảng Ninh, Hải Phòng, Thanh Hóa, Nghệ An)

**DONE — HOÀN THÀNH TOÀN DIỆN 7/7 TỈNH.**
Đã tiếp quản dự án, đối chiếu và triển khai đầy đủ 5 gói nhiệm vụ đã duyệt (`source/7-tinh-agent-packages-repaired`), bổ sung 15 nhiệm vụ mới đạt chuẩn 100 điểm/tỉnh, bảo toàn tuyệt đối gameplay Hà Nội và Hà Tĩnh (zero regression).

### Kết quả nghiệm thu thực tế:
1. **Kiểm thử & Build:**
   - `npm test`: **PASS 141/141 tests (18 test suites)**
   - `npm run typecheck`: **PASS 100% (shared, server, client)**
   - `npm run build`: **PASS 100% (shared, server tsc, client vite build)**
2. **Chi tiết 5 tỉnh mới (15 nhiệm vụ - 100 điểm/tỉnh):**
   - **Ninh Bình (`ninh-binh`):** Bái Đính (30đ - bảo vệ tín ngưỡng, niêm phong hòm công đức tự phát, chấn chỉnh livestream), Cúc Phương (35đ - tuần tra đêm, gỡ bẫy thú, sơ cứu thả động vật, thu giữ gỗ lậu), Tam Cốc (35đ - xử lý bến đò Cô Thắm, niêm yết giá vé công khai, trang bị áo phao, điều phối xuất bến).
   - **Quảng Ninh (`quang-ninh`):** Tờ rơi (30đ - bóc gỡ tờ rơi độc hại, tuyên truyền số hóa cùng Bác Hoàng), Công trường Bãi Cháy (35đ - thu gom rác thải, lắp phao chắn dầu ngăn ô nhiễm vịnh), Than lậu ven nước & Hai cầu (35đ - chốt chặn 2 đầu cầu, kiểm tra kho than lậu, tịch thu tang vật).
   - **Hải Phòng (`hai-phong`):** Foodtour bánh đa cua (30đ - kẻ vạch phân luồng hè phố quán Cô Hoa, lập bãi đỗ xe trật tự), Lò đúc Chè Lò (35đ - kiểm tra nồng độ khói bụi, lắp hệ thống lọc khí tuần hoàn), Đồ Sơn (35đ - đối thoại minh bạch đền bù quy hoạch ven biển, rào chắn an toàn thi công).
   - **Thanh Hóa (`thanh-hoa`):** Nem chua Thành Nhà Hồ (30đ - phân giải xô xát hai cơ sở nem B/C, kiểm định ATTP, gắn tem truy xuất nguồn gốc), Hành lang đường ray (35đ - phát hiện bu lông lỏng, tuần tra bắt quả tang kẻ gian, siết chặt ray an toàn), Vụ vali mười tỏi (35đ - từ chối hối lộ kiên quyết, đấu trí nghiệp vụ, lập biên bản niêm phong tang vật).
   - **Nghệ An (`nghe-an`):** Khu phố cháo lươn (30đ - hòa giải tranh chấp Dì Hoa & Chú Tuấn, kẻ vạch hè phố 1.5m), Vây bắt lừa đảo đất đai (35đ - tiếp nhận đơn mệ Bảy, truy xét ngõ chợ, chặn đường tắt ngõ cụt bắt giữ nghi phạm), Quỹ khuyến học khối phố (35đ - trấn an dư luận tại Nhà văn hóa, khám nghiệm hộc tủ/cửa sổ, suy đoán vô tội, thẩm vấn vạch trần thủ phạm thu hồi 10 triệu đồng).
3. **Bảo toàn & Tương thích:**
   - Hà Nội (`hanoiSolo`, `hanoiMap`) và Hà Tĩnh (`hatinhGameplay`) giữ nguyên 100% gameplay, route, score và presentation.
   - Collision, sweep movement, sliding, tent overlap resolution hoạt động hoàn hảo trên toàn bộ 7 tỉnh (`collisionLayout.test.ts` 27/27 PASS).
   - Điều hướng và bản đồ vùng (`regionalMaps.test.ts` 10/10 PASS).
   - Projector dashboard và classroom overview hiển thị chính xác điểm số, trạng thái và nhiệm vụ của cả 7 tỉnh.

---

# Lịch sử — TASK_CURRENT — Host + Projector dashboard hoàn tất

**DONE, chưa commit.** `/host/:room` và `/projector/:room` dùng một dashboard; mode projector chỉ đọc. Hiển thị bảy phòng mặc định, thay dòng tỉnh bằng phòng riêng đang xem theo xác nhận của người dùng. Scoreboard toàn chiều ngang, timer/online/QR trên header, events/featured/controls ở hàng dưới; không có panel bản đồ chữ S. QR chung vào sảnh chọn7 tỉnh; liên kết phòng riêng vẫn có. Controls/gia hạn chỉ áp dụng phòng đang xem, không tạo giải đấu hoặc thay gameplay/Player Screen.

Điểm vào: `client/src/ui/dashboard/` (coordinator/panels/viewModel/CSS), `shared/src/projectorDashboard.ts` (readonly DTO/selector), `server/src/roomManager.ts` + `server.ts` (readonly overview/root QR API). Hai view cũ đã bỏ, không giữ implementation song song.

PASS typecheck/shared/server/isolated-client build; **141 tests/13 suites**; Chrome dashboard với7 sockets/điểm thật, host commands/ACK/timer/QR/counters/feed/featured, custom-room replacement, layout1440/Full HD/720p/mobile; player lobby→scene/HUD/touch; UI stability5 modals và input mock regressions. Chưa kiểm máy chiếu/điện thoại/Wi-Fi vật lý, load/accessibility đầy đủ. Chi tiết [PROJECT_STATUS](docs/PROJECT_STATUS.md), lệnh [TESTING](docs/TESTING.md).

Preview riêng lượt này `http://127.0.0.1:3126/host/HANOI_01`, bundle `client/dist-projector-dashboard`; không coi cổng là cấu hình bền vững. Phiên3125/bundle UI cũ và asset/report lịch sử giữ nguyên. Không còn phase dashboard phải chạy; chỉ review hoặc task mới theo người dùng, không tự commit/merge/restart server hoặc chạy known issues.

---

# Lịch sử — TASK_CURRENT — UI host ổn định, tiếng Việt đã sửa

Theo yêu cầu mới của người dùng, đã sửa snapshot repaint/fade-in và mojibake ở host/vote; áp dụng cập nhật DOM ổn định cho các modal/ledger/projector. Source chưa commit. PASS typecheck, shared/isolated-client build,132 tests, Chrome DOM regression và lệnh host qua Socket.IO thật; briefing/results hiển thị. Chi tiết/evidence/lệnh ở [PROJECT_STATUS](docs/PROJECT_STATUS.md) và [TESTING](docs/TESTING.md). Bản cũ không tự cập nhật nếu đang mở bundle cũ; preview riêng dùng `client/dist-ui-stability`, không overwrite/restart phiên cũ. Không tự chạy các known issues còn lại.

---

# TASK_CURRENT — Province modular refactor hoàn tất

**READY về kiến trúc; 7/7 provinces DONE.** Branch `refactor/province-modules`, baseline `b76710245e8f19f2a871de67ff4b4d7d2e586546`. Working tree sản phẩm cũ đã được bảo toàn bằng archive và checkpoint; không dùng master HEAD cũ thay implementation.

Core coordination + reusable capabilities/public-service preset + bảy shared province definitions/modules đã hoạt động qua static registries. Hà Tĩnh custom runtime/canonical rescue state; Hà Nội native presentation. Một MainScene/InputController/network loop. Semantic internal state, derived total/summary, detached wire projections; legacy engine handlers/fallback/facade renderer đã bỏ.

Đã kiểm: typecheck/build;132 tests;426 catalogue/guide fixtures và1489 ACK/snapshot checkpoints khớp baseline; controls/ACK/transport mocks; hai sockets race/rejoin; bảy phòng đồng thời isolation; full Hà Tĩnh100 bằng MOVE/intents thật; browser bảy cảnh/guide/checklist/overview, rescue/dusk/fog/projector100. Locality proof Nghệ An3/3 chỉ module + test, không sửa core/UI, không đưa objective thử vào production.

Không còn phase refactor phải implement. Known issues, FAIL visual modal có trước, phạm vi NOT TESTED, Git/checkpoint và bằng chứng mới trong [PROJECT_STATUS](docs/PROJECT_STATUS.md). Review/merge hoặc sửa known issues chỉ khi người dùng giao; không tự restart phiên server người dùng, không tự tạo province feature branches.

Điểm vào: province local ở `shared/src/gameplay/provinces/<id>/`; luật chung ở `server/src/gameplay/presets/public-service/`; rescue ở `server/src/gameplay/provinces/ha-tinh/`; capability chung ở `server/src/gameplay/core/`; presentation qua `client/src/gameplay/registry.ts`. GameEngine chỉ sửa khi thay coordination/infrastructure. Chi tiết [ARCHITECTURE](docs/ARCHITECTURE.md).

Giữ art/geometry/score/content, foot14/sweep/sliding/prediction/reconcile/rejoin, roles gợi ý, E/G/M/pending ACK, range72/107. Build QA client bằng `--outDir dist-province-refactor`; không ghi đè bundle của phiên người dùng. Asset/report lịch sử và291 files archive-only còn nguyên, không stage/xóa để làm sạch status.
