# Creator Card API - Test Cases

Use these test cases to verify the API implementation. Replace `BASE_URL` with your local development URL (http://localhost:3000) or deployment URL.

## Valid Test Cases (Expected: HTTP 200)

### Test 1: Create Full Card
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "George Cooks",
    "description": "Weekly cooking podcast",
    "slug": "george-cooks",
    "creator_reference": "crt_8f2k1m9x4p7w3q5z",
    "links": [{"title": "YouTube", "url": "https://youtube.com/@georgecooks"}],
    "service_rates": {
      "currency": "NGN",
      "rates": [{"name": "IG Story Post", "description": "One mention", "amount": 5000000}]
    },
    "status": "published"
  }'
```
**Expected**: HTTP 200, response includes `id` (not `_id`), `access_code: null`

### Test 2: Slug Auto-Generation
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ada Designs Things",
    "creator_reference": "crt_a1b2c3d4e5f6g7h8",
    "status": "published"
  }'
```
**Expected**: HTTP 200, slug auto-generated as "ada-designs-things"

### Test 3: Private Card with Access Code
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "VIP Rate Card",
    "creator_reference": "crt_x9y8z7w6v5u4t3s2",
    "status": "published",
    "access_type": "private",
    "access_code": "A1B2C3"
  }'
```
**Expected**: HTTP 200, includes `access_code: "A1B2C3"`

### Test 4: Retrieve Published Card
```bash
curl BASE_URL/creator-cards/george-cooks
```
**Expected**: HTTP 200, card data without `access_code` field

### Test 5: Retrieve Private Card with Correct Code
```bash
curl "BASE_URL/creator-cards/vip-rate-card?access_code=A1B2C3"
```
**Expected**: HTTP 200, card data without `access_code` field

### Test 6: Delete Card
```bash
curl -X DELETE BASE_URL/creator-cards/ada-designs-things \
  -H "Content-Type: application/json" \
  -d '{"creator_reference": "crt_a1b2c3d4e5f6g7h8"}'
```
**Expected**: HTTP 200, deleted card with `deleted` timestamp, includes `access_code`

---

## Invalid Test Cases (Expected: HTTP 400/403/404)

### Test 7: Duplicate Slug
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Another George",
    "slug": "george-cooks",
    "creator_reference": "crt_m1n2b3v4c5x6z7l8",
    "status": "published"
  }'
```
**Expected**: HTTP 400, `code: "SL02"`, message: "Slug is already taken"

### Test 8: Missing access_code on Private Card
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Secret Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "published",
    "access_type": "private"
  }'
```
**Expected**: HTTP 400, `code: "AC01"`, message contains "access_code is required"

### Test 9: access_code on Public Card
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Public Card",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "published",
    "access_type": "public",
    "access_code": "A1B2C3"
  }'
```
**Expected**: HTTP 400, `code: "AC05"`, message contains "can only be set on private"

### Test 10: Invalid Status Enum
```bash
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bad Status",
    "creator_reference": "crt_q1w2e3r4t5y6u7i8",
    "status": "archived"
  }'
```
**Expected**: HTTP 400 (validator error, no custom code)

### Test 11: Non-existent Card
```bash
curl BASE_URL/creator-cards/does-not-exist-123
```
**Expected**: HTTP 404, `code: "NF01"`, message: "Creator card not found"

### Test 12: Draft Card (Not Publicly Retrievable)
```bash
# First create a draft card
curl -X POST BASE_URL/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Draft Card",
    "slug": "draft-card",
    "creator_reference": "crt_draft1234567890",
    "status": "draft"
  }'

# Then try to retrieve it
curl BASE_URL/creator-cards/draft-card
```
**Expected**: HTTP 404, `code: "NF02"`, message: "Creator card not found"

### Test 13: Private Card Without Access Code
```bash
curl BASE_URL/creator-cards/vip-rate-card
```
**Expected**: HTTP 403, `code: "AC03"`, message contains "access code is required"

### Test 14: Private Card With Wrong Access Code
```bash
curl "BASE_URL/creator-cards/vip-rate-card?access_code=WRONG1"
```
**Expected**: HTTP 403, `code: "AC04"`, message: "Invalid access code"

### Test 15: Delete Non-existent Card
```bash
curl -X DELETE BASE_URL/creator-cards/does-not-exist-123 \
  -H "Content-Type: application/json" \
  -d '{"creator_reference": "crt_q1w2e3r4t5y6u7i8"}'
```
**Expected**: HTTP 404, `code: "NF01"`, message: "Creator card not found"

### Test 16: Retrieve Deleted Card
```bash
# After Test 6, try to retrieve the deleted card
curl BASE_URL/creator-cards/ada-designs-things
```
**Expected**: HTTP 404, `code: "NF01"`, message: "Creator card not found"

---

## Testing Tips

- **Response Format**: All responses should have `{ status, message, code?, data? }`
- **ID Field**: Responses use `id` (never `_id`)
- **access_code Visibility**: Only included in POST (create) and DELETE responses, never in GET
- **HTTP Status Codes**: Validate both the status code AND the `code` field
- **Slug Normalization**: Spaces become hyphens, non-alphanumeric removed, auto-suffix if too short or taken
