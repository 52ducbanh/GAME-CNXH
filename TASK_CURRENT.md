# TASK_CURRENT — Refactor gameplay 7 province modules

Architecture đã được duyệt; user cho phép implement và checkpoint commits trên `refactor/province-modules`.

Mục tiêu: core coordination + reusable capabilities/public-service preset + bảy province modules, behavior preserving. Current working tree và baseline `b76710245e8f19f2a871de67ff4b4d7d2e586546` là nguồn thật. Không reset/revert/di chuyển art hoặc làm mất file user.

Đã làm: safety archive/checkpoint; baseline 103 tests; Phase 1 contracts, static shared registry và definitions 7 tỉnh, 9 contract tests PASS. Runtime migration **6/7**, sáu tỉnh public-service PASS.

Đã extract Phase 2: task/item/vote/resource capabilities và public-service preset qua narrow ports; 14 tests/typecheck/build PASS, chưa đổi production routing.

Đang làm: migrate Hà Tĩnh; test/review/checkpoint từng province. Xóa legacy fallback sau 7/7, kiểm locality objective Nghệ An chỉ trong test, chạy regression/socket/browser và đồng bộ docs.

Giữ geometry foot14/sweep/sliding/prediction, input E/G/M, receipt/ACK/rejoin, score/content/role gợi ý, phase order và range72/107 Hà Tĩnh. Không thay phiên server người dùng. Build client với `--outDir dist-province-refactor`.

Trạng thái và chứng cứ trong [PROJECT_STATUS](docs/PROJECT_STATUS.md); implementation hiện tại quyết định hành vi thật.
