# TASK_CURRENT — Refactor gameplay 7 province modules

Architecture đã được duyệt; user cho phép implement và checkpoint commits trên `refactor/province-modules`.

Mục tiêu: core coordination + reusable capabilities/public-service preset + bảy province modules, behavior preserving. Current working tree và baseline `b76710245e8f19f2a871de67ff4b4d7d2e586546` là nguồn thật. Không reset/revert/di chuyển art hoặc làm mất file user.

Đã làm: safety archive/checkpoint; baseline 103 tests; Phase 1 contracts, static shared registry và definitions 7 tỉnh, 9 contract tests PASS. Runtime migration **7/7**, registry/runtime migration và full 125 tests PASS.

Đã extract Phase 2: task/item/vote/resource capabilities và public-service preset qua narrow ports; 14 tests/typecheck/build PASS, chưa đổi production routing.

Đang làm: typed boundary/semantic cleanup và locality proof sau 7/7; client/socket/browser QA và final docs. Core handlers/fallback đã xóa; không coi extraction PASS là toàn bộ task READY.

Giữ geometry foot14/sweep/sliding/prediction, input E/G/M, receipt/ACK/rejoin, score/content/role gợi ý, phase order và range72/107 Hà Tĩnh. Không thay phiên server người dùng. Build client với `--outDir dist-province-refactor`.

Trạng thái và chứng cứ trong [PROJECT_STATUS](docs/PROJECT_STATUS.md); implementation hiện tại quyết định hành vi thật.
