# Contributing to Spareflow AI

Thank you for your interest in contributing to Spareflow AI! We welcome bug reports, suggestions, documentation enhancements, and pull requests.

---

## 1. Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 2. Development Workflow

### A. Setting Up Local Workspace
1. Fork the repository and clone your fork:
   ```bash
   git clone https://github.com/your-username/spareflow-ai.git
   cd spareflow-ai
   ```
2. Install the exact dependencies specified in lockfiles:
   ```bash
   npm install
   ```
3. Set up local configs:
   ```bash
   cp .env.example .env
   ```

### B. Branch Naming Conventions
Create a descriptive branch for your changes:
- For features: `feature/your-feature-name`
- For bug fixes: `bugfix/your-fix-name`
- For documentation: `docs/your-doc-name`

---

## 3. Style and Standards

- **TypeScript**: Always use strict typing; avoid the use of `any` wherever possible.
- **Enums**: Always use standard, explicit TypeScript `enum` models (never `const enum`).
- **Formatting**: We use `prettier` style rules. Enforce spaces over tabs (2 spaces), single quotes on imports, and a final trailing newline on all files.
- **Imports**: All `import` paths on TypeScript ES Modules must contain correct file extensions (e.g. `import { db } from "../db/index.js";`).

---

## 4. Submitting a Pull Request (PR)

1. **Verify Your Code Builds Locally**:
   Ensure linting and compiling pass with zero errors:
   ```bash
   npm run build
   npm run lint
   ```
2. **Push and Open PR**:
   Push your branch and submit the PR against our `main` branch. Provide a clean summary using our [Pull Request Template](.github/pull_request_template.md).
