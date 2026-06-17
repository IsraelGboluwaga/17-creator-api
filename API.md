# Creator Card API - Specification

Complete API documentation for the Creator Card microservice.

## Base URL

```
https://{base_url}
```

No versioning. All endpoints live at root level.

---

## Endpoints

### POST /creator-cards

Create a new Creator Card.

**Request Body:**

```json
{
  "title": "string (3-100 chars, required)",
  "description": "string (max 500 chars, optional)",
  "slug": "string (5-50 chars, alphanumeric/hyphen/underscore, optional)",
  "creator_reference": "string (exactly 20 chars, required)",
  "links": [
    {
      "title": "string (1-100 chars, required)",
      "url": "string (max 200 chars, http/https, required)"
    }
  ],
  "service_rates": {
    "currency": "string (enum: NGN|USD|GBP|GHS, required if object present)",
    "rates": [
      {
        "name": "string (3-100 chars, required)",
        "description": "string (max 250 chars, required)",
        "amount": "number (positive integer, minor units, required)"
      }
    ]
  },
  "status": "string (enum: draft|published, required)",
  "access_type": "string (enum: public|private, defaults to public, optional)",
  "access_code": "string (exactly 6 alphanumeric chars, conditional)"
}
```

**Validation Rules:**
- `title`: required, 3-100 characters
- `creator_reference`: required, exactly 20 characters
- `slug`: optional; auto-generated from title if omitted; must be unique (5-50 chars)
- `status`: required, must be `draft` or `published`
- `access_type`: optional, defaults to `public`
- `access_code`: required if `access_type` is `private`, must NOT be provided if `access_type` is `public`
- `links`: optional array, each with `title` (1-100) and `url` (http/https, max 200)
- `service_rates`: optional; if present, requires `currency` and non-empty `rates` array

**Response (HTTP 200):**

```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "code": "SL02|AC01|AC05|...|null",
  "data": {
    "id": "string (ULID, 26 chars)",
    "title": "string",
    "description": "string or null",
    "slug": "string",
    "creator_reference": "string",
    "links": [...],
    "service_rates": {...},
    "status": "string",
    "access_type": "string",
    "access_code": "string or null",
    "created": "number (Unix epoch ms)",
    "updated": "number (Unix epoch ms)",
    "deleted": null
  }
}
```

**Error Responses:**

| Code | HTTP | Message | Trigger |
|------|------|---------|---------|
| SL02 | 400 | Slug is already taken | Client-provided slug exists |
| AC01 | 400 | access_code is required when access_type is private | private card missing code |
| AC05 | 400 | access_code can only be set on private cards | public card has code |
| (validator) | 400 | (field error) | Type/required/length/enum validation failure |

---

### GET /creator-cards/:slug

Retrieve a Creator Card by slug. **Public endpoint—respects draft status and access control.**

**Query Parameters:**

- `access_code` (optional): 6-character code for private cards

**Response (HTTP 200):**

```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "string (ULID)",
    "title": "string",
    "description": "string or null",
    "slug": "string",
    "creator_reference": "string",
    "links": [...],
    "service_rates": {...},
    "status": "string",
    "access_type": "string",
    "created": "number (Unix epoch ms)",
    "updated": "number (Unix epoch ms)",
    "deleted": null
  }
}
```

**Note:** `access_code` is **never** returned in retrieval responses, even for private cards accessed with the correct code.

**Error Responses (Applied in Order):**

| Code | HTTP | Message | Condition |
|------|------|---------|-----------|
| NF01 | 404 | Creator card not found | Card does not exist or is deleted |
| NF02 | 404 | Creator card not found | Card exists but is in draft status |
| AC03 | 403 | This card is private. An access code is required | Private card, no access_code provided |
| AC04 | 403 | Invalid access code | Private card, wrong access_code |

---

### DELETE /creator-cards/:slug

Delete (soft-delete) a Creator Card by slug.

**Request Body:**

```json
{
  "creator_reference": "string (exactly 20 chars, required)"
}
```

**Response (HTTP 200):**

```json
{
  "status": "success",
  "message": "Creator Card Deleted Successfully.",
  "data": {
    "id": "string (ULID)",
    "title": "string",
    "description": "string or null",
    "slug": "string",
    "creator_reference": "string",
    "links": [...],
    "service_rates": {...},
    "status": "string",
    "access_type": "string",
    "access_code": "string or null",
    "created": "number (Unix epoch ms)",
    "updated": "number (Unix epoch ms)",
    "deleted": "number (Unix epoch ms)"
  }
}
```

**Note:** `access_code` is **included** in delete responses. `deleted` is set to Unix epoch milliseconds.

**Error Responses:**

| Code | HTTP | Message |
|------|------|---------|
| NF01 | 404 | Creator card not found |
| (validator) | 400 | (field error) |

---

## Data Model

### CreatorCard Document

```javascript
{
  _id: string,                    // ULID (internally _id, serialized as id)
  title: string,
  description: string,
  slug: string,                   // Unique, indexed
  creator_reference: string,      // Exactly 20 characters
  links: [
    {
      title: string,
      url: string
    }
  ],
  service_rates: {
    currency: string,             // NGN, USD, GBP, or GHS
    rates: [
      {
        name: string,
        description: string,
        amount: number             // Positive integer (minor units)
      }
    ]
  },
  status: string,                 // draft or published
  access_type: string,            // public or private
  access_code: string,            // 6 alphanumeric chars (if private)
  created: number,                // Unix epoch milliseconds
  updated: number,                // Unix epoch milliseconds
  deleted: number | null          // null unless soft-deleted
}
```

---

## Business Rules

1. **Slug Auto-Generation:** If `slug` omitted, generated from title (lowercase, spaces→hyphens, remove special chars). If <5 chars or taken, append `-` + 6-char random suffix.

2. **Slug Uniqueness:** Client-provided slugs must be unique across all non-deleted cards. Duplicate returns `SL02` (HTTP 400).

3. **Access Control (Private Cards):**
   - If `access_type` is `private`, `access_code` is **required**
   - If `access_type` is `public`, `access_code` must **not** be provided
   - Private cards require correct `access_code` query param to retrieve

4. **Draft Visibility:** Draft cards never appear in public retrieval (`GET`), return NF02 (HTTP 404).

5. **Soft Delete:** Deleted cards marked with `deleted` timestamp, excluded from queries (paranoid mode).

6. **Response Serialization:**
   - `_id` always exposed as `id` in API responses
   - `access_code` included only in POST (create) and DELETE responses
   - `access_code` omitted from GET (retrieve) responses
   - `deleted` null unless card is deleted (then Unix timestamp)

---

## Error Response Format

All error responses follow this format:

```json
{
  "status": "error",
  "message": "Human-readable message",
  "code": "ERROR_CODE",
  "data": null
}
```

**Custom Error Codes:**

| Code | HTTP | Meaning |
|------|------|---------|
| SL02 | 400 | Slug already taken |
| AC01 | 400 | access_code required for private card |
| AC05 | 400 | access_code not allowed on public card |
| NF01 | 404 | Card not found or deleted |
| NF02 | 404 | Card is draft (not published) |
| AC03 | 403 | Private card needs access code |
| AC04 | 403 | Invalid access code |

**Framework Validation Errors:** Type/required/length/enum validation failures return HTTP 400 with framework error message.

---

## Examples

### Create a Published Card

```bash
curl -X POST https://your-base-url/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "status": "published"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Creator Card Created Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "status": "published",
    "access_type": "public",
    "access_code": null,
    "created": 1767052800000,
    "updated": 1767052800000,
    "deleted": null,
    ...
  }
}
```

### Retrieve a Card

```bash
curl https://your-base-url/creator-cards/george-cooks
```

**Response:** (no `access_code` field)
```json
{
  "status": "success",
  "message": "Creator Card Retrieved Successfully.",
  "data": {
    "id": "01JG8XYZA2B3C4D5E6F7G8H9J0",
    "title": "George Cooks",
    ...
  }
}
```

### Duplicate Slug Error

```bash
curl -X POST https://your-base-url/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Another George",
    "slug": "george-cooks",
    "creator_reference": "crt_different123",
    "status": "published"
  }'
```

**Response (HTTP 400):**
```json
{
  "status": "error",
  "message": "Slug is already taken",
  "code": "SL02"
}
```

---

## Notes

- **No authentication** required for any endpoint
- **CORS enabled** for cross-origin requests
- **No URL versioning** (routes at `/creator-cards`, not `/api/v1/...`)
- **JSON only** — all requests/responses are `application/json`
- **Timestamps** in Unix epoch milliseconds (e.g., `1767052800000`)
