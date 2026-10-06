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

- Real money payments
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
- Avoid conflating Caja sales products with Despensa inventory unless appropriate
- Create backend product API
- Add validation and authorization
- Seed initial products from the current Caja catalog
- Preserve stable product identifiers where relevant

---

# Phase 2 - Authentication and Permissions

## Goal

Use Rural Connect authentication and permissions for Caja-related functionality.

## Expected outcome

Users accessing Caja use the shared Rural Connect identity and authorization model.

## Main work

- Reuse existing authentication
- Define Caja access permissions if needed
- Define administrator permissions
- Ensure admin operations are enforced by the backend
- Remove dependency on frontend-only Caja admin authentication
- Support both:
  - access from Rural Connect
  - direct access to Caja

---

# Phase 3 - Caja Migration to Shared Backend

## Goal

Replace Caja Susinos static/local data dependencies with the Rural Connect backend.

## Expected outcome

Caja functionality no longer depends on:

- public/products.json
- frontend-only administration
- browser-local product data

## Main work

- Load products from shared API
- Preserve current calculator behavior
- Preserve quantities and ticket calculations
- Preserve voucher conversion behavior
- Decide which calculations belong in frontend and which should be validated by backend
- Remove duplicated fallback product catalogs
- Avoid new dependencies on legacy/CajaSusinos

---

# Phase 4 - Administration

## Goal

Allow administrators to manage Caja products from the maintained application.

## Expected outcome

An authorized administrator can manage the Caja product catalog from the application.

## Main work

- Product list
- Create product
- Edit product
- Activate/deactivate product
- Define price
- Define category
- Validate admin permissions
- Connect administration UI to backend API

Deletion should be avoided when deactivation is more appropriate for historical consistency.

---

# Phase 5 - Rural Connect Integration

## Goal

Integrate Caja functionality into the Rural Connect user experience while preserving direct access.

## Expected outcome

A user can access Caja:

1. From Rural Connect
2. Directly through a dedicated entry point

Both access methods use the same maintained implementation and backend.

## Main work

- Add Caja navigation/entry point in Rural Connect
- Define Caja route or application entry point
- Reuse shared authentication
- Reuse shared product API
- Avoid maintaining duplicate Caja implementations

Independent user access does not imply a separate repository.

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
- Add basic history if required
- Ensure totals are consistent between frontend and backend

The current Caja localStorage behavior should be replaced where persistent shared history is required.

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

The migration must introduce automated coverage for the important Caja behavior.

At minimum:

- Product catalog loading
- Product administration permissions
- Adding products to ticket
- Increasing/decreasing quantities
- Ticket totals
- Voucher calculations
- Five-cent rounding
- Order registration
- API validation
- API authorization
- Persistence
- Regression of existing Rural Connect functionality

Where possible, compare migrated Caja behavior against the legacy implementation.

---

# Migration Principles

During migration:

- Inspect existing Caja behavior before changing it
- Preserve intended user-visible behavior
- Prefer existing Rural Connect architectural patterns
- Move shared data and business rules to the backend when appropriate
- Avoid large rewrites
- Avoid duplicating business logic
- Do not create a second backend
- Do not create runtime dependencies on legacy/CajaSusinos
- Treat legacy/CajaSusinos as reference code only

---

# Definition of Done - Version 1

Version 1 is complete when:

- Existing Rural Connect functionality still works
- Caja functionality is available from Rural Connect
- Caja functionality is also directly accessible
- Both access paths use the same maintained implementation
- Products are stored in the shared backend/database
- Administrators can manage Caja products
- Authentication and permissions use Rural Connect
- Calculator behavior works
- Voucher conversion works as expected
- Orders/comandas can be stored without real payment
- Critical Caja behavior has automated tests
- No runtime dependency on legacy/CajaSusinos remains
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