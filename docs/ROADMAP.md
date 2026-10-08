# Rural Connect + Caja Susinos Roadmap

## Objective

Integrate the useful functionality of Caja Susinos into the Rural Connect ecosystem while keeping Rural Connect as the main maintained project.

Caja Susinos is currently used as a temporary reference implementation during migration.

The target architecture is:

- Rural Connect as the main maintained repository
- One shared backend and database
- Caja functionality accessible from Rural Connect
- Caja functionality also accessible directly by users
- Shared authentication and permissions
- Shared product/catalog data
- No duplicated business logic
- No dependency on the legacy Caja Susinos project in the final architecture

---

# Delivery status

## Sprint 1 — COMPLETED

Sprint 1 established the backend foundation for the Caja Susinos integration.

Completed capabilities:

- Separate `CajaProduct` domain model
- Additive Prisma migration
- Seeded Caja catalog
- Authenticated Caja catalog read API
- ADMIN create/edit/deactivate API
- Backend validation
- Automated backend coverage
- Stable product IDs
- Integer-cent pricing
- No hard deletion
- No runtime dependency on the legacy Caja backend/data source

Remaining work is primarily frontend integration, authentication flow, administration UI, operational integration, and end-to-end delivery.

---

# Version 1 Scope

Version 1 must preserve the existing Rural Connect functionality while integrating the current Caja Susinos calculator experience.

Version 1 includes:

- Shared backend and database
- Shared users and permissions
- Backend-managed Caja product catalog
- Caja calculator functionality
- Existing voucher conversion/calculation behavior
- Admin product management
- Caja accessible from Rural Connect
- Caja accessible directly
- Order/comanda registration without real payment
- Basic order history where useful

Version 1 does NOT include:

- Real-money payments
- Payment gateway integration
- NFC payments
- Wristbands/cards
- Wallet or user balance
- Online top-ups
- QR payments

These features belong to later roadmap phases.

---

# Phase 1 - Backend Product Catalog

## Goal

Move Caja Susinos product data from static frontend files into the shared Rural Connect backend.

## Expected outcome

Products used by Caja are stored in the database and exposed through the shared API.

## Main work

- Analyze current Caja product structure
- Define Caja product data model
- Decide relationship with existing Despensa models
- Keep Caja sales products separate from Despensa inventory unless a future requirement justifies integration
- Create backend product API
- Add validation and authorization
- Seed initial products from the current Caja catalog
- Preserve stable product identifiers where relevant

## Status

COMPLETED in Sprint 1.

---

# Phase 2 - Authentication and Permissions

## Goal

Use Rural Connect authentication and permissions for Caja-related functionality.

## Expected outcome

Users accessing Caja use the shared Rural Connect identity and authorization model.

Direct access to Caja does not imply a separate authentication system.

## Main work

- Reuse existing Rural Connect authentication
- Define Caja access permissions if needed
- Define administrator permissions
- Ensure admin operations are enforced by the backend
- Remove dependency on frontend-only Caja admin authentication
- Support:
  - access from Rural Connect
  - direct access to Caja
- Preserve a single user identity across both access paths

---

# Phase 3 - Caja Migration to Shared Backend

## Goal

Replace Caja Susinos static/local data dependencies with the Rural Connect backend.

## Expected outcome

Caja functionality no longer depends at runtime on:

- `public/products.json`
- frontend-only administration
- duplicated fallback product catalogs
- browser-local product data where shared persistence is required

## Main work

- Load products from shared API
- Preserve current calculator behavior
- Preserve quantities and ticket calculations
- Preserve voucher conversion behavior
- Decide which calculations remain frontend concerns and which should be validated by backend
- Remove duplicated fallback product catalogs
- Avoid new dependencies on `legacy/CajaSusinos`

---

# Phase 4 - Administration

## Goal

Allow administrators to manage Caja products from the maintained application.

## Expected outcome

An authorized administrator can manage the Caja product catalog using the shared backend.

## Main work

- Product list
- Create product
- Edit product
- Activate/deactivate product
- Define price
- Define category
- Configure the display order of products within each category
- Validate admin permissions
- Connect administration UI to backend API

Product removal should use deactivation rather than hard deletion to preserve historical consistency.

---

# Phase 5 - Rural Connect and Direct Caja Access

## Goal

Make Caja accessible both from Rural Connect and through a direct user entry point.

## Expected outcome

A user can access Caja:

1. From Rural Connect
2. Directly through a dedicated Caja entry point

Both access paths must use:

- the shared Rural Connect backend
- shared authentication
- the same Caja product data
- the same business behavior

The final frontend packaging/deployment model may remain separate or become more integrated, but duplicate maintained implementations should be avoided.

## Main work

- Add Caja navigation/entry point in Rural Connect
- Preserve direct Caja access
- Reuse shared authentication
- Reuse shared product API
- Avoid maintaining duplicated business logic
- Define the final maintained frontend/deployment structure

---

# Phase 6 - Orders / Comandas

## Goal

Persist Caja operations as orders/comandas without introducing real payment.

## Expected outcome

The user can register a completed ticket and the transaction can be stored in the backend.

This is not a payment.

## Main work

- Define order/comanda model
- Store order lines
- Preserve price at time of order
- Store totals
- Store relevant user/terminal information
- Create backend endpoints
- Add basic history where useful
- Ensure totals are consistent between frontend and backend

The current Caja `localStorage` behavior should be replaced where persistent shared history is required.

This phase remains part of Version 1 but is not required for the immediate Sprint 2 operational-delivery goal unless needed to preserve essential current behavior.

---

# Voucher Calculation

Voucher conversion is part of Version 1 and must preserve the current Caja Susinos behavior unless explicitly changed.

Special attention must be given to:

- 12 EUR voucher configuration
- 24 EUR voucher configuration
- denomination breakdown
- five-cent rounding
- partial rows
- displayed guidance

This behavior must have automated tests before the migration is considered complete.

---

# Testing Requirements

The migration must introduce automated coverage for important Caja behavior.

At minimum:

- Product catalog loading
- Product administration permissions
- Adding products to ticket
- Increasing/decreasing quantities
- Ticket totals
- Voucher calculations
- Five-cent rounding
- API validation
- API authorization
- Persistence where appropriate
- Regression of existing Rural Connect functionality

When order/comanda persistence is introduced:

- order registration
- stored totals
- stored line prices
- basic history behavior

Where possible, compare migrated Caja behavior against the legacy implementation.

Database-backed integration testing should be added when a clearly isolated and safe test database setup is available.

---

# Migration Principles

During migration:

- Inspect existing Caja behavior before changing it
- Preserve intended user-visible behavior
- Prefer existing Rural Connect architectural patterns
- Move shared data and business rules to the backend when appropriate
- Avoid large rewrites
- Avoid duplicated business logic
- Do not create a second backend
- Do not create runtime dependencies on `legacy/CajaSusinos`
- Treat `legacy/CajaSusinos` as migration/reference code
- Prefer incremental migration with tests and human review
- Keep Rural Connect as the source of truth for shared backend capabilities

---

# Current Delivery Priority

The immediate priority is to make Caja Susinos operational end-to-end using the shared Rural Connect backend.

The next sprint should focus on:

- consuming Caja products from the shared backend
- removing runtime dependency on the static Caja product JSON
- preserving calculator/cart behavior
- preserving voucher behavior
- integrating shared Rural Connect authentication
- providing product administration UI
- connecting administration UI to the existing backend APIs
- maintaining direct access to Caja Susinos
- validating the complete user flow
- deploying and smoke-testing the operational version

The next sprint should NOT introduce:

- payment gateways
- real-money payments
- NFC
- wristbands/cards
- wallet/balance
- QR payments
- online top-up
- advanced reporting
- advanced order analytics

The immediate goal is operational delivery, not expansion of financial features.

---

# Definition of Done - Version 1

Version 1 is complete when:

- Existing Rural Connect functionality still works
- Caja functionality is available from Rural Connect
- Caja functionality is also directly accessible
- Both access paths use the shared Rural Connect backend
- Both access paths use the same authentication model
- Products are stored in the shared backend/database
- Administrators can manage Caja products
- Calculator behavior works
- Voucher conversion works as expected
- Orders/comandas can be stored without real payment
- Critical Caja behavior has automated tests
- No runtime dependency on `legacy/CajaSusinos` remains
- No duplicate maintained product catalogs remain
- No payment gateway exists
- No NFC payment exists
- No wallet/balance system exists

---

# Future Roadmap

After Version 1 is stable, future phases may introduce:

## Phase 7 - Wallet / Balance

- User balance
- Transaction ledger
- Balance history

## Phase 8 - QR Payments

- Identify user through QR
- Charge transactions against balance
- End-to-end bar payment flow

## Phase 9 - NFC / Wristbands

- NFC card or wristband association
- Fast point-of-sale identification
- Secure payment workflow

## Phase 10 - Online Top-up

- Payment provider integration
- User balance top-up
- Payment reconciliation

These phases are explicitly outside Version 1.