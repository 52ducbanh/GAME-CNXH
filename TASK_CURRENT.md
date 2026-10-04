# TASK_CURRENT — Province modular refactor hoàn tất

**READY về kiến trúc; 7/7 provinces DONE.** Branch `refactor/province-modules`, baseline `b76710245e8f19f2a871de67ff4b4d7d2e586546`. Working tree sản phẩm cũ đã được bảo toàn bằng archive và checkpoint; không dùng master HEAD cũ thay implementation.

Core coordination + reusable capabilities/public-service preset + bảy shared province definitions/modules đã hoạt động qua static registries. Hà Tĩnh custom runtime/canonical rescue state; Hà Nội native presentation. Một MainScene/InputController/network loop. Semantic internal state, derived total/summary, detached wire projections; legacy engine handlers/fallback/facade renderer đã bỏ.

Đã kiểm: typecheck/build;132 tests;426 catalogue/guide fixtures và1489 ACK/snapshot checkpoints khớp baseline; controls/ACK/transport mocks; hai sockets race/rejoin; bảy phòng đồng thời isolation; full Hà Tĩnh100 bằng MOVE/intents thật; browser bảy cảnh/guide/checklist/overview, rescue/dusk/fog/projector100. Locality proof Nghệ An3/3 chỉ module + test, không sửa core/UI, không đưa objective thử vào production.

Không còn phase refactor phải implement. Known issues, FAIL visual modal có trước, phạm vi NOT TESTED, Git/checkpoint và bằng chứng mới trong [PROJECT_STATUS](docs/PROJECT_STATUS.md). Review/merge hoặc sửa known issues chỉ khi người dùng giao; không tự restart phiên server người dùng, không tự tạo province feature branches.

Điểm vào: province local ở `shared/src/gameplay/provinces/<id>/`; luật chung ở `server/src/gameplay/presets/public-service/`; rescue ở `server/src/gameplay/provinces/ha-tinh/`; capability chung ở `server/src/gameplay/core/`; presentation qua `client/src/gameplay/registry.ts`. GameEngine chỉ sửa khi thay coordination/infrastructure. Chi tiết [ARCHITECTURE](docs/ARCHITECTURE.md).

Giữ art/geometry/score/content, foot14/sweep/sliding/prediction/reconcile/rejoin, roles gợi ý, E/G/M/pending ACK, range72/107. Build QA client bằng `--outDir dist-province-refactor`; không ghi đè bundle của phiên người dùng. Asset/report lịch sử và291 files archive-only còn nguyên, không stage/xóa để làm sạch status.
