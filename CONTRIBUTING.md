# Contributing

Thanks for your interest in improving Candy Studio.

This repository is open to practical contributions that make the project more stable, easier to deploy, and easier to operate for independent website owners.

## What To Contribute

Good contribution areas include:

- bug fixes
- authentication and security improvements
- admin dashboard improvements
- payment and membership workflow improvements
- deployment documentation
- UI polish and usability improvements
- upstream relay integration improvements

## Before You Start

Please keep changes aligned with the project's main direction:

- self-hosted AI generation website
- Banana Pro / Banana 2 style resale and distribution scenarios
- lightweight operations for individuals and small teams

If you want to make a larger change, open an issue first so the direction can be discussed before implementation.

## Development Notes

1. Fork the repository and create a feature branch.
2. Copy `backend/.env.example` to `backend/.env` and fill in your own local configuration.
3. Use MySQL 8+ for local development.
4. Run the backend from `backend/` with `npm start`.
5. Test the affected flow before submitting changes.

## Pull Request Guidelines

- Keep pull requests focused and easy to review.
- Do not commit real API keys, database credentials, or production configuration.
- Update documentation when behavior or setup changes.
- Prefer small, practical improvements over broad refactors without clear value.

## Security

If you discover a sensitive security issue, please avoid posting live secrets or exploit details publicly in the repository.
Open a private communication channel with the maintainer if possible before publishing a full write-up.

