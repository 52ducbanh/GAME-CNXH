# Nhân vật, depth, animation và camera — 05/10/2026

Đã sửa source và QA theo nhóm `chuowng` của ảnh người dùng. Baseline tái hiện `704b52b`; nhánh giao bản sửa `chuowng` theo yêu cầu commit/push ngày05/10/2026, chưa mở PR. Gameplay, geometry, atlas/polygon nguồn, server MOVE validation, prediction/reconcile/rejoin, chân14px và InputController được bảo toàn. Commit phân công ownership mới trên remote được giữ khi cập nhật nhánh; không force-push. Lượt push không đổi code hoặc chạy lại toàn bộ test chỉ vì cập nhật Markdown; kết quả QA bên dưới thuộc lượt sửa đã thực chạy.

| Mã | Tái hiện / nguyên nhân | Kết quả |
| --- | --- | --- |
| RENDER-01 | Atlas32×48 do prepare-hanoi-v2 đóng chân ở46; origin1 làm pixel chân nằm2px trên world foot. | `CHARACTER_ORIGIN_Y=46/48` cho player/citizen/doctor cả hai renderer. Frame direction khớp atlas down/left/right/up; không đảo row hay sửa PNG. |
| RENDER-02 | Reconcile/ACK đổi vị trí nhưng local depth chỉ đổi khi có input movement. Fixture correction đưa chân tới y480 nhưng giữ depth≈391 ở bản cũ. | Đồng bộ depth, ground và overlay sau correction và mỗi frame, kể cả đứng yên. Thân/crate sort theo foot-y; shadow/ring ở ground3; tên/job ở overlay3001, hủy cùng actor. |
| RENDER-03 | Fade kiểm crop box theo chân, bỏ sót mép thân và mờ cả góc không giao mask; toàn bộ tên nằm trong container thân nên bị che. | Giao rectangle thân/polygon mask thật, smooth alpha90ms. Hà Nội `(433,440)` canopy alpha1→khoảng0.39; `(298,490)` alpha0.38→1. Nhãn tách khỏi thứ tự vẽ thân. Không thay polygon/crop. |
| RENDER-04 | Peer easing tới snapshot mới theo mỗi frame; moving tính phần dư tới đích; direction lấy snapshot mới dù hình còn vẽ đoạn trước. Baseline ở mốc đo190ms sau dừng vẫn playing=true. | Timeline receipt-time trễ100ms, interpolate đoạn có hạn, không extrapolate. Đến pose cuối: đúng vị trí, playing=false, error0. Reset/rejoin/correction xa/gap>500ms bỏ đoạn cũ. Hướng theo đoạn đang vẽ; animation nhịp theo tốc độ hiển thị. |
| RENDER-05 | Local direction lấy input dù solver đang trượt; walk/sprint cùng timeScale1; diagonal dễ đổi hướng theo trục gần bằng. | Hướng theo actual displacement với hysteresis15%; đứng yên giữ hướng; animation theo actual speed/PLAYER_SPEED. Không thay solver hoặc âm thanh. |
| RENDER-06 | Follow làm tròn scroll và lerp cố định theo frame; pixel lượng tử hóa và đáp ứng phụ thuộc FPS. | Camera giữ scroll thập phân, factor1−exp(−delta/84). Follow offset theo phần màn hình còn sau HUD/controls. 390×844 đặt chân quanh screen-y461.5, offset39.5. M/overview không đóng khi đi. |

## Kiểm tra thực chạy

- `npm ci --no-audit --no-fund`: cài280 packages từ lockfile sau khi sandbox chặn cache; không đổi lockfile. Lần đầu build không chạy do checkout thiếu dependencies; sau cài đã build/typecheck thành công.
- Shared/server build, root typecheck PASS. Client production build riêng `dist-character-qa` PASS; sau sửa offset mobile, client typecheck/build kiểm lại PASS. Vite vẫn cảnh báo bundle>500kB.
- `npm test`: **141/141,18 suites PASS**; gồm route/solver bảy map và deployment/bridge tests. Đây là regression, không thay visual QA.
- `verify-character-motion.mjs`:7 nhóm PASS; chuyển động tuyến tính/dừng chính xác ở30/60/144Hz, direction đoạn đang vẽ, reset/gap/teleport không walk, diagonal/slide/idle và smoothing độc lập FPS.
- `verify-input-controls`, `verify-input-ack`, `verify-input-network`: PASS production bundles với event/transport mocks; pending tới ACK, spam/reject, offline/rejoin/no replay giữ đúng.
- `verify-movement`:2 sockets thật,40 MOVE/0 reject; tree contact, diagonal slide đồng đội nhận đúng vị trí, shore trace, peer pass-through, rejoin giữ ID. Không dùng fixture sửa engine làm chứng nhận mạng.
- Browser in-app: baseline và source mới chạy MainScene/Phaser/atlas thật, fake snapshots10Hz và ACK30ms. Các kịch bản WASD/chéo/sprint/dừng, remote turn/stop/correction, canopy corners; desktop1280×720, mobile390×844 follow/overview. `verify-character-evidence.mjs` assertions trên trace lưu PASS.
- Sáu regional scenes đã tải và smoke tại spawn/hai vị trí fixture: foot baseline0, depth=y, nhãn3001. Trace `<mapId>-smoke.json`; đây không phải QA mọi vật thể của tỉnh. Production player `/play/HANOI_01` với socket thật có scene/HUD/joystick/E/G, Map đổi overview→follow ở390×844, đã nhìn ảnh, không console error ở lượt kiểm.

## Evidence và tái hiện

Evidence ignored trong `client/dist-character-qa/qa/`: before/after-remote.json, before/after-route.json, before/after-occlusion.json, motion/evidence/input-*.json, movement-runtime.json, mobile-camera.json; before/after-canopy.png, after-mobile-follow/overview.png; before-hanoi.webm và after-hanoi.webm. Video quay canvas của fixture trên desktop, không phải video multiplayer/Wi-Fi thật. Hai video chứa cùng chuỗi phím; thời gian recording tổng khác nhau. Đã nhìn ảnh desktop và mobile; chưa kiểm video từng frame.

Script `prepare-character-qa.mjs` sinh `/qa/after/`; `CHARACTER_QA_BASELINE=704b52b` sinh `/qa/before/` bằng đọc Git, không checkout/reset. Đặt `CLIENT_DIST_PATH` đến bundle riêng và PORT/SERVER_PORT cùng cổng trống; lượt này dùng3137. Không coi cổng/room QA là cấu hình bền vững. Chi tiết lệnh ở [TESTING](TESTING.md).

## Giới hạn còn mở

Chưa điện thoại vật lý/hai tay, Wi-Fi jitter/loss, load60 người, playthrough trọn trận hoặc mọi mái/lan can/lều của bảy map trong mọi state. Camera/presentation regression không chứng nhận các lỗi collision hoặc pixel/mask của `datmup`/`leeduc` đã hết. Chưa sửa C11 floor/rail alignment hoặc mọi địa điểm nhìn đi được nhưng geometry chặn. 100ms buffering thêm độ trễ hiển thị peer; khi thiếu snapshot không đoán tiếp qua geometry. Local authority correction vẫn có thể snap nếu server reject; không che lỗi authority bằng cách bỏ reconcile.

Không ghi đè `client/dist` hoặc restart server người dùng, không thay báo cáo/asset lịch sử. Source mới cần được tích hợp/bật bằng bundle mới; tab/bundle cũ không tự nhận sửa.
