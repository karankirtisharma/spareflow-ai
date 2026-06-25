# Spareflow AI - Environment Variables Reference Manual

This manual provides detail on the runtime environment variables utilized by the Spareflow AI application, highlighting security rules and best practices.

---

## 1. Environment Configurations Table

| Key | Type | Default Value | Description | Required in Production |
| :--- | :--- | :--- | :--- | :--- |
| **`PORT`** | `number` | `3000` | The port the backend server binds to. Must always be `3000` inside containers. | Yes |
| **`NODE_ENV`** | `string` | `development` | Sets application runtime mode (`development`, `production`, `test`). | Yes |
| **`JWT_SECRET`** | `string` | *auto-generated* | Secret salt utilized for signing JWT auth tokens. Use a 64+ char random string. | **CRITICAL** |
| **`ENCRYPTION_SECRET`** | `string` | *auto-generated* | Cryptographically decoupled master key used for AES-256-CBC field encryption. | **CRITICAL** |
| **`APP_URL`** | `string` | `http://localhost:3000` | Fully qualified base URL of the hosting server. Used for redirects. | Yes |
| **`SQL_HOST`** | `string` | `localhost` | Relational PostgreSQL hostname. | Yes |
| **`SQL_USER`** | `string` | `postgres` | Relational database access username. | Yes |
| **`SQL_PASSWORD`**| `string` | *empty* | Secure password for the database pool user. | Yes |
| **`SQL_DB_NAME`** | `string` | `spareflow` | PostgreSQL database schema name. | Yes |
| **`SQL_POOL_MAX`** | `number` | `15` | Maximum number of simultaneous PostgreSQL clients allowed in connection pool. | No |
| **`GEMINI_API_KEY`**| `string` | *empty* | Optional key for Google Gemini model integrations. | No |

---

## 2. Secrets Security Guidelines

- **Never commit actual secrets**: Never store live keys, passwords, or secrets inside any repository file (including tests, markdown docs, or helper scripts).
- **Rotate keys regularly**: Access tokens and JWT secrets should be rotated at regular intervals to minimize the risk of historical log compromises.
- **Strict Client Exclusion**: Private keys (like `SQL_PASSWORD` or `GEMINI_API_KEY`) must **never** be prefixed with `VITE_` or exposed to the client-side SPA. All sensitive integrations must reside exclusively on backend routes.
