const { expect } = require('chai');
const createMockServer = require('@app-core/mock-server');
const { buildValidPayload, buildCardDoc, stubManager } = require('../../helpers/creator-card');

// Spin up an in-memory server with only the creator-card endpoints registered.
const server = createMockServer(['endpoints/creator-card']);

const OWNER_REF = 'creator_ref_00000001';

describe('creator-card endpoints (HTTP layer)', () => {
  const stubs = stubManager();

  afterEach(() => {
    stubs.revertAll();
  });

  describe('POST /creator-cards', () => {
    it('returns 200 with the created card', async () => {
      stubs.configure({ method: 'findOne', mockNull: true });
      stubs.configure({
        method: 'create',
        overrideFn: (data) => ({ _id: '01HZX0000000000000000000AB', ...data }),
      });

      const response = await server.post('/creator-cards', { body: buildValidPayload() });

      expect(response.statusCode).to.equal(200);
      expect(response.data.status).to.equal('success');
      expect(response.data.data.id).to.equal('01HZX0000000000000000000AB');
    });

    it('returns 400 with code AC05 for a public card carrying an access_code', async () => {
      const response = await server.post('/creator-cards', {
        body: buildValidPayload({ access_type: 'public', access_code: 'ABC123' }),
      });

      expect(response.statusCode).to.equal(400);
      expect(response.data.status).to.equal('error');
      expect(response.data.code).to.equal('AC05');
    });
  });

  describe('GET /creator-cards/:slug', () => {
    it('returns 200 with a published public card (no access_code)', async () => {
      stubs.configure({
        method: 'findOne',
        overrideFn: () => buildCardDoc({ status: 'published', access_type: 'public' }),
      });

      const response = await server.get('/creator-cards/jane-doe-photography');

      expect(response.statusCode).to.equal(200);
      expect(response.data.data.slug).to.equal('jane-doe-photography');
      expect(response.data.data).to.not.have.property('access_code');
    });

    it('returns 404 with code NF01 when the card does not exist', async () => {
      stubs.configure({ method: 'findOne', mockNull: true });

      const response = await server.get('/creator-cards/missing-slug');

      expect(response.statusCode).to.equal(404);
      expect(response.data.code).to.equal('NF01');
    });

    it('returns 403 with code AC04 for a private card with a wrong access_code', async () => {
      stubs.configure({
        method: 'findOne',
        overrideFn: () =>
          buildCardDoc({ status: 'published', access_type: 'private', access_code: 'SECRET' }),
      });

      const response = await server.get('/creator-cards/private-card', {
        query: { access_code: 'WRONG1' },
      });

      expect(response.statusCode).to.equal(403);
      expect(response.data.code).to.equal('AC04');
    });
  });

  describe('DELETE /creator-cards/:slug', () => {
    it('returns 200 and the deleted card for the owner', async () => {
      stubs.configure({
        method: 'findOne',
        overrideFn: () => buildCardDoc({ creator_reference: OWNER_REF, access_code: 'SECRET' }),
      });
      stubs.configure({ method: 'deleteOne' });

      const response = await server.delete('/creator-cards/jane-doe-photography', {
        body: { creator_reference: OWNER_REF },
      });

      expect(response.statusCode).to.equal(200);
      expect(response.data.data.id).to.equal('01HZX0000000000000000000AB');
    });

    it('returns 404 with code NF01 when a non-owner attempts deletion', async () => {
      stubs.configure({
        method: 'findOne',
        overrideFn: () => buildCardDoc({ creator_reference: OWNER_REF }),
      });

      const response = await server.delete('/creator-cards/jane-doe-photography', {
        body: { creator_reference: 'creator_ref_99999999' },
      });

      expect(response.statusCode).to.equal(404);
      expect(response.data.code).to.equal('NF01');
    });
  });
});
