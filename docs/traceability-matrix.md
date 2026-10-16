# Requirements traceability matrix

| Requirement | Web surface | API surface | Verification |
| --- | --- | --- | --- |
| [REQ-001](requirements/requirements.md#brewlite-functional-requirements) Browse products | `apps/web/app/page.tsx` | `apps/api/src/products/` | API unit/integration coverage |
| REQ-002 View product details | `apps/web/app/products/[id]/page.tsx` | `apps/api/src/products/` | API unit/integration coverage |
| REQ-003 Select options and manage cart | `apps/web/app/products/[id]/page.tsx`, `apps/web/app/cart/page.tsx` | — | Manual web flow |
| REQ-004 Register and sign in | `apps/web/app/login/page.tsx` | `apps/api/src/auth/` | API unit/integration coverage |
| REQ-005 Create and view orders | `apps/web/app/orders/page.tsx` | `apps/api/src/orders/` | API unit/integration coverage |
| REQ-006 Simulated payment | Web checkout flow | `apps/api/src/payments/` | API unit/integration coverage |
| REQ-007 Order confirmation | `apps/web/app/orders/page.tsx` | `apps/api/src/orders/` | Manual web flow |

The current root end-to-end suite is in `tests/e2e/`; additional behavioral
coverage should be added as acceptance criteria are finalized.
