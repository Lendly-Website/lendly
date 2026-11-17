# LENDLY API contract

Base URL during development:

```text
http://localhost:4000
```

All JSON responses use either:

```json
{
  "data": {}
}
```

or a paginated response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

Errors use:

```json
{
  "error": {
    "message": "Readable message",
    "code": "OPTIONAL_ERROR_CODE",
    "details": []
  }
}
```

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

---

## Authentication

### Register

```http
POST /api/auth/register
```

Body:

```json
{
  "name": "Ananya Deshpande",
  "email": "ananya@lendly.app",
  "password": "Passw0rd",
  "phone": "+91 90000 00001",
  "location": {
    "address": "Hostel B, Student Housing",
    "locality": "MIT-ADT University",
    "city": "Pune",
    "latitude": 18.4902,
    "longitude": 73.8342
  }
}
```

### Login

```http
POST /api/auth/login
```

### Current user

```http
GET /api/auth/me
```

### Forgot password

```http
POST /api/auth/forgot-password
```

In development, `resetToken` is returned when `EXPOSE_RESET_TOKEN=true`.

### Reset password

```http
POST /api/auth/reset-password
```

### Change password

```http
POST /api/auth/change-password
```

---

## Profiles

### Public profile

```http
GET /api/users/:id
```

### Public listings

```http
GET /api/users/:id/items
```

### Public reviews

```http
GET /api/users/:id/reviews
```

### Update own profile

```http
PATCH /api/users/me
```

---

## Listings

### Search and discover

```http
GET /api/items
```

Query parameters:

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Searches item name and description |
| `category` | string | One of the shared item categories |
| `condition` | string | `new`, `like-new`, `good`, `fair` |
| `latitude` | number | Optional geospatial search |
| `longitude` | number | Optional geospatial search |
| `radius` | number | Metres, minimum 100 |
| `startDate` | date | Optional availability filter |
| `endDate` | date | Optional availability filter |
| `minPrice` | number | Optional |
| `maxPrice` | number | Optional |
| `sort` | string | `relevance`, `distance`, `price_low`, `price_high`, `newest` |
| `page` | number | Default `1` |
| `limit` | number | Default `20`, maximum `50` |

### Own listings

```http
GET /api/items/mine
```

### Item details

```http
GET /api/items/:id
```

### Item reviews

```http
GET /api/items/:id/reviews
```

### Availability check

```http
GET /api/items/:id/availability?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

### Create listing

```http
POST /api/items
```

### Update listing

```http
PATCH /api/items/:id
```

### Remove listing

```http
DELETE /api/items/:id
```

The database record is marked `removed`; bookings history is retained.

---

## Image uploads

```http
POST /api/uploads
```

Send multipart/form-data with an `image` field.

Response:

```json
{
  "data": {
    "url": "/uploads/filename.jpg"
  }
}
```

---

## Borrowing requests

### Submit request

```http
POST /api/requests
```

Body:

```json
{
  "itemId": "ITEM_ID",
  "requestedQuantity": 1,
  "startDate": "2026-01-10T00:00:00.000Z",
  "endDate": "2026-01-12T00:00:00.000Z",
  "message": "Needed for a class demo."
}
```

### Incoming requests

```http
GET /api/requests/incoming
```

Requests and bookings always return `itemId`, `borrowerId` and `lenderId` as ids. When the
endpoint populates them, the related objects are also returned as `item`, `borrower` and
`lender`.

### Outgoing requests

```http
GET /api/requests/outgoing
```

### Request details

```http
GET /api/requests/:id
```

### Accept

```http
PATCH /api/requests/:id/accept
```

Only the lender can accept a pending request.

### Reject

```http
PATCH /api/requests/:id/reject
```

Only the lender can reject a pending request.

### Cancel

```http
PATCH /api/requests/:id/cancel
```

Only the borrower can cancel a pending request.

---

## Bookings

### List own bookings

```http
GET /api/bookings
```

### Booking details

```http
GET /api/bookings/:id
```

### Confirm handover

```http
PATCH /api/bookings/:id/handover
```

Body:

```json
{
  "initialCondition": "Good condition, includes HDMI cable"
}
```

### Confirm return

```http
PATCH /api/bookings/:id/return
```

Body:

```json
{
  "finalCondition": "Returned in good condition"
}
```

---

## Reviews

### Submit review

```http
POST /api/reviews
```

Only completed or returned bookings can be reviewed.

### Get own review for a booking

```http
GET /api/reviews/booking/:bookingId
```

---

## Notifications

### List notifications

```http
GET /api/notifications
```

### Mark one read

```http
PATCH /api/notifications/:id/read
```

### Mark all read

```http
PATCH /api/notifications/read-all
```

---

## Reports

### Submit report

```http
POST /api/reports
```

### Own reports

```http
GET /api/reports/mine
```

---

## Administration

Admin role required.

### Platform stats

```http
GET /api/admin/stats
```

### User management

```http
GET /api/admin/users
PATCH /api/admin/users/:id
```

### Listing moderation

```http
GET /api/admin/listings
PATCH /api/admin/listings/:id/moderate
```

### Report management

```http
GET /api/admin/reports
PATCH /api/admin/reports/:id
```

### Reviews

```http
GET /api/admin/reviews
```

---

## Health

```http
GET /health
```
