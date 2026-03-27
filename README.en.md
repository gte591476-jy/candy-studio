# Candy Studio

[简体中文说明](./README.md)

Candy Studio is an open-source AI image and video generation website built for independent operators.
It is designed for teams or individuals who source generation capacity from upstream relay APIs and redistribute that capability to end users through their own branded website.

In practical terms, this project is well suited for running a small commercial Banana Pro / Banana 2 style generation site:

- connect to an upstream model relay or supply channel
- resell image and video generation to your own customers
- manage accounts, balances, memberships, and recharge flow
- earn margin through pricing, packaging, and downstream distribution

## Project Positioning

Candy Studio is not just a demo UI. It is a usable self-operated distribution system for AI creative services.
It focuses on the business flow of "procure upstream capacity -> package it into your own website -> deliver generation services to customers -> keep the price spread as margin".

This repository is especially suitable for:

- personal or small-team AI tool operations
- Banana Pro, Banana 2, and related image generation resale scenarios
- AI image and short video websites built on top of relay APIs
- private deployment for niche creative communities or client groups

## Core Capabilities

- User registration and login
- JWT-based authentication
- Admin dashboard
- Image and video generation workflow
- Points, recharge, and membership system
- MySQL-backed data persistence
- API key rotation and upstream base URL configuration

## Business Use Case

The typical operating model behind this project looks like this:

1. You obtain upstream generation capability from a relay service or API supplier.
2. You configure your own pricing, model costs, and membership packages.
3. Your users generate Banana-style images and videos on your website.
4. The platform records usage, deducts points, and supports recharge.
5. Your profit comes from the spread between upstream procurement cost and downstream retail pricing.

That makes Candy Studio a practical starting point for operators who want to launch a lightweight AI generation business without building the whole account, billing, and delivery system from scratch.

## Tech Stack

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

## Quick Start

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
- `BANANA_API_BASE`
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

## Open Source Notes

This repository is open source so that independent operators can deploy, customize, and extend their own AI generation website more quickly.

What is included:

- the full website codebase
- account system and admin flow
- pricing, points, and membership logic
- MySQL-backed runtime
- a deployable baseline for AI generation resale scenarios

What is not included:

- your private upstream API keys
- your production database
- your local admin credentials
- any guarantee of profitability, compliance, or upstream availability

Before deploying publicly, you should review and customize:

- your pricing strategy
- your upstream API terms
- your moderation and content policy
- your payment flow
- your legal and compliance requirements for your region

## Deployment Notes

- Database tables are initialized automatically on startup.
- If the admin account does not exist, it will be created from the values in `.env`.
- The committed `.env` values are placeholders only. Replace them with your own local secrets before running.
- `.env` and log files are ignored and should never be committed.
- The repository also contains an optional Electron wrapper in the root for desktop packaging, but it is not required for website deployment.

## License

MIT
