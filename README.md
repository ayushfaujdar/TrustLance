# TrustLance

TrustLance is a freelance marketplace for clients and freelancers, with job listings, bids, contracts, escrow, deliverables, messaging, and dispute workflows. The project is under active development.

> **Use caution with payments.** This repository is provided for development and evaluation. Review the security, payment, and escrow implementation carefully before deploying it or handling real funds.

## Technology

- Frontend: Next.js 14, React 18, TypeScript, and Tailwind CSS
- Backend: Express 5, TypeScript, MongoDB, and Socket.IO
- Optional integrations: Razorpay, Cloudinary, Upstash Redis, Google OAuth, and SMTP

## Prerequisites

- Node.js 20 or newer and npm
- A MongoDB instance, local or hosted
- Provider accounts and credentials for any integrations you want to use

## Local Development

1. Clone the repository and install each application's dependencies:

   ```sh
   git clone https://github.com/ayushfaujdar/TrustLance.git
   cd TrustLance
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. Create local environment files:

   ```sh
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   Set `MONGODB_URI` and replace both JWT secret placeholders in `backend/.env`. Configure provider credentials for features you intend to run. The frontend sample points to the backend's default local port (`5000`).

3. Start the backend and frontend in separate terminals:

   ```sh
   cd backend && npm run dev
   ```

   ```sh
   cd frontend && npm run dev
   ```

   The frontend is at <http://localhost:3000>. The API health check is at <http://localhost:5000/health>.

## Environment Variables

### Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signing key for access tokens; use a long, random value |
| `JWT_REFRESH_SECRET` | Yes | Signing key for refresh tokens; use a separate random value |
| `PORT` | No | API port; defaults to `5000` |
| `FRONTEND_URL` | No | Frontend origin for CORS and links; defaults to `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth client ID |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For backend media operations | Cloudinary credentials |
| `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` | For Redis features | Upstash Redis credentials |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | For payments | Razorpay API credentials |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL` | For email | SMTP settings |
| `PLATFORM_FEE_PERCENT` | No | Platform fee percentage; defaults to `8` |

### Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | API base URL; set to `http://localhost:5000/api` for local development |
| `NEXT_PUBLIC_SOCKET_URL` | No | Socket.IO server URL; defaults to `http://localhost:5000` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | For Google sign-in | Google OAuth client ID |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | For uploads | Cloudinary browser upload configuration |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | For payments | Public Razorpay key ID |

Never commit `.env` files, private keys, provider secrets, or production credentials. Values prefixed with `NEXT_PUBLIC_` are exposed to browser code and must not contain secrets.

## Project Documentation

- [Architecture and runtime behavior](docs/architecture.md)
- [API route overview](docs/api.md)

## Build and Checks

```sh
npm --prefix backend run build
npm --prefix frontend run lint
npm --prefix frontend run build
```

Automated test scripts are not configured yet. Please include appropriate verification details with contributions.

## Contributing and Security

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Report suspected vulnerabilities privately using GitHub's **Report a vulnerability** option on this repository; see [SECURITY.md](SECURITY.md).

## License

TrustLance is licensed under the [MIT License](LICENSE).