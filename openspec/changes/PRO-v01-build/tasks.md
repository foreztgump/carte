## M4 — @carte/reservations

- [x] f-m4-reservations-manifest — declare the reservations plugin manifest, content-accessible reservation collections, public/admin routes, and core settings.
- [x] f-m4-reservations-capacity — implement atomic capacity decrement helpers, 10-minute reservation holds, and waitUntil-based capacity restoration.
- [x] f-m4-reservations-routes — implement submit, confirm, cancel-by-token, email waitUntil side effects, coarse submit rate limiting, and the reservations Block Kit admin page.
- [x] f-m4-reservations-readtime-slots — compute reservation slots on read from hours, blocks, bookings, and active holds without persisted slot rows.
