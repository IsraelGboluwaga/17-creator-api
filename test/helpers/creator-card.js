// Shared test helpers for the Creator Card feature.
//
// Provides:
//  - buildValidPayload(): a valid create-card request body (override-able)
//  - buildCardDoc(): a realistic persisted card document (as the repository
//    would return it)
//  - stubManager(): a small helper around MockModelStubs.configureStubs that
//    tracks and reverts stubs so tests stay isolated.

const { MockModelStubs } = require('@app/mock-models');

const cardStubs = MockModelStubs.CreatorCard;

// A valid POST /creator-cards body. Pass overrides to tweak individual fields.
function buildValidPayload(overrides = {}) {
  return {
    title: 'Jane Doe Photography',
    description: 'Portrait and event photography services.',
    creator_reference: 'creator_ref_00000001',
    links: [{ title: 'Portfolio', url: 'https://janedoe.example.com' }],
    service_rates: {
      currency: 'NGN',
      rates: [
        {
          name: 'Portrait Session',
          description: 'A 1-hour studio portrait session.',
          amount: 5000000,
        },
      ],
    },
    status: 'published',
    access_type: 'public',
    ...overrides,
  };
}

// A persisted creator-card document (shape the repository hands back to a
// service). `_id` is present so serialization can map it to `id`.
function buildCardDoc(overrides = {}) {
  const now = Date.now();
  return {
    _id: '01HZX0000000000000000000AB',
    title: 'Jane Doe Photography',
    description: 'Portrait and event photography services.',
    slug: 'jane-doe-photography',
    creator_reference: 'creator_ref_00000001',
    links: [{ title: 'Portfolio', url: 'https://janedoe.example.com' }],
    service_rates: {
      currency: 'NGN',
      rates: [
        {
          name: 'Portrait Session',
          description: 'A 1-hour studio portrait session.',
          amount: 5000000,
        },
      ],
    },
    status: 'published',
    access_type: 'public',
    access_code: null,
    created: now,
    updated: now,
    deleted: null,
    ...overrides,
  };
}

// Tracks configured stubs and reverts them all (in reverse order) so a test's
// stubbing does not leak into the next one. Use in an afterEach hook.
function stubManager() {
  const active = [];

  return {
    configure(config) {
      const handle = cardStubs.configureStubs(config);
      active.push(handle);
      return handle;
    },
    revertAll() {
      while (active.length) {
        active.pop().revert();
      }
    },
  };
}

module.exports = {
  buildValidPayload,
  buildCardDoc,
  stubManager,
};
