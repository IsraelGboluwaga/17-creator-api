# Testing Guide

Automated tests for the Creator Card feature. They run entirely in-memory — no
MongoDB connection is required.

## Running

```bash
npm test          # run the full suite
npm run lint      # run eslint
```

## How it works

Tests run in **mock-model mode**. `test/setup.js` (loaded first via
`.mocharc.json`) sets `USE_MOCK_MODEL=1` before any repository/model code is
required. In this mode `@app/repository/*` calls are served by
`@app/mock-models` stubs instead of hitting a database.

Each test controls what the repository returns using
`MockModelStubs.CreatorCard.configureStubs(...)`, wrapped by the
`stubManager()` helper in `test/helpers/creator-card.js` so stubs are reverted
after every test (no cross-test leakage).

Application logging is silenced during tests (`PINO_LOG_LEVEL=silent`) because
negative-path cases intentionally trigger `appLogger.errorX(...)`.

## Layout

```
test/
  setup.js                                   # forces mock-model mode + quiet logs
  helpers/creator-card.js                    # fixtures + stub manager
  services/creator-card/
    create-card.test.js                      # create business logic + validation
    get-card.test.js                         # access control (draft/private/codes)
    delete-card.test.js                      # ownership + soft delete
    generate-slug.test.js                    # slug generation/validation (pure fns)
  endpoints/creator-card/
    creator-card.endpoints.test.js           # HTTP layer: status codes + error `code`
```

## Coverage summary

**Service layer** (business logic):

- Create: public/private cards, slug auto-generation, `access_type` default,
  array-size limits, integer-amount enforcement, slug-format and uniqueness
  rules, validator failures.
- Get: published/public success, `NF01` (missing), `NF02` (draft), `AC03`
  (private without code), `AC04` (wrong code, including length-mismatch
  constant-time guard), private success, validator failure.
- Delete: owner soft-delete, `NF01` (missing / non-owner), validator failure.
- Slug helpers: generation, validation, random suffix — and an assertion that
  the module contains **no regex** (per the codebase's no-regex rule).

**Endpoint layer** (HTTP): the mock server exercises each route end-to-end and
asserts the HTTP status code and the error `code` field in the response body
for representative success and failure cases.

## Scripts

| Script          | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `npm start`     | Run the server (`node bootstrap.js`)               |
| `npm run dev`   | Run the server for local development               |
| `npm run build` | No-op — this Node.js service has no build step     |
| `npm run lint`  | Lint the codebase with eslint                      |
| `npm test`      | Run the mocha test suite in mock-model mode        |
