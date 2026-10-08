# Rural Connect - Project Instructions

## Project goal

Rural Connect is the main maintained application.

The current workspace also contains the legacy Caja Susinos application.
Caja Susinos is available temporarily as a reference during the migration
and integration of its functionality into Rural Connect.

The long-term target is to maintain the functionality inside the
Rural Connect repository.

## Workspace structure

The current VS Code workspace contains two projects:

### Rural Connect

Main and actively maintained project.

Current location:

RuralConnect/ruralConnect-app/

It contains the existing Rural Connect application, backend,
mobile-related code, tests, and deployment configuration.

### Caja Susinos

Legacy/reference application.

Current workspace location:

CajaSusinos/

It contains the existing bar calculator and product-related functionality
that will progressively be migrated or integrated into Rural Connect.

Caja Susinos should be treated primarily as a source of existing
functionality and business behavior during the migration.

## Target architecture

The target architecture should follow these principles:

- Rural Connect is the main maintained repository.
- There should be one shared backend.
- Business data should progressively be managed by the backend.
- Products must eventually be manageable by an administrator.
- Caja Susinos functionality must remain accessible independently at user level.
- Rural Connect may also provide access to Caja Susinos functionality.
- Independent user access does not require maintaining two separate repositories.
- Avoid duplicating business logic.
- Reuse existing working functionality whenever reasonable.

## Version 1 scope

The first integrated version must:

- Preserve the existing Rural Connect functionality.
- Integrate the current Caja Susinos calculator functionality.
- Allow users to use Caja Susinos functionality independently.
- Use the shared backend where appropriate.
- Allow an administrator to create, edit, and manage products from the application.
- Preserve the existing voucher conversion/calculation behavior.

Version 1 does NOT include:

- Payment gateway integration.
- Real money payments.
- NFC payments.

## Migration principles

Caja Susinos is a transitional/reference project.

Do not introduce new architecture that unnecessarily increases dependency
on the legacy CajaSusinos project.

When functionality is migrated:

1. Understand the current behavior first.
2. Identify reusable code and business rules.
3. Decide whether the functionality belongs in frontend or backend.
4. Prefer shared backend logic for shared business data or rules.
5. Preserve existing behavior unless a task explicitly changes it.
6. Add or update tests where appropriate.

## Development principles

- Prefer incremental changes over large rewrites.
- Inspect existing code before proposing architectural changes.
- Do not replace working components without a clear reason.
- Avoid duplicated business logic.
- Keep frontend and backend responsibilities clearly separated.
- Maintain backward compatibility when practical.
- Important behavior changes should have tests.
- Never expose secrets, credentials, or environment values in source code.

## Human approval

The project owner remains the final decision maker.

Agents may analyze, propose, implement, test, and review changes,
but architectural decisions or significant scope changes should be
presented clearly before being applied unless explicitly authorized.