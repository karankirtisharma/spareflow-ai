# Changelog - Spareflow AI

All notable changes to this project will be documented in this file.

---

## [1.0.0-beta] - 2026-06-25
This release marks the successful completion of the **Foundation Hardening Sprint** and prepares the repository for public publication on GitHub.

### Added
- Created professional documentation suite inside `/docs` (`ARCHITECTURE.md`, `API.md`, `DATABASE.md`, `DEPLOYMENT.md`, `ROADMAP.md`, `ENVIRONMENT.md`).
- Added community-ready support files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `LICENSE` (MIT).
- Added standard Git files: `.gitattributes`, `.editorconfig`.
- Configured a comprehensive `.env.example` file.
- Created GitHub issue and pull request templates inside `.github/` to coordinate community interactions.

### Changed
- Rebranded and updated package specifications in `package.json` with the production-ready `"name": "spareflow-ai"` and `"version": "1.0.0-beta"`.
- Cleaned up application layout, index templates, and browser headers in `index.html`.

### Removed
- Safely purged obsolete, duplicate, and unreferenced component directories (`/src/components/zoho`) to eliminate dead code and restore workspace clarity.
- Removed all temporary comments and development-only notes.
