# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

This directory holds design and specification material, not a buildable project yet:

- `Trackee.html` is a single-file UI prototype (inline CSS and JS, no build step, no tests). It is the design reference for the real app, not code to port. It uses global state, a mock login with a demo role picker, and mock AI replies.
- `Trackee Product Requirements, MVP Roadmap and Build Guide.docx` is the authoritative spec: requirements (F1 to F24 with MoSCoW priority and phases), data model, API outline, security checklist, and phased roadmap.

Build work has started (Phase 0): `frontend/` and `backend/`. PHP 8.4 and Composer are installed at `%LOCALAPPDATA%\Programs\composer` and the WinGet PHP folder; restart the terminal if `php` or `composer` are not found.

Frontend commands (run from `frontend/`):

- `npm install`
- `npm run dev`: Vite on port 5173. `/api` and `/sanctum` are proxied to `http://localhost:8000`.
- `npm run build`: type-check (`tsc -b`) and production build.
- `npm run lint`: oxlint. There is no frontend test runner yet.

Backend commands (run from `backend/`, Laravel 13, PHP 8.4):

- Local database is MySQL, as set in `backend/.env` (`DB_CONNECTION=mysql`, database `trackee`, `root` on `127.0.0.1:3306` with no password). Start the MySQL server before the API. On this machine it is XAMPP's MariaDB 10.4 (`C:\xampp\mysql\bin\mysqld.exe`, data in `C:\xampp\mysql\data`), which the `.env` settings also work with.
- `composer install`, then `php artisan migrate:fresh --seed` for a local database.
- `php artisan serve --port=8000`: the API that Vite proxies to.
- `php artisan test` (or `php vendor/bin/phpunit`): PHPUnit feature tests in `tests/Feature`.
- Demo accounts from the seeder, password `demo1234`: `aina@pepper.my` (Admin), `daniel@pepper.my` and `siti@cloudco.my` (Staff). Development only.

## Planned architecture

The target system (from spec section 7) is a Laravel API with a React SPA. Frontend layout so far:

```
frontend/src/
  api/          fetch wrapper (client.ts) and endpoint modules (auth.ts)
  auth/         AuthProvider, context, useAuth; session comes from GET /api/me
  config/       lifecycle stages and statuses, nav with role gating
  lib/          date and money helpers (format.ts), shared constants
  store/        demo data for every module (demo.ts, ported from Trackee.html)
                DataProvider holds it in memory; useData/useMe read it
  features/     module logic: projects (deadlines, dialogs), dashboard calendar, directory tree
  components/   UI primitives (ui.tsx), FormDialog (schema-driven form modal), Assistant
  feedback/     toast and confirm dialog (replaces alert/confirm)
  layout/       AppShell (sidebar, header, assistant)
  pages/        one file per module, mirroring the prototype's views
```

Current state of the port: every prototype module has a page. Their data lives in `store/demo.ts`, held in memory, and resets on reload. The backend has only auth, so none of the other modules call the API yet. When a module's endpoints exist, replace its `useData()` reads and writes with API calls and remove that module's demo data.

Money in the store is integer sen (`amountSen`). The prototype's whole-ringgit figures were converted when the demo data was ported.

Backend so far: Sanctum session auth (`bootstrap/app.php` enables `statefulApi()`), spatie/laravel-permission roles (CEO, Admin, Staff; seeded by `RoleSeeder`), activitylog and medialibrary migrations published but not yet wired to models. Auth routes (`routes/api.php`) run the `web` middleware group for session and CSRF handling. The frontend fetches `/sanctum/csrf-cookie` and sends `X-XSRF-TOKEN` on every write.

Overall repo layout (docker folder not created yet):

```
trackee/
  backend/   Laravel app (routes/api.php, database/migrations)
  frontend/  React + Vite + TypeScript (src/pages, src/components, src/api, src/hooks)
  docker/    Dockerfiles, nginx.conf
  docs/      PRD, API spec, decisions
```

Request flow: browser SPA → Nginx → Laravel API (PHP-FPM, Sanctum cookie auth). Redis backs cache, queues, and rate limiting. A queue worker and a scheduler run as separate processes for reminders, Gmail/email sends, and overdue checks. Data lives in MySQL or PostgreSQL. Files go to S3-compatible storage. Google APIs and the LLM API are called only from the backend, so keys never reach the browser.

Backend conventions: thin controllers, Form Request validation, Policy classes for authorisation, Service classes for logic (for example `LifecycleService`, `LeaveService`), API Resources for output, and Jobs for email and reminders.

## Rules that span the whole system

- **Authorisation is server-side.** The UI hiding a button is not access control. Every endpoint checks a Policy. The role sent from the browser is never trusted; the prototype's role picker is for the prototype only.
- **Project lifecycle is fixed.** Every project has exactly 10 stages in this order: POC Agreement, Fact Finding, Requirement Mapping, Workflow Presentation, Immersion, Solution Training, Finetuning, Lunch&Learn, Post L&L, CFA Paper. Each stage has one status: Complete, In progress, On hold, Not started, or Not set. Stage keys are shared between frontend config and backend enums, so keep them in sync.
- **Money is integer sen** (`*_sen` columns). Format on the client only. Never use floats for money. The prototype stores whole ringgit (`amt: 18000` = RM 18,000), so do not copy its money handling.
- **Time is stored in UTC** and displayed in Asia/Kuala_Lumpur.
- **Payroll rates are data, not code.** Statutory rates (EPF, SOCSO, EIS, tax) live in the `statutory_rates` table with `effective_from` dates. The prototype's 11% EPF and flat RM 40 are placeholders only.
- **Files are private.** Store outside the public folder and serve only through authenticated download or short-lived signed URLs.
- **Folder tree** uses a `parent_id` column. Folder names are unique per parent, case-insensitive. Deleting a folder cascades in a transaction, and blob removal is queued.
- **Audit log** covers projects, billing, users, leave, attendance, and payroll changes (spatie/laravel-activitylog).
- **Secrets** (Google credentials, LLM key) come from environment variables or a secrets manager, never the repo.

## Working on the prototype

If you edit `Trackee.html`, keep it self-contained: inline CSS and JS, CSS custom properties on `:root` with a dark theme under both `prefers-color-scheme` and `[data-theme="dark"]`. Don't add new `alert()` or `confirm()` calls; the spec replaces them with real dialogs and toasts.

Gaps against the spec that remain after the port (the React port fixes the others):
- Staff can open every project, contact, and directory in the UI. Only leave and attendance filter by role. The server must enforce access once APIs exist.
- Payroll figures in `PayrollPage.tsx` (`PAY`) and the EPF and SOCSO rates in `constants.ts` are placeholders. Spec: rates come from a `statutory_rates` table with effective dates.
- The login accepts any password in the seeded demo, and the role comes from the backend user, not a picker.

Fixed in the port: Billing is hidden from Staff, `alert`/`confirm` are replaced by toasts and a confirm dialog, the inbox computes overdue invoices from the data, and all text is rendered by React, so no inline HTML is built from user input.

## Open decisions

Section 12 of the spec lists unresolved questions that affect the data model and permissions. Check them before building: single vs. multi-company (decides whether `company_id` goes on every table now), whether Staff can see billing, who approves leave, whether payroll is generated in Trackee or only displayed, and the email path (Gmail OAuth vs. SMTP).
