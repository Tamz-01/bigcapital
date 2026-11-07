# BigCapital test environment

This fork is the starting point for a Laos accounting service. Use synthetic data only.
The isolated test configuration does not deploy or update a production service.

## Open the test app

1. Open the existing workspace at https://github.com/codespaces.
2. If needed, run "python3 test-app.py" in its terminal.
3. Open forwarded port 8080. Keep the port visibility **Private**.
4. Create your own test account through the app. No shared password is committed.

The yellow banner identifies this as **TEST SYSTEM - Demo data only**.
Codespaces sleeps when idle and consumes GitHub compute/storage allowances. It is
an initial development test environment, not permanent hosting for clients or reviewers.

## Commands

- Start or resume: python3 test-app.py
- Inspect services: python3 test-app.py status
- Stop app containers: python3 test-app.py stop
- Also stop the Codespace from GitHub to stop its compute usage.

Requirements: Python 3, Docker and Docker Compose. The launcher uses the Python
standard library. It generates local secrets in .env.test and reuses them on
subsequent starts. This file must stay private and is excluded from Git.

The test project has separate database, Redis and Garage volumes. Stopping the
app keeps these volumes. Deleting a Codespace can remove its test data; use only
reproducible demo data here. Never use volume deletion as a routine restart.

## Build and run this fork

The test API loads this checkout's compiled `packages/server/dist` and database
migrations into the pinned official runtime. The web app image copies this
checkout's Vite build and adds the test banner. Runtime dependencies remain those
of the pinned API image; changes to dependencies require rebuilding that image.
This is a development deployment, not a portable production image.

Use Node 18.16.1 and pnpm 9, then run:

```sh
pnpm install --frozen-lockfile
pnpm run build:server
pnpm run build:webapp
python3 test-app.py
```

Repeat the builds after changing source. The launcher runs both system and tenant
migrations, rebuilds the web image, and starts the services. Keep a private database
backup before upgrading; stopping containers retains the named test volumes.
The launcher never deletes volumes. Codespaces keeps the compiled files between
normal stops; a fresh checkout needs the builds above.

Analytics, bank connections, payment integrations and outgoing email remain
unconfigured. GitHub Pages cannot host the API and MariaDB services.

## USD purchases and invitations

- With LAK as base currency, use a USD vendor and enter an explicit positive rate
  in LAK per USD. For example, USD 10 at 22,000.125 LAK/USD should post as
  LAK 220,001.25. The migration expands transaction and ledger exchange-rate
  columns from DECIMAL(13,9) to DECIMAL(24,12), preserving existing values.
  Rollback refuses rates that cannot fit the old precision.
- Inviting a user displays their email, login page, and one-use setup link, valid
  for 24 hours. Copy it before closing. The recipient sets their own password.
  Resend invitation displays the new link as well; the existing five-minute
  resend limit still applies.
- Without SMTP configuration, no email connection is attempted. With SMTP
  configured, bounded delivery is attempted and the result distinguishes sent,
  network/server unavailable, and other delivery failures. No failed message is
  queued for a later retry. SMTP acceptance does not guarantee inbox delivery.
- For a LAN installation, configure BASE_URL with a hostname/IP reachable by the
  recipient. An offline server cannot use a cloud-only URL. Share setup links
  privately; they grant access and must not be included in screenshots or logs.

Regression tests:

```sh
pnpm --filter @bigcapital/server exec jest --runInBand --runTestsByPath \
  src/modules/UsersModule/commands/InviteUser.spec.ts \
  src/modules/UsersModule/commands/SendInviteUsersMailMessage.spec.ts
```

The FX database regression is opt-in. Create a unique disposable MySQL/MariaDB
database, set TEST_FX_DATABASE, TEST_FX_HOST, TEST_FX_USER and TEST_FX_PASSWORD, then
run the same Jest command with
`src/modules/ExchangeRates/widen-exchange-rate.integration.spec.ts`.
Never point it at an organization's database. It creates fixture tables, reproduces
the old overflow, applies the migration, verifies bill/ledger rates and existing
small rates, and checks rollback protection. Remove only that disposable database
afterward. SMTP tests use mocks and send no real messages.

## Planned work

- Fix and test reported accounting bugs before client use.
- Improve UI and workflows, then add Lao per-user language support.
- Preserve entered English data when changing the display language.
- Validate sales, purchases, payments, journals, reports, inventory and COGS.
- Validate backups, restore and upgrades.
- Add a persistent test host and reviewer accounts with demo data.
- Build/deploy approved source commits to staging, with a separate approved
  release process for production.
- Preserve license notices and publish corresponding source for modifications;
  review enterprise-only modules separately before using them.

## First review

Check signup/login and organization setup, then enter a small synthetic accounting
cycle and reconcile its reports. Report the exact screen, action, expected result
and actual result for each issue. An app that opens is not yet a validated
accounting service.


## Personal display language

The top-right language selector saves the signed-in system account language (English or Arabic) through JWT-protected PUT /api/auth/account/language. It reuses the existing users.language column, so no new migration is required. A personal choice overrides the company language; otherwise the company language remains the default.

The switch loads translations in place, without changing browser history or reloading the app. Stable lazy route components preserve open pages and form state while translated route titles refresh.

Validation: run the server UpdateAccountLanguage.spec.ts suite for account isolation and supported-language validation. The personal-language Playwright spec checks both directions on /vendors/new with a query string, hash and an unsaved first-name field, and checks persistence after refreshing /preferences/general.
