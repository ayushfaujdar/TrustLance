# Contributing to TrustLance

Thanks for helping improve TrustLance. Contributions of bug fixes, documentation, tests, and thoughtful feature work are welcome.

## Before You Start

- Check existing issues and pull requests before starting substantial work.
- For a large change, open an issue first to agree on the approach.
- Do not include real user data, credentials, API keys, or production secrets in code, commits, screenshots, or issue reports.

## Development Setup

Follow the [local development instructions](README.md#local-development). Make changes in the relevant `backend/` or `frontend/` application and keep pull requests focused.

## Pull Requests

- Describe the problem and the behavior your change introduces.
- Link related issues and call out any API, database, or environment-variable changes.
- Add or update tests when practical. Automated test scripts are not configured yet, so include the checks you ran and their results.
- Run the relevant checks before submitting:

  ```sh
  npm --prefix backend run build
  npm --prefix frontend run lint
  npm --prefix frontend run build
  ```

- Include screenshots for user-visible frontend changes when useful.
- Keep commits free of generated output, local environment files, and unrelated changes.

By submitting a contribution, you agree that it may be distributed under the project's [MIT License](LICENSE).