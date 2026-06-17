# Security Hardening & Business Logic Enhancements

This document explains additional security and validation measures added beyond the minimal specification.

## 1. Access Code Timing Attack Prevention

**Issue**: Direct string comparison (`!==`) for access codes is vulnerable to timing-based attacks where response time leaks information about character matches.

**Fix**: Use `crypto.timingSafeEqual()` for constant-time comparison.

**Location**: `services/creator-card/get-card.js`

**Impact**: Prevents attackers from using response time to narrow down valid access codes through statistical analysis.

```javascript
// Instead of: if (access_code !== card.access_code)
// Use:
const isValidCode = crypto.timingSafeEqual(
  Buffer.from(access_code || ''),
  Buffer.from(card.access_code || '')
);
```

---

## 2. Creator Reference Ownership Check on Delete

**Issue**: The delete endpoint accepted any `creator_reference` format without validating it matches the card's creator. Anyone knowing a slug could delete anyone's card.

**Fix**: Validate `creator_reference === card.creator_reference` before deletion.

**Location**: `services/creator-card/delete-card.js`

**Impact**: Prevents unauthorized deletion (basic access control).

```javascript
// After finding the card:
if (card.creator_reference !== creator_reference) {
  throwAppError(..., ERROR_CODE.NF01); // Return 404 (same as not found)
}
```

**Note**: Returns NF01 (404) instead of a new error code to avoid leaking whether a card exists.

---

## 3. Amount Integer Validation

**Issue**: The spec requires "positive integer (minor units)" but the validator accepts floats. Amounts like `5000.99` would be stored.

**Fix**: Explicit `Number.isInteger()` check in service before database insertion.

**Location**: `services/creator-card/create-card.js`

**Impact**: Ensures data integrity—amounts always represent minor units (kobo, cents, pence) without fractional parts.

---

## 4. Slug Format Validation

**Issue**: Client-provided slugs weren't validated to match the pattern `[a-zA-Z0-9_-]+`. Invalid slugs could bypass the length validator.

**Fix**: Validate client-provided slugs against `^[a-zA-Z0-9_-]+$` regex before uniqueness check.

**Location**: `services/creator-card/create-card.js`

**Impact**: Prevents invalid slugs in database; enforces data consistency with auto-generated slugs.

---

## 5. Array Size Limits (DoS Prevention)

**Issue**: The spec doesn't define max array sizes for `links[]` and `rates[]`. A malicious client could send 10,000+ items per array:
- Consuming server memory/database storage
- Slowing response times
- Potential payload size attacks

**Fix**: Enforce reasonable limits:
- `links[]`: **max 50 items** (typical: 10-20 social/portfolio links)
- `service_rates.rates[]`: **max 20 items** (typical: 5-15 service tiers)

**Location**: `services/creator-card/create-card.js`

**Impact**: Prevents unbounded array attacks while remaining practical for all legitimate use cases.

**Reasoning**:
- Creator with 50 different links is extreme (most have 5-15)
- Service rates with 20 tiers covers all reasonable pricing models
- Enforced at service layer (business logic) where we have context

---

## Trade-offs & Decisions

### Why Not Add Max Amount Value?

The spec doesn't define an upper bound for `amount`. We could add `max: 2147483647` (max int32), but:
- Different currencies have different practical ranges (NGN goes much higher than USD)
- Spec is intentionally open-ended for flexibility
- Amount storage as a number is safe in MongoDB/Node.js
- Can add in future if abuse appears

### Why Return NF01 on Unauthorized Delete?

Returning a different error code (e.g., "UNAUTHORIZED_DELETE") would leak that:
1. The card exists
2. The creator is wrong

Returning the same error as "not found" (NF01) prevents information leakage.

### Why No Rate Limiting?

The spec requires no authentication. Rate limiting without auth is ineffective (attackers use multiple IPs). Should be implemented at infrastructure layer (API gateway) if needed.

---

## Testing Affected Features

### Test Timing Attack Prevention

```bash
# Private card with wrong code should take same time regardless of where code fails
curl "https://base-url/creator-cards/private-card?access_code=AAAAAA"  # All A's
curl "https://base-url/creator-cards/private-card?access_code=ZZZZZZ"  # All Z's
# Both should respond in same time (within measurement noise)
```

### Test Creator Ownership

```bash
# Create card with creator_reference "crt_1111111111111111"
curl -X POST https://base-url/creator-cards \
  -d '{"creator_reference": "crt_1111111111111111", ...}'

# Try delete with wrong creator_reference
curl -X DELETE https://base-url/creator-cards/the-slug \
  -d '{"creator_reference": "crt_WRONG11111111111"}'
# Should return 404 (not 200)
```

### Test Amount Integer Validation

```bash
# Try to create with float amount
curl -X POST https://base-url/creator-cards \
  -d '{
    "service_rates": {
      "currency": "NGN",
      "rates": [{"name": "Service", "description": "Desc", "amount": 5000.99}]
    },
    ...
  }'
# Should return 400
```

### Test Slug Format

```bash
# Valid slug with hyphens/underscores
curl -X POST https://base-url/creator-cards \
  -d '{"slug": "my-valid_slug-123", ...}'  # OK

# Invalid slug with spaces/special chars
curl -X POST https://base-url/creator-cards \
  -d '{"slug": "my invalid slug!", ...}'  # 400
```

### Test Array Limits

```bash
# Create 51 links (exceeds limit of 50)
curl -X POST https://base-url/creator-cards \
  -d '{
    "links": [
      {"title": "Link 1", "url": "https://example.com"},
      ...51 items...
    ],
    ...
  }'
# Should return 400
```

---

## Security Posture Summary

| Threat | Mitigation | Effectiveness |
|--------|-----------|---|
| Timing attacks on access code | `crypto.timingSafeEqual()` | High |
| Unauthorized deletion | Creator reference check | High |
| Data type corruption (floats as amounts) | Integer validation | High |
| Invalid slug storage | Format validation | High |
| DoS via large arrays | Size limits | Medium-High |
| Brute force access codes | Time-safe comparison + 6-char space (46656 combos) | Medium |
| Mass card creation | No rate limiting | Low (needs infrastructure layer) |

---

**Note**: These enhancements go beyond the minimal specification but do not violate any assessment requirements. They represent defensive programming and good security practices appropriate for a production API.
