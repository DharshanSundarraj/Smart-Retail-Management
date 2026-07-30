# Smart Retail Management System (ZetLan Enterprise Platform)

---

### Project Overview
This repository contains the complete full-stack enterprise retail platform (**ZetLan Smart Retail Management System**) tailored for multi-terminal supermarket operations and customer-facing e-commerce. Developed by **Team 1 (Java Full Stack Developers)**, this application is engineered to handle omnichannel transactional billing, real-time inventory deduction, employee role-based access control (RBAC), and customer loyalty tracking.

It serves as the fully containerized application baseline for cloud automation by **Team 2 (AWS DevOps)** and business intelligence reporting by **Team 3 (Data Analytics)**.

---

### System Architecture & Functional Scope

| Category | Components & Modules | Implementation Highlights |
| :--- | :--- | :--- |
| **Sales & POS Billing** | POS Terminal, Payments, GST, Discounts | 2-Step interactive POS billing, Indian Rupee (`₹`) formatting, configurable GST tax rates, and customer account assignment. |
| **Entity Management** | Customers, Suppliers, Employees, RBAC | Dedicated CRM with loyalty points, supplier directory, and dual-table synchronized role management (`ADMIN`, `MANAGER`, `STAFF`). |
| **Supply Chain** | Inventory, Product Catalog, Purchasing | Real-time stock quantity deduction, dynamic low-stock alerts (`< 10` units), and automated catalog visibility controls. |
| **Security & Auditing** | Authentication, Authorization, JWT, Logs | Stateless JWT session tokens, Spring Security bearer auth, and persistent client-side preference engines. |
| **Frontend Portals** | Admin Dashboard & Customer Storefront | Single-page SPA portals served directly from Spring Boot static resources with zero-scroll responsive layouts. |

---

### Technology Stack

| Domain | Technologies & Tools                                                        |
| :--- |:----------------------------------------------------------------------------|
| **Core Backend** | Java 21, Spring Boot 4.1.0, Spring Security                                 |
| **Data Persistence** | Spring Data JPA, Hibernate, MySQL 8.0, PostgreSQL, Redis Cache              |
| **Frontend Portals** | HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+), FontAwesome 6 |
| **API & Docs** | RESTful APIs, OpenAPI / Swagger UI                                          |
| **DevOps & Testing** | Docker, Docker Compose (v2), Maven, Git, JUnit 5, Mockito                   |

---

### Key Deliverables (Team 1 Completed Scope)

*   **REST APIs:** Complete set of stateless endpoints (`/api/products`, `/api/sales-orders`, `/api/customers`, `/api/suppliers`, `/api/employees`, `/api/auth`) with standardized HTTP status codes and JSON payloads.
*   **Admin Portal (`/admin-portal/index.html`):** Full enterprise management console featuring KPI widgets, inventory CRUD, supplier management, employee access control, and live operations feeds.
*   **Customer Storefront (`/customer-portal/index.html`):** E-commerce shopping portal with live category filtering, shopping cart checkout, and dynamic stock hiding for sold-out items.
*   **Database Schemas:** Enterprise relational schema (`users`, `employees`, `roles`, `products`, `categories`, `customers`, `suppliers`, `sales_orders`, `order_items`) supporting walk-in guest checkouts and account-linked orders.
*   **API Documentation:** Interactive Swagger UI integration live at `/swagger-ui.html` and `/v3/api-docs`.

---

### Quick Start & Docker Execution

The entire full-stack application and MySQL database are containerized using an optimized, lightweight **Java 21 Docker image**.

#### 1. Build and Launch Containers (Recommended)
Make sure your terminal is inside the **`smart-retail-management`** directory and run:

```bash
# Launch MySQL 8.0 and Spring Boot Backend in detached mode
docker compose up --build -d

# Watch live application startup logs
docker compose logs -f zetlan-app