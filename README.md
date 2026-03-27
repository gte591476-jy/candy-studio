# Candy Studio

Candy Studio is a lightweight AI creative website built with `Node.js`, `Express`, and `MySQL`.
The frontend is served directly by the backend, so you can run the full site locally without a separate frontend build step.

## What It Includes

- User registration and login
- JWT-based authentication
- Admin dashboard
- Image and video generation workflow
- Points, recharge, and membership logic
- MySQL-backed persistence

## Stack

- Frontend: HTML, Tailwind CDN, Vanilla JavaScript
- Backend: Node.js, Express
- Database: MySQL 8+
- Authentication: JWT + bcrypt

## Repository Layout

```text
.
|-- backend/
|   |-- sql/
|   |-- src/
|   |-- .env.example
|   `-- package.json
|-- js/
|-- admin.html
|-- index.html
|-- main.js
|-- package.json
`-- README.md
```

## Run As A Website

### 1. Create the database

```sql
CREATE DATABASE candy_studio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Create your local env file

```powershell
Copy-Item backend\.env.example backend\.env
```

Fill in your own values in `backend/.env`, especially:

- `DATABASE_URL`
- `JWT_SECRET`
- `BANANA_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_PATH`
- `ADMIN_ACCESS_CODE`

### 3. Install backend dependencies

```powershell
cd backend
npm install
```

### 4. Start the website

```powershell
npm start
```

## Local URLs

- Frontend: `http://localhost:3001/`
- Health check: `http://localhost:3001/api/health`
- Admin: `http://localhost:3001/{ADMIN_PATH}?code={ADMIN_ACCESS_CODE}`

## Notes

- Database tables are initialized automatically on startup.
- If the admin account does not exist, it will be created from the values in `.env`.
- The committed `.env` values are placeholders only. Replace them with your own local secrets before running.
- `.env` and log files are ignored and should never be committed.
- The repository also contains an optional Electron wrapper in the root for desktop packaging, but it is not required for website deployment.

## License

MIT
