# API Overview

This is a route inventory, not a complete OpenAPI contract. Request validation, response shapes, and business rules are defined in the linked route/controller code and may evolve. The API is mounted under `/api`; the local base URL is `http://localhost:5000/api`.

## Authentication

Unless marked optional or public, routes require an access token:

```http
Authorization: Bearer <access-token>
```

The frontend API client attaches this header automatically when an access token is present. Authentication failures return `401`; role restrictions are applied to selected routes. Never put access tokens or secrets in public issue reports or logs.

## Routes

| Group | Routes | Status / notes |
| --- | --- | --- |
| Health | `GET /health` | Returns API status and timestamp. |
| Authentication | `POST /auth/register`, `/auth/verify-email`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/google`; `GET /auth/me` | Implemented in `backend/src/controllers/auth.controller.ts`; auth rate limiting applies to selected routes. |
| Users | `GET /users/freelancers`, `GET /users/:id/profile`, `PUT /users/profile` | `GET /users/:id/profile` is public with optional authentication and returns only public freelancer profile fields. The other two routes are placeholders. |
| Jobs | `GET /jobs`, `/jobs/my-jobs`, `/jobs/client-stats`, `/jobs/:id`; `POST /jobs`, `/jobs/:id/bid`, `/jobs/:id/accept-bid` | Implemented in `backend/src/controllers/job.controller.ts` and `bid.controller.ts`; all require authentication. |
| Bids | `GET /bids` | Placeholder currently returns `501`; submitting and accepting bids is routed through the jobs endpoints above. |
| Contracts | `GET /contracts` | Placeholder currently returns `501`. |
| Escrow | `POST /escrow/fund-milestone`; `GET /escrow/contract/:contractId` | Authenticated escrow operations. |
| Deliverables | `POST /deliverables/upload`, `GET /deliverables/:id/preview`, `POST /deliverables/:id/approve`, `POST /deliverables/:id/request-revision`, `GET /deliverables/contract/:contractId` | Upload is restricted to freelancers; other routes require authentication. Client approval is deliverable-based: the client project page resolves the submitted deliverable for a milestone, then calls `POST /deliverables/:id/approve`; this route authorizes the contract client and releases the associated funded escrow once. There is no `/escrow/approve` route. |
| Disputes | `GET /disputes` | Placeholder currently returns `501`. |
| Messages | `GET /messages/conversations`, `GET /messages/:threadId`, `POST /messages/:threadId` | Authenticated message history and send endpoints; realtime events are described below. |
| Wallet | `POST /wallet/create-order`, `/wallet/verify-payment`, `/wallet/withdraw`; `GET /wallet/balance`, `/wallet/transactions` | Authenticated wallet and Razorpay flows. Use test credentials during development. |
| Reviews | `GET /reviews` | Placeholder currently returns `501`. |
| Support | `GET /support` | Placeholder currently returns `501`. |
| Admin | `GET /admin` | Placeholder currently returns `501`. |
| Open escrow | `POST /open-escrow/create`; `GET /open-escrow/:token` | Create requires authentication; token lookup supports optional authentication. |
| Notifications | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` | Authenticated notification operations. `GET` accepts an optional `limit` query parameter (default `50`). |
| Freelancer | `GET /freelancer/stats`, `GET /freelancer/contracts` | Authenticated freelancer dashboard data. |

All route paths above are relative to `/api`, except `/health`. The `501` routes are scaffolding, not usable features; see their route modules under `backend/src/routes/` before building on them.

### Public freelancer profile

`GET /users/:id/profile` returns `404` when the ID is invalid, does not belong to a freelancer, or the freelancer is banned. A successful response contains:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Asha Freelancer",
  "bio": "Builds accessible web applications.",
  "skills": ["TypeScript", "React"],
  "avatar": "https://example.com/avatar.png",
  "rating": 4.8,
  "completedJobs": 3,
  "joinedAt": "2025-01-15T00:00:00.000Z",
  "portfolio": [
    { "title": "Portfolio item 1", "url": "https://example.com/project" }
  ]
}
```

The stored `User.portfolio` values remain URL strings; the API adds stable display titles for the profile page. Credentials, wallet/KYC data, refresh tokens, and other private account fields are never returned.

## Realtime Events

Socket.IO uses `NEXT_PUBLIC_SOCKET_URL` and authenticates with a JWT supplied in the connection `auth.token` field. Current client/server events include:

| Direction | Event | Data |
| --- | --- | --- |
| Client to server | `message:send` | `{ receiverId, content, attachments? }` |
| Server to client | `message:receive` | Persisted message delivered to the recipient |
| Server to client | `message:sent` | Persisted message acknowledgement to the sender |
| Client to server | `typing:start`, `typing:stop` | `{ receiverId }` |
| Server to client | `typing:start`, `typing:stop` | `{ userId }` |
| Client to server | `notification:read` | `{ notificationId }` |

Event definitions and authorization behavior are implemented in `backend/src/socket/socket.handler.ts`. Review that handler before relying on realtime events for new workflows.
