# 🍳 Home Kitchen - Feature Summary

This document provides a comprehensive summary of all existing features, files, and architectural designs in the **Home Kitchen** project. Only features and structures that currently exist in the codebase are documented here.

---

## 🏛️ Project Architecture Overview

Home Kitchen is built using a **Three-Tier Architecture** that cleanly separates the client presentation from backend logic and database storage:

1. **Client Tier (Frontend)**: A React-based Single-Page Application (SPA) built with Vite, styled with custom Vanilla CSS variables and layout modules (flexbox/grid), and managed using standard React state hooks (`useState`, `useEffect`, `useRef`).
2. **Business & API Tier (Backend)**: A Spring Boot REST API that handles HTTP routing, service validation, transactional order pipelines, and session administration.
3. **Data Tier (Database)**: A relational MySQL schema accessed via Spring Data JPA and Hibernate for mapping entity classes directly to tables.

---

## 💻 Frontend Client Componentry & Pages (`/frontend/src/`)

### 🧭 Routing & Main Wrapper
*   **[App.jsx](file:///d:/Projects/home-kitchen/frontend/src/App.jsx)**: Defines client-side SPA routes via `react-router-dom`:
    *   `/` points to the customer-facing interface ([CustomerPage.jsx](file:///d:/Projects/home-kitchen/frontend/src/pages/CustomerPage.jsx)).
    *   `/admin` points to the administrative dashboard ([AdminPage.jsx](file:///d:/Projects/home-kitchen/frontend/src/pages/AdminPage.jsx)).
*   **[main.jsx](file:///d:/Projects/home-kitchen/frontend/src/main.jsx)**: Mounts the React application tree inside `index.html`.
*   **[index.css](file:///d:/Projects/home-kitchen/frontend/src/index.css)**: Implements base styles, global resets, CSS variables, and core theme properties.

---

### 🛒 Customer-Facing Portal
*   **[CustomerPage.jsx](file:///d:/Projects/home-kitchen/frontend/src/pages/CustomerPage.jsx)** (Styled by **[App.css](file:///d:/Projects/home-kitchen/frontend/src/App.css)**):
    *   **Categorized Menu Grid**: Groups active menu items by category with visual pill-filters (each with custom emojis: 🌯 for rolls, 🍛 for meals, etc.) and auto-scroll logic (`scrollIntoView`).
    *   **Menu Items**: Displays title, description, and status. It supports:
        *   **Standard Items**: Base price listing with standard increment/decrement buttons.
        *   **Customizable Items**: Items with custom portion/size variants (e.g., Half/Full) that open an in-app overlay.
        *   **Availability Badges**: Automatically handles styling and blocks interaction for items flagged as unavailable ("Sold Out").
    *   **Customization Modal**: A radio-selectable overlay letting customers pick a specific portion variant, updating prices in real-time before item addition.
    *   **Shopping Cart Drawer**: A slide-out panel summarizing the order:
        *   Lists selected items, portion types, quantities, and individual subtotals.
        *   Validates customer details (Contact Name and Phone number fields).
        *   Sends placed orders synchronously to the server.
    *   **Persistent Sticky Cart Bar**: A bottom-anchored preview bar displaying current item count and cart total, providing a fast route to checkout.
    *   **Order Completion Splash**: Triggers a success modal showing the chronological daily token ID (e.g. `#1`, `#2`) to collect the meal when ready.

---

### 🔒 Administrative Console
*   **[AdminPage.jsx](file:///d:/Projects/home-kitchen/frontend/src/pages/AdminPage.jsx)** (Styled by **[Admin.css](file:///d:/Projects/home-kitchen/frontend/src/Admin.css)**):
    *   **Credential Login Gate**: Prevents unauthorized access. Authenticates against the backend login endpoint and sets a local session flag (`adminLoggedIn` in `localStorage`) to persist state on refresh.
    *   **Tabbed Navigation**: Swaps between two primary panels:
        1.  **🍕 Menu Management Tab**:
            *   **Create Food Items**: Form to input name, category, optional description, availability, and pricing. Checkbox toggles between standard pricing and multiple variant entries (each variant has a label and price).
            *   **Edit Existing Items**: Modifies item details (name, category, description, base price, and availability flag) inline.
            *   **Delete Items**: Removes food listings from the database.
        2.  **📋 Orders Console Tab**:
            *   **Date-Based Calendar Filter**: Filters orders by day (defaults to current date) to review specific day analytics.
            *   **Day Insights**: Real-time counter showing:
                *   Total orders placed.
                *   Total revenue generated (sum of active orders).
                *   Total pending/preparing status counts.
            *   **Live Orders Board**: Lists orders with customer details (phone, name), checkout time, list of purchased foods (including variant configurations), and status badges. Automatically refreshes every 15 seconds.
            *   **Status Workflow Buttons**: Transition orders sequentially: `PENDING` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`.
            *   **Order Management Actions**: Individual deletion of records, mass deletion of completed orders (`COMPLETED` status), and a "Clear All" wipe utility.

---

## ⚙️ Backend REST Engine (`/backend/src/main/java/com/homekitchen/backend/`)

### 🌐 Controller Handlers (REST Endpoints)
*   **[AuthController.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/controller/AuthController.java)**:
    *   `POST /auth/login`: Authenticates incoming JSON credentials (`username`, `password`) against preconfigured credentials (`admin` / `admin123`).
*   **[HomeController.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/controller/HomeController.java)**:
    *   `GET /foods`: Fetches the entire food catalog.
    *   `GET /foods/category/{category}`: Returns items matching a specified category.
    *   `POST /foods`: Creates a new food item with validation.
    *   `PUT /foods/{id}`: Updates existing food items.
    *   `DELETE /foods/{id}`: Deletes a food item by database ID.
*   **[OrderController.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/controller/OrderController.java)**:
    *   `POST /orders`: Places and persists a new order.
    *   `GET /orders`: Returns all recorded orders.
    *   `PATCH /orders/{id}/status`: Updates status flags (e.g. `PENDING` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
    *   `DELETE /orders/{id}`: Deletes a specific order.
    *   `DELETE /orders/completed`: Clears completed orders (`COMPLETED` status).
    *   `DELETE /orders`: Purges all order database entries.

---

### 🧱 Entity Models (ORM Layers)
*   **[FoodItem.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/model/FoodItem.java)**: Maps `food_item` table. Has properties: `id`, `name`, nullable `basePrice` (for non-variant items), `category`, `available` flag, `description`, and a cascading one-to-many relationship with `FoodVariant`.
*   **[FoodVariant.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/model/FoodVariant.java)**: Maps `food_variant` table. Defines portions/options for a parent item. Contains: `id`, `label` (e.g. 'Half', 'Full'), `price`, `available` flag, and a lazy-fetched reverse reference (`@JsonBackReference`) to `FoodItem`.
*   **[Order.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/model/Order.java)**: Maps `orders` table. Tracks `id`, `customerName`, `customerPhone`, `totalPrice`, `status` (`PENDING`, `PREPARING`, `READY`, `COMPLETED`), chronological timestamp `createdAt`, a generated `dailyNumber` sequence token, and a cascading list of order items.
*   **[OrderItem.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/model/OrderItem.java)**: Maps `order_item` table. Serves as a checkout ledger. Houses references to the parent `Order`, the `FoodItem`, and the chosen `FoodVariant` (nullable). Crucially stores a `price` snapshot field representing the purchase-time price.

---

### 🧪 Services & Business Logic
*   **[FoodService.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/service/FoodService.java)**:
    *   Validates item inputs (names cannot be empty, prices cannot be negative).
    *   Enforces structure integrity: items must have either a base price or variants, but never both (variants set the base price to `null`).
    *   Manages database CRUD wrappers.
*   **[OrderService.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/service/OrderService.java)**:
    *   Applies a default `PENDING` status upon placement.
    *   Computes overall `totalPrice` dynamically by multiplying child item prices and quantities.
    *   Generates a daily sequence token (`dailyNumber`): counts items created between today's start and end timestamps and increments the count by 1.
    *   Handles status transitions and completion deletions.

---

### 🛡️ Repositories, Exceptions & DTOs
*   **Repositories**: Direct query wrappers extending `JpaRepository`:
    *   [FoodItemRepository.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/repository/FoodItemRepository.java): Includes custom finder `findByCategory(String category)`.
    *   [OrderRepository.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/repository/OrderRepository.java): Tracks daily counts with `countByCreatedAtBetween(LocalDateTime start, LocalDateTime end)`.
    *   [OrderItemRepository.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/repository/OrderItemRepository.java).
*   **Exceptions**:
    *   [FoodException.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/exception/FoodException.java): Custom runtime error representation.
    *   [GlobalExceptionHandler.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/exception/GlobalExceptionHandler.java): Uses `@ControllerAdvice` to intercept exceptions (like `FoodException`) and returns standardized error payloads using [ApiResponse.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/dto/ApiResponse.java).
*   **DTOs**:
    *   [ApiResponse.java](file:///d:/Projects/home-kitchen/backend/src/main/java/com/homekitchen/backend/dto/ApiResponse.java): Common payload wrapper containing `success` boolean status and a text `message`.
