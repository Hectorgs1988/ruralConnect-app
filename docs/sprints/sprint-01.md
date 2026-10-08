# Sprint 1 — Caja Product Catalog Foundation
## Sprint status
COMPLETED

## Sprint objective

Establish the backend foundation for a shared, database-managed Caja Susinos
product catalog in Rural Connect. Keep Caja products separate from Despensa,
use Rural Connect authentication and authorization, and provide a reliable
automated test baseline for the catalog work.

## Scope

- Record the approved Caja product and API contract.
- Stabilize backend test discovery so source tests run predictably.
- Add an additive Prisma model and migration for Caja products.
- Seed the catalog from `legacy/CajaSusinos/public/products.json` only.
- Add authenticated read and admin-only catalog management endpoints.
- Add automated backend coverage for catalog behavior, validation, and access.
- Treat Caja Susinos as reference only; no runtime dependency on the legacy app.

## Ordered tasks

### S1-01 — Recording the approved Caja catalog contract

- **Objective:** Document the confirmed product fields, category values, price
  representation, stable IDs, API access rules, and deactivation semantics so
  model, seed, and endpoint work share one contract.
- **Responsible agent:** architect
- **Dependencies:** None
- **Affected areas:** `docs/sprints/sprint-01.md`; contract decisions for
  `Server/prisma` and `Server/src`
- **Acceptance criteria:**
  - The contract includes `id`, `name`, `category`, `priceCents`, `active`,
    `createdAt`, and `updatedAt`.
  - Categories are `BEBIDA` and `COMIDA`; prices are integer cents.
  - Stable product IDs are retained from the selected JSON catalog.
  - Authenticated users may read; only `ADMIN` may create, edit, or deactivate.
  - Deactivation is used instead of hard deletion.
  - The contract does not reuse the Despensa product model.
- **Status:** DONE

### S1-02 — Stabilizing backend test discovery

- **Objective:** Ensure the backend test command discovers and runs intended
  source tests, excluding stale compiled output.
- **Responsible agent:** backend
- **Dependencies:** None
- **Affected areas:** `Server/vitest.config.ts`; backend test command/discovery
- **Acceptance criteria:**
  - The backend test command discovers intended source tests only.
  - Stale compiled tests under `dist` are not run as source tests.
  - Existing source-test failures remain visible and are not suppressed.
  - The unchanged source test baseline is reported.
- **Status:** DONE

### S1-03 — Adding the Caja product database model

- **Objective:** Store Caja catalog products in their own Prisma model and add
  the corresponding additive database migration.
- **Responsible agent:** backend
- **Dependencies:** S1-01
- **Affected areas:** `Server/prisma/schema.prisma`,
  `Server/prisma/migrations/`
- **Acceptance criteria:**
  - A separate `CajaProduct` model implements the approved contract.
  - Category values are constrained to `BEBIDA` and `COMIDA`.
  - `priceCents` is an integer and `active` supports deactivation.
  - The migration is additive and does not change or remove Despensa models.
  - Prisma client generation and schema validation succeed.
- **Status:** DONE

### S1-04 — Seeding the approved Caja catalog

- **Objective:** Import the current JSON catalog into the database through a
  repeatable seed process, preserving stable IDs.
- **Responsible agent:** backend, with migration agent confirming source data
- **Dependencies:** S1-03
- **Affected areas:** `Server/src/scripts/` and seed configuration;
  reference source `legacy/CajaSusinos/public/products.json`
- **Acceptance criteria:**
  - The seed source is only `public/products.json`; fallback-only products
    from `src/App.jsx` are not imported.
  - Product IDs and categories are preserved/mapped to the approved schema.
  - Prices are converted exactly to integer cents; `refresco` and `zumo` are
    each seeded at 180 cents.
  - Re-running the seed does not create duplicate products or overwrite
    administrator changes unexpectedly.
  - The Rural Connect runtime does not depend on the legacy project.
- **Status:** DONE

### S1-05 — Exposing the Caja catalog read API

- **Objective:** Provide the active Caja products required by the cashier UI to
  authenticated Rural Connect users.
- **Responsible agent:** backend
- **Dependencies:** S1-01, S1-03
- **Affected areas:** `Server/src/routes/`, `Server/src/routes/index.ts`,
  `Server/src/schemas/` as needed
- **Acceptance criteria:**
  - An authenticated user can list active Caja products through the agreed API.
  - The response contains the agreed catalog fields and a deterministic order.
  - Requests without valid Rural Connect authentication are rejected.
  - Inactive products are not presented as available catalog items.
  - Existing Despensa endpoints and behavior remain unchanged.
- **Status:** DONE

### S1-06 — Adding admin Caja catalog operations

- **Objective:** Enable authorized administrators to create, edit, and
  deactivate Caja products through the shared backend.
- **Responsible agent:** backend
- **Dependencies:** S1-01, S1-03
- **Affected areas:** Caja routes and schemas under `Server/src/`
- **Acceptance criteria:**
  - Create and edit requests validate required fields and integer-cent prices.
  - Only authenticated `ADMIN` users can create, edit, or deactivate products.
  - Authenticated non-admin users are denied write operations; unauthenticated
    requests are rejected.
  - Deactivation preserves the row; no hard-delete operation is exposed.
  - Invalid category, price, and malformed input are rejected with appropriate client errors.
- **Status:** DONE

### S1-07 — Testing the Caja catalog API

- **Objective:** Verify catalog response, persistence-facing operations,
  validation, and authorization using backend automated tests.
- **Responsible agent:** tester, coordinated with backend
- **Dependencies:** S1-02, S1-04, S1-05, S1-06
- **Affected areas:** `Server/src/__tests__/`; backend Vitest configuration
- **Acceptance criteria:**
  - Tests cover authenticated listing, inactive-product filtering, and response
    shape.
  - Tests cover admin create/edit/deactivate and reject non-admin or missing
    authentication.
  - Tests cover invalid payloads and category/price validation.
  - Seed behavior is verified as repeatable and includes only the approved
    JSON source products, with the confirmed `refresco` and `zumo` prices.
  - The backend test command completes successfully with the intended tests.
  - Verify active filtering and deterministic multi-product ordering with integration-level coverage where practical.
  **Additional coverage for S1-07:**
- Verify 401 and 403 behavior independently for create, edit and deactivate operations.
- Exercise duplicate-ID 409 behavior.
- Exercise missing-product 404 behavior for edit and deactivate.
- Add database-backed integration coverage where practical.
- **Status:** DONE

## Decisions already approved

- `CajaProduct` is a separate domain model from Despensa.
- Product IDs are stable.
- The model includes at least `id`, `name`, `category`, `priceCents`, `active`,
  `createdAt`, and `updatedAt`.
- Initial categories are `BEBIDA` and `COMIDA`.
- Prices are stored as integer cents.
- Product removal uses deactivation, not hard deletion.
- Rural Connect authentication is reused.
- Authenticated users may read the Caja catalog.
- Only `ADMIN` users may create, edit, or deactivate Caja products.
- The seed source is `legacy/CajaSusinos/public/products.json`.
- Fallback-only products from `legacy/CajaSusinos/src/App.jsx` are not
  automatically imported.
- `refresco` and `zumo` use 180 cents in the initial seed.
- Direct access to Caja must use Rural Connect authentication.

## Risks / notes

- Keep `CajaProduct` independent from Despensa's stock, purchase, and inventory
  semantics.
- Do not add a legacy runtime import or dependency; use the JSON file as a
  migration-time reference only.
- Keep the seed idempotent without resetting product data an administrator may
  have edited.
- Ensure prices are converted without floating-point rounding errors.
- Direct Caja access still requires Rural Connect authentication; this sprint
  establishes backend auth for catalog requests but does not implement the
  direct-access UI/session flow.
- Backend test discovery must be reliable before test results are used as a
  release signal.
- API validation must reject negative priceCents values.
- Verify seed rerun behavior against a safe development database before operational use.
- Database-backed integration tests are still pending for Caja catalog filtering, persistence, duplicate handling, and seed rerun behavior.

## Out-of-scope items

- Caja cashier/calculator frontend and cart behavior.
- Voucher conversion/calculation migration.
- Caja admin product-management UI.
- Order/comanda model, registration, and history.
- Rural Connect navigation or direct-access hosting/session integration.
- Payment gateway integration, real-money payments, NFC, wristbands/cards,
  wallet/balance, QR payments, and online top-up.
- Changes to the legacy Caja Susinos application.
