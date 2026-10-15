# BrewLite functional requirements

This initial requirements inventory reflects the functionality currently
documented and implemented in the repository. It is a concise project baseline,
not a replacement for product-owner acceptance criteria.

| ID | Requirement | Current application surface |
| --- | --- | --- |
| REQ-001 | Customers can browse the beverage product menu. | Web menu and `GET /products` API |
| REQ-002 | Customers can view an individual product. | Product page and `GET /products/:id` API |
| REQ-003 | Customers can select product size and toppings and manage a cart. | Web product and cart flows |
| REQ-004 | Customers can register and sign in. | Web login flow and `/auth` API |
| REQ-005 | Authenticated customers can create orders and view their order history. | `/orders` API and web order flow |
| REQ-006 | Customers can complete a simulated cashless payment. | Mock `/payments` API flow |
| REQ-007 | Customers can see order confirmation. | Web order flow |

Detailed business rules, validation constraints, and acceptance criteria should
be refined with the product owner before production release.
