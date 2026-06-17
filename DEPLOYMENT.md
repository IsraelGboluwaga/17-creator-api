# Creator Card API - Deployment Guide

This guide covers deploying the Creator Card microservice API to Railway with MongoDB Atlas.

## Prerequisites

- GitHub account with access to the repository
- Railway account (https://railway.app/)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Set up MongoDB Atlas

1. Create a MongoDB Atlas cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user with a strong password
3. Whitelist your Railway IP (or use 0.0.0.0/0 for development)
4. Copy the connection string (it will look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/creator-card?retryWrites=true&w=majority
   ```

## Step 2: Deploy to Railway

1. Go to https://railway.app/dashboard
2. Create a new project
3. Select "Deploy from GitHub repo"
4. Select the repository: `IsraelGboluwaga/17-creator-api`
5. Select the branch: `execution`
6. Railway will auto-detect and deploy

## Step 3: Configure Environment Variables

In Railway project settings, add:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/creator-card?retryWrites=true&w=majority
PORT=3000
JWT_SECRET=your-secret-key
```

## Step 4: Get Your Base URL

Once deployed, Railway will provide a URL like:
```
https://your-project-xyz.railway.app
```

This is your **base URL** for the API.

## API Endpoints

All endpoints are at the base URL root (no `/api/v1` prefix):

### Create Creator Card
```
POST https://your-base-url/creator-cards
Content-Type: application/json

{
  "title": "George Cooks",
  "description": "Weekly cooking podcast",
  "slug": "george-cooks",
  "creator_reference": "crt_8f2k1m9x4p7w3q5z",
  "links": [
    {"title": "YouTube", "url": "https://youtube.com/@georgecooks"}
  ],
  "service_rates": {
    "currency": "NGN",
    "rates": [
      {"name": "IG Story", "description": "One mention", "amount": 5000000}
    ]
  },
  "status": "published",
  "access_type": "public"
}
```

### Retrieve Creator Card
```
GET https://your-base-url/creator-cards/george-cooks
GET https://your-base-url/creator-cards/private-card?access_code=A1B2C3
```

### Delete Creator Card
```
DELETE https://your-base-url/creator-cards/george-cooks
Content-Type: application/json

{
  "creator_reference": "crt_8f2k1m9x4p7w3q5z"
}
```

## Error Codes

The API returns custom error codes for business rule violations:

| Code | HTTP | Meaning |
|------|------|---------|
| SL02 | 400 | Slug is already taken |
| AC01 | 400 | access_code required for private card |
| AC05 | 400 | access_code not allowed on public card |
| NF01 | 404 | Card not found |
| NF02 | 404 | Card exists but is draft (not published) |
| AC03 | 403 | Private card requires access code |
| AC04 | 403 | Invalid access code |

## Testing

Test the endpoints using curl:

```bash
# Create a card
curl -X POST https://your-base-url/creator-cards \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Card",
    "creator_reference": "crt_test123456789",
    "status": "published"
  }'

# Retrieve the card
curl https://your-base-url/creator-cards/test-card

# Delete the card
curl -X DELETE https://your-base-url/creator-cards/test-card \
  -H "Content-Type: application/json" \
  -d '{"creator_reference": "crt_test123456789"}'
```

## Important Notes

- **No versioning in URLs**: Endpoints are at `/creator-cards`, not `/api/v1/creator-cards`
- **No authentication required**: All endpoints are publicly accessible
- **Base URL only in submission**: When submitting, provide only the base URL (e.g., `https://your-project.railway.app`), not with endpoint paths
- **Soft delete**: Deleted cards are soft-deleted (marked with timestamp) and won't appear in public retrieval
- **Access control**: Draft cards and private cards without correct access codes return 404/403 appropriately
