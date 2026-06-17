// Test bootstrap.
//
// Force mock-model mode so repository operations are stubbed in-memory via
// `@app/mock-models`. This lets the full service/endpoint stack run during
// tests without a real MongoDB connection.
//
// This must be loaded BEFORE any spec file (and therefore before the
// repository/model layer is required), which is why it is wired up as the
// first `require` entry in `.mocharc.json`.
process.env.USE_MOCK_MODEL = '1';

// Silence application logging during tests. Negative-path tests deliberately
// trigger `appLogger.errorX(...)` calls, which would otherwise flood the
// reporter output with expected error logs.
process.env.PINO_LOG_LEVEL = 'silent';
