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

## What this baseline runs

The API and initial web app use official BigCapital container releases pinned by
digest. The web app image adds the demo banner and a link to this public source.
The upstream automatic container updater is omitted. Analytics, bank connections,
payment integrations and outgoing email are not configured for this baseline.

**Editing application source does not yet rebuild these pinned release images.**
Before testing a functional source change, build API/web app images from this fork
and update the test deployment. Automatic source builds and deployment to a
persistent staging host remain a next step. GitHub Pages cannot host this app's
API and MariaDB services.

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
