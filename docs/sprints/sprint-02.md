# Sprint 2 — Caja Operational Integration

## Sprint objective

Make Caja Susinos operational end-to-end using the shared Rural Connect
backend while preserving direct user access and the existing calculator,
cart, and voucher experience. Keep the backend and product catalog shared,
remove legacy static product data from the runtime path, and validate the
complete flow before deployment.

## Scope

- Decide and document how the maintained Caja frontend is packaged and
  deployed while preserving a direct Caja entry point and Rural Connect access.
- Reuse Rural Connect authentication for direct Caja access and API requests.
- Connect the Caja frontend to the shared Caja product API.
- Remove runtime reads/imports of the legacy static product JSON and any
  duplicated fallback catalog.
- Preserve calculator, cart, ticket, and voucher behavior.
- Build an administrator product-management UI and connect it to the existing
  Caja catalog write APIs.
- Validate key behavior with automated and end-to-end tests.
- Prepare and validate deployment, including independent Caja access.
- Keep Caja products separate from Despensa products.

## Ordered tasks

### S2-00 — Deciding Caja frontend packaging and direct access

- **Objective:** Resolve the frontend packaging/deployment choice that affects
  routing, authentication handoff, API configuration, and independent access.
- **Responsible agent:** architect
- **Dependencies:** None
- **Affected areas:** `docs/`, Rural Connect frontend structure, Caja frontend
  structure, deployment configuration
- **Acceptance criteria:**
  - The decision records whether Caja remains a separately deployed frontend
    or is integrated into the Rural Connect frontend.
  - Both direct Caja access and entry from Rural Connect are supported by the
    chosen approach.
  - The decision describes how both access paths use the same Rural Connect
    identity, shared backend, and maintained Caja implementation.
  - Any deployment, routing, API-origin, or authentication constraints are
    identified before dependent implementation begins.
- **Status:** DONE

### S2-01 — Integrating Rural Connect authentication for direct Caja access

- **Objective:** Ensure direct users and users entering Caja from Rural Connect
  authenticate with the shared Rural Connect identity.
- **Responsible agent:** frontend, coordinated with backend
- **Dependencies:** S2-00
- **Affected areas:** Caja/Rural Connect frontend authentication and routing;
  shared backend authentication integration
- **Acceptance criteria:**
  - Direct Caja access follows the authentication flow supported by the S2-00
    packaging decision.
  - API requests use the existing Rural Connect authentication mechanism.
  - Unauthenticated users are sent through the supported sign-in flow or
    shown an appropriate access-denied/sign-in state.
  - Authenticated users retain the expected identity/role when moving between
    Rural Connect and Caja.
  - No separate Caja credential store or frontend-only administrator secret
    is introduced.

- **Status:** DONE

### S2-02 — Connecting Caja to the shared product API

- **Objective:** Replace static runtime catalog loading with the authenticated
  shared Caja product API.
- **Responsible agent:** frontend
- **Dependencies:** S2-01; S1-05
- **Affected areas:** Maintained Caja frontend data loading, API client/config,
  runtime product-data references
- **Acceptance criteria:**
  - The cashier catalog is loaded from `GET /api/caja/products`.
  - The frontend uses the authenticated Rural Connect API client/pattern.
  - Runtime imports/fetches of `legacy/CajaSusinos/public/products.json` and
    duplicated fallback product catalogs are removed from the maintained
    runtime path.
  - Loading, empty, and API-error states are presented explicitly; an API
    failure does not silently substitute stale static products.
  - Only products returned as active by the shared API are offered to the
    cashier.

- **Status:** DONE

### S2-03 — Preserving calculator and cart behavior with API products

- **Objective:** Keep the existing cashier workflow and ticket calculations
  working with products loaded from the shared catalog.
- **Responsible agent:** frontend
- **Dependencies:** S2-02
- **Affected areas:** Maintained Caja calculator/cart components and focused
  frontend tests
- **Acceptance criteria:**
  - Users can add products, change quantities, remove items, and clear or
    complete the current ticket as they could before migration.
  - Product names, categories, and displayed prices remain correct.
  - Ticket subtotals and totals use integer-cent values without introducing
    floating-point price drift.
  - Catalog loading/error states do not corrupt or silently recalculate an
    in-progress ticket.
  - No order/comanda persistence is added unless a demonstrated essential
    existing behavior cannot otherwise be preserved.
  - Completing a ticket in Sprint 2 preserves the current local/user-flow behavior
  and does not introduce backend order/comanda persistence.

- **Status:** DONE

### S2-04 — Building the Caja product administration UI

- **Objective:** Provide an administrator-facing interface for viewing and
  managing Caja products.
- **Responsible agent:** frontend
- **Dependencies:** S2-00, S2-01
- **Affected areas:** Maintained Caja/Rural Connect frontend administration
  screens, navigation, and frontend tests
- **Acceptance criteria:**
  - Authorized administrators can reach the Caja product-management screen
  through the supported application entry point.
  - The interface supports the fields and categories in the approved
  `CajaProduct` contract and communicates validation errors accessibly.
  - Non-admin users do not see or use administrative controls; backend
  authorization remains authoritative.
  - The interface distinguishes active and inactive products wherever the
  available API supports it, and does not imply that deactivation deletes a
  product.
  - The admin UI follows Rural Connect design, routing, and accessibility
  conventions.

- **Status:** TODO

### S2-05 — Connecting product administration to the Caja APIs

- **Objective:** Wire create, edit, and deactivate UI actions to the shared
  Caja catalog APIs.
- **Responsible agent:** frontend, coordinated with backend
- **Dependencies:** S2-04; S1-06
- **Affected areas:** Maintained frontend API client and Caja admin UI;
  `Server/src/routes/` only if a required admin read capability is missing
- **Acceptance criteria:**
  - Create, edit, and deactivate actions call the existing Caja endpoints and
    refresh or reconcile UI state from successful API responses.
  - Client validation matches backend rules for stable IDs, category, and
    non-negative integer-cent prices; server errors such as validation,
    conflict, not-found, and forbidden responses are shown clearly.
  - Deactivation uses the soft-deactivation endpoint; the UI exposes no
    hard-delete action.
  - The public active-only catalog remains unchanged.
  - If administrators need to view inactive products and the current API
    cannot provide them, the gap is confirmed with the backend owner and any
    added read capability is admin-authorized and separately tested.

- **Status:** TODO

### S2-06 — Validating voucher behavior after migration

- **Objective:** Preserve the Caja voucher calculation and guidance while the
  catalog and frontend are migrated.
- **Responsible agent:** tester, coordinated with frontend
- **Dependencies:** S2-03
- **Affected areas:** Maintained Caja voucher calculation and focused
  frontend/unit tests
- **Acceptance criteria:**
  - Existing voucher behavior is captured from the legacy reference before
    changes are made and compared with the maintained implementation.
  - The 12 EUR and 24 EUR voucher configurations, denomination breakdown,
    five-cent rounding, partial rows, and displayed guidance remain
    consistent with the established behavior.
  - Automated tests cover the agreed voucher cases, including rounding
    boundaries and any supported partial-row scenarios.
  - Voucher behavior does not depend on the legacy application at runtime.

- **Status:** TODO

### S2-07 — Exercising Caja end-to-end flows

- **Objective:** Verify the integrated cashier, authentication, administration,
  and voucher experience through user-visible flows.
- **Responsible agent:** tester
- **Dependencies:** S2-02, S2-03, S2-05, S2-06
- **Affected areas:** Frontend end-to-end tests, backend API integration, test
  configuration and fixtures
- **Acceptance criteria:**
  - Tests cover direct Caja access and access from Rural Connect with shared
    authentication.
  - Tests cover loading the API catalog, adding products, changing
    quantities, removing items, and checking ticket totals.
  - Tests cover admin create/edit/deactivate flows and verify that
    non-admin/unauthenticated users cannot perform writes.
  - Tests cover the agreed voucher regression cases.
  - Tests verify understandable behavior for catalog/API errors and do not
    depend on a production database or production credentials.
  - Existing Rural Connect regression tests relevant to changed shared
    authentication, navigation, and API behavior pass.

- **Status:** TODO

### S2-08 — Preparing deployment and smoke-testing direct Caja access

- **Objective:** Prepare and validate the operational deployment for both
  direct Caja access and access through Rural Connect.
- **Responsible agent:** backend and frontend, coordinated with tester and
  human approval
- **Dependencies:** S2-00, S2-07
- **Affected areas:** Frontend/backend deployment configuration, environment
  documentation, routing/proxy/CORS configuration as applicable, smoke tests
- **Acceptance criteria:**
  - Required frontend API/auth configuration is documented and contains no
    committed secrets.
  - The deployed frontend can reach the shared Rural Connect backend using
    the approved authentication flow and configured origins/routes.
  - A smoke test verifies direct Caja entry, sign-in, active catalog loading,
    and the Rural Connect entry path in the target environment.
  - The existing `caja-susinos.vercel.app` deployment remains available during
    migration; cutover occurs only after the maintained Rural Connect `/caja`
    implementation passes its agreed validation.
  - If project/domain control permits, configure the existing Caja domain to
    redirect to the canonical Rural Connect `/caja` URL without resuming
    product development in the frozen legacy repository.
  - Administrative writes are smoke-tested only with an authorized test
    account and an approved safe environment.
  - Deployment and rollback/recovery steps are documented; no unapproved
    production database writes are performed.

- **Status:** TODO

## Approved architectural assumptions

- Rural Connect remains the shared backend and database.
- Caja products remain separate from Despensa products and inventory behavior.
- Caja remains directly accessible to users; direct access does not require a
  separate backend or identity system.
- Rural Connect authentication and role authorization are reused.
- The approved frontend architecture is Option B: maintain Caja inside the
  Rural Connect frontend under `src/features/caja/`, using its existing
  router, `AuthProvider`, role guards, and API configuration.
- Caja is directly accessible through a protected route such as `/caja`, and
  Rural Connect navigation points to that same maintained implementation.
- Prefer redirecting `caja-susinos.vercel.app` to the canonical Rural Connect
  `/caja` URL if domain and project control permit it. Do not serve a separate
  Caja origin unless a concrete deployment requirement later justifies it.
- Do not implement SSO or cross-domain token sharing in this sprint; revisit
  only if a separately served Caja origin becomes necessary.
- The Rural Connect frontend deploys automatically to Vercel from the Rural
  Connect main branch, and the Rural Connect backend deploys automatically to
  the project owner's server from that same main branch.
- The legacy Caja frontend is currently deployed to Vercel from the legacy
  Caja repository's main branch. That repository is frozen and receives no new
  product development; all migration and maintenance work belongs in the
  Rural Connect repository.
- The legacy Caja deployment may remain available temporarily while migration
  proceeds. Do not cut over `caja-susinos.vercel.app` until the maintained
  Rural Connect `/caja` experience has been validated.
- Prefer configuring the legacy Caja domain/project to redirect to the
  canonical Rural Connect `/caja` URL if control permits, without resuming
  development in the legacy repository.
- `legacy/CajaSusinos` is a migration/reference source, not a runtime
  dependency.
- Existing calculator, cart, ticket, and voucher behavior is preserved unless
  explicitly approved otherwise.
- Avoid duplicate maintained frontend or business logic.
- No real-money payment capability is introduced in this sprint.
- The shared API remains the source of truth for products and prices. The
  frontend may calculate an in-progress ticket for display, but must use
  integer cents and must not introduce a competing maintained catalog.

## Risks / unknowns

- Confirm control over the legacy Caja Vercel project/domain and the redirect
  mechanism before cutover; keep the existing deployment available until the
  maintained Rural Connect implementation is validated.
- Direct access requires a secure, user-friendly way to obtain and retain
  Rural Connect authentication. Token/session storage and expiration behavior
  must follow existing project security patterns.
- The public catalog API returns active products only. The admin UI may need
  an admin-authorized way to inspect inactive products; confirm this need
  before adding backend scope.
- Product prices or availability may change while a ticket is in progress.
  Define expected UI behavior for a refreshed catalog without silently
  changing an already selected ticket.
- The legacy voucher behavior may include edge cases that are not captured in
  documentation; characterize it with tests before migration.
- Control over the legacy Caja Vercel project/domain and redirect capability
  still needs confirmation before cutover. Safe test-account and isolated
  database availability also need confirmation; do not use production
  credentials or perform unapproved database writes for tests.
- The current Caja browser-local order/ticket behavior must be distinguished
  from shared order/comanda persistence. This sprint does not add persistence
  unless required to preserve an essential existing behavior and explicitly
  approved.

## Out of scope

- Real-money payments or payment gateway integration.
- NFC payments.
- Wristbands or cards.
- Wallet or user balance.
- QR payments.
- Online top-up.
- Advanced reporting or order analytics.
- Order/comanda persistence unless strictly required to preserve essential
  current behavior and explicitly approved.
- Any product development or maintenance changes in the frozen legacy Caja
  repository/application; it is available only as a read-only behavioral
  reference during migration.

## Recommended execution order

1. Complete S2-00 and get human approval for the frontend packaging/direct
   access decision.
2. Implement S2-01 authentication and direct-access flow.
3. Implement S2-02 API catalog integration, then S2-03 calculator/cart
   preservation.
4. Characterize and verify voucher behavior in S2-06 alongside cashier
   changes; finish its regression tests before acceptance.
5. Build the admin screen in S2-04 and connect it to backend operations in
   S2-05, resolving the inactive-product visibility question without changing
   the public active-only catalog contract.
6. Complete S2-07 end-to-end and relevant Rural Connect regression tests.
7. Prepare deployment and run the safe smoke tests in S2-08. Keep the legacy
   Caja Vercel deployment live until the Rural Connect `/caja` route is
   validated, then cut over by redirecting the legacy domain if possible.

Tasks may proceed in parallel only where their listed dependencies are met
and shared authentication, catalog, and packaging contracts remain stable.
