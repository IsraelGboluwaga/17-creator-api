const { expect } = require('chai');
const getCard = require('@app/services/creator-card/get-card');
const { buildCardDoc, stubManager } = require('../../helpers/creator-card');

async function expectErrorCode(promise, code) {
  let thrown;
  try {
    await promise;
  } catch (error) {
    thrown = error;
  }
  expect(thrown, 'expected the call to throw').to.be.an('error');
  expect(thrown.errorCode).to.equal(code);
  return thrown;
}

describe('creator-card/get-card', () => {
  const stubs = stubManager();

  // Make findOne return a specific card document.
  function stubFoundCard(overrides) {
    stubs.configure({
      method: 'findOne',
      overrideFn: () => buildCardDoc(overrides),
    });
  }

  afterEach(() => {
    stubs.revertAll();
  });

  it('returns a published public card without the access_code', async () => {
    stubFoundCard({ status: 'published', access_type: 'public' });

    const result = await getCard({ slug: 'jane-doe-photography' });

    expect(result.id).to.equal('01HZX0000000000000000000AB');
    expect(result.slug).to.equal('jane-doe-photography');
    expect(result).to.not.have.property('access_code');
    expect(result).to.not.have.property('_id');
  });

  it('returns NF01 when the card does not exist', async () => {
    stubs.configure({ method: 'findOne', mockNull: true });

    await expectErrorCode(getCard({ slug: 'missing-slug' }), 'NF01');
  });

  it('returns NF02 when the card is a draft', async () => {
    stubFoundCard({ status: 'draft' });

    await expectErrorCode(getCard({ slug: 'draft-card' }), 'NF02');
  });

  it('returns AC03 when a private card is requested without an access_code', async () => {
    stubFoundCard({ status: 'published', access_type: 'private', access_code: 'SECRET' });

    await expectErrorCode(getCard({ slug: 'private-card' }), 'AC03');
  });

  it('returns AC04 when the access_code is wrong (same length)', async () => {
    stubFoundCard({ status: 'published', access_type: 'private', access_code: 'SECRET' });

    await expectErrorCode(getCard({ slug: 'private-card', access_code: 'WRONG1' }), 'AC04');
  });

  it('returns AC04 when the access_code length differs (constant-time guard)', async () => {
    stubFoundCard({ status: 'published', access_type: 'private', access_code: 'SECRET' });

    await expectErrorCode(getCard({ slug: 'private-card', access_code: 'XX' }), 'AC04');
  });

  it('returns the private card when the access_code is correct', async () => {
    stubFoundCard({ status: 'published', access_type: 'private', access_code: 'SECRET' });

    const result = await getCard({ slug: 'private-card', access_code: 'SECRET' });

    expect(result.access_type).to.equal('private');
    expect(result).to.not.have.property('access_code');
  });

  it('rejects a request with a missing slug via the validator', async () => {
    let thrown;
    try {
      await getCard({});
    } catch (error) {
      thrown = error;
    }
    expect(thrown, 'expected validation to throw').to.be.an('error');
  });
});
