Update summary — SSE admin updates and Customer page UI

This branch contains changes to add Server-Sent Events (SSE) notifications for admin when new orders are placed, and frontend integration to use the SSE stream instead of polling.

Files changed

- backend/src/main/java/com/homekitchen/backend/service/OrderService.java
  - Added SSE emitter list, `createEmitter()` and `notifyOrderPlaced()`.
  - `placeOrder()` now notifies connected admin clients after saving an order.

- backend/src/main/java/com/homekitchen/backend/controller/OrderController.java
  - Added `GET /orders/stream` endpoint that produces `text/event-stream` (SSE).

- frontend/src/pages/AdminPage.jsx
  - Replaced polling with an `EventSource` subscription to `/orders/stream`.
  - Added reconnection/backoff logic and a connection status indicator.
  - Fallbacks still fetch the orders list when necessary.

How to test locally

1. Start backend (Maven):

   mvn spring-boot:run

2. Start frontend (Vite):

   npm install
   npm run dev

3. Open the customer page and place an order. Open the admin page; it should receive the `orderPlaced` SSE event and update the orders list without polling.

Next recommended improvements

- Secure the SSE endpoint (JWT / admin-only access).
- Emit `orderUpdated` and `orderDeleted` events when orders change.
- Send compact DTOs (avoid sending JPA entities over SSE).
- Move emitters to Redis or a message broker for multi-instance scaling.

If you want, I will now commit these changes and push them to a new branch named `updates`.