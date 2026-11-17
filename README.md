# LENDLY

A hyperlocal peer-to-peer borrowing and rental platform for MIT-ADT University and nearby Pune communities.

**Borrow more. Buy less. Share better.**

This project is a complete responsive website prototype covering the LENDLY blueprint. It is intended for local demonstration and evaluation, not production deployment.

---

## Features

### Authentication and profiles
- Secure registration and login
- bcrypt password hashing
- JWT-protected routes
- Password reset
- General location management
- Verification status, ratings, and review count
- Public lender/borrower profiles

### Item listings
- Multi-image uploads
- Categories, condition, quantity, and rental price
- Borrowing terms
- Multiple availability date ranges
- Approximate map location
- Pause, activate, edit, and remove listings

### Search and discovery
- Text search across item names and descriptions
- Category, condition, price, date, and sorting filters
- Location-aware search using MongoDB GeoJSON
- User-controlled search radius
- Automatic expansion offer only when no results are found
- Availability-aware search results

### Requests and bookings
- Borrowers request exact dates and quantities
- Lenders accept or reject requests
- Borrowers cancel pending requests
- Overlapping bookings are checked against inventory
- Booking approval prevents overselling within a single API instance
- Request and booking statuses are consistent across the API and website

### Handover and returns
- Handover confirmation with initial condition
- Active borrowing status
- Return confirmation with final condition
- Transaction timeline

### Trust and safety
- Transaction-linked reviews
- Overall and experience-specific ratings
- Duplicate review prevention
- Reports for users, items, or reviews
- Admin moderation and account suspension
- Notifications for important platform events

### Administration
- Platform statistics
- User management
- Listing moderation
- Report management
- Review visibility

---

## Tech stack

| Layer | Technology |
|---|---|
| Website | React 19, TypeScript, Vite 8, React Router 7 |
| Styling | Custom responsive CSS |
| Forms | React Hook Form, Zod contracts |
| Maps | Leaflet, OpenStreetMap |
| API | Node.js, Express 5, TypeScript |
| Validation | Zod |
| Authentication | JWT, bcrypt |
| Database | MongoDB, Mongoose 9 |
| Image storage | Local filesystem using Multer |
| Testing | Vitest, Supertest, MongoDB Memory Server, React Testing Library |

---

## Project structure

```text
lendly/
├── apps/
│   ├── api/          Express API
│   └── web/          React website
├── packages/
│   └── shared/       Shared types, enums, and validation schemas
├── docker-compose.yml
├── package.json
└── README.md
```

---

## Design system

The website uses the Monsoon Mango palette. All colours live in CSS variables at the top of
`apps/web/src/styles.css`, and components use tokens instead of hardcoded hex values.

| Token | Value | Used for |
|---|---|---|
| `--petrol` | `#0B3C49` | Navbar, headings, footer, selected states, active bookings |
| `--mango` | `#FF9F1C` | The single main call to action per screen, pending status |
| `--lotus` | `#F28AA8` | Rating stars and small accents |
| `--mist` | `#EEF4F3` | Page background |
| `--rain` | `#CFE3E0` | Chips, card tints, image placeholders |
| `--surface` | `#FFFFFF` | Cards and forms |
| `--ink` | `#0A1F26` | Body text |
| `--muted` | `#3F5B60` | Secondary text |
| `--approved` | `#3E9B6B` | Approved status |
| `--rejected` | `#C8452F` | Rejected status |
| `--returned` | `#8FA3A8` | Returned status |

Borders use `rgba(11, 60, 73, 0.12)`, headings use Bricolage Grotesque, and body text uses DM Sans.
The layout stays flat: no gradients, no photographic backgrounds, and only the palette above.

---

## Local setup

### 1. Requirements
- Node.js 20.19+
- npm 10+
- Docker Desktop or MongoDB Community Server

### 2. Install dependencies

```bash
npm install
```

### 3. Start MongoDB

If Docker is available:

```bash
docker compose up -d mongodb
```

This starts MongoDB on `mongodb://127.0.0.1:27017`.

### 4. Configure environment

Copy the example file:

```bash
cp .env.example .env
```

The prototype can run with the default local values.

### 5. Seed demo data

```bash
npm run seed
```

This creates demo users, listings, a pending request, a completed booking, reviews, notifications, and a report.

### 6. Start development servers

```bash
npm run dev
```

- Website: `http://localhost:5173`
- API: `http://localhost:4000`
- Health check: `http://localhost:4000/health`

---

## Demo accounts

All demo users use the password:

```text
Passw0rd
```

| Role | Email |
|---|---|
| Admin | `admin@lendly.app` |
| Lender / borrower | `ananya@lendly.app` |
| Lender / borrower | `rohan@lendly.app` |
| Lender / borrower | `isha@lendly.app` |

---

## Useful commands

Run from the repository root:

```bash
# Build shared package, API, and website
npm run build

# Type-check all packages
npm run typecheck

# Run all tests
npm run test

# Lint API and website
npm run lint

# Reset local MongoDB and insert demo data
npm run seed
```

---

## Testing

The API tests use MongoDB Memory Server and cover:

- Registration and login
- Listing creation
- Nearby search
- User-controlled radius expansion
- Request submission
- Lender approval
- Request rejection
- Inventory conflict prevention
- Handover confirmation
- Return confirmation
- Transaction-linked review
- Duplicate review prevention
- Lender rating update

Website tests cover formatting utilities and the item card component.

Run all tests:

```bash
npm run test
```

---

## API overview

All protected endpoints use:

```http
Authorization: Bearer <JWT>
```

Main API groups:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`
- `PATCH /api/users/me`
- `GET /api/items`
- `POST /api/items`
- `GET /api/items/mine`
- `GET /api/items/:id`
- `PATCH /api/items/:id`
- `DELETE /api/items/:id`
- `POST /api/requests`
- `GET /api/requests/incoming`
- `GET /api/requests/outgoing`
- `PATCH /api/requests/:id/accept`
- `PATCH /api/requests/:id/reject`
- `PATCH /api/requests/:id/cancel`
- `GET /api/bookings`
- `PATCH /api/bookings/:id/handover`
- `PATCH /api/bookings/:id/return`
- `POST /api/reviews`
- `GET /api/notifications`
- `POST /api/reports`
- `GET /api/admin/stats`

---

## Local uploads

Uploaded images are stored in:

```text
apps/api/uploads
```

They are served from:

```text
http://localhost:4000/uploads/<filename>
```

For production, this should be replaced with an object storage service.

---

## Search and radius behaviour

1. The borrower selects or detects a location.
2. The default radius is 1,000 metres.
3. The API performs a `2dsphere` geospatial query.
4. Listings are filtered by text, category, condition, price, availability window, and remaining inventory.
5. If no result appears, LENDLY offers expansion options.
6. Expansion happens only when the user selects an additional distance.

The implementation intentionally does not silently increase the search radius.

---

## Current prototype limitations

- Payment processing is not implemented.
- Deposits and refunds are not implemented.
- Email delivery is not connected; password reset tokens are exposed only in development.
- Booking conflict prevention works within a single API process using a per-item lock.
- In-app messaging is not implemented.
- Verification is manual through the admin dashboard.
- Physical safety and dispute handling are represented only through reports and admin moderation.
- Cloud storage, deployment, monitoring, and backup are intentionally excluded from this prototype.

---

## Blueprint coverage

Implemented from the blueprint:

- User authentication
- Profile management
- Item listing management
- Search and discovery
- Dynamic search-radius expansion
- Item details and availability
- Borrowing request management
- Booking management
- Handover and return management
- Ratings and reviews
- Notifications
- Administration
- Responsive website interface
- Trust and safety workflows
- Automated acceptance tests

---

## License

This project is provided for academic and prototype use.
