const { expect } = require('chai');
const createCard = require('@app/services/creator-card/create-card');
const { buildValidPayload, stubManager } = require('../../helpers/creator-card');

// Assert that a service call rejects with a given application error code.
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

describe('creator-card/create-card', () => {
  const stubs = stubManager();

  // For a successful create the slug must be free (findOne -> null) and the
  // create call returns the persisted document.
  function stubSuccessfulCreate() {
    stubs.configure({ method: 'findOne', mockNull: true });
    stubs.configure({
      method: 'create',
      overrideFn: (data) => ({ _id: '01HZX0000000000000000000AB', ...data }),
    });
  }

  afterEach(() => {
    stubs.revertAll();
  });

  it('creates a public card and returns the serialized card with id', async () => {
    stubSuccessfulCreate();

    const result = await createCard(buildValidPayload());

    expect(result).to.include({
      id: '01HZX0000000000000000000AB',
      title: 'Jane Doe Photography',
      status: 'published',
      access_type: 'public',
    });
    expect(result).to.not.have.property('_id');
    expect(result.created).to.be.a('number');
  });

  it('auto-generates a slug from the title when none is provided', async () => {
    stubSuccessfulCreate();

    const result = await createCard(buildValidPayload({ title: 'My Cool Service!' }));

    expect(result.slug).to.equal('my-cool-service');
  });

  it('defaults access_type to public when omitted', async () => {
    stubSuccessfulCreate();

    const payload = buildValidPayload();
    delete payload.access_type;

    const result = await createCard(payload);

    expect(result.access_type).to.equal('public');
  });

  it('creates a private card and includes the access_code in the response', async () => {
    stubSuccessfulCreate();

    const result = await createCard(
      buildValidPayload({ access_type: 'private', access_code: 'ABC123' })
    );

    expect(result.access_type).to.equal('private');
    expect(result.access_code).to.equal('ABC123');
  });

  it('rejects a private card with no access_code (AC01)', async () => {
    await expectErrorCode(createCard(buildValidPayload({ access_type: 'private' })), 'AC01');
  });

  it('rejects a public card that supplies an access_code (AC05)', async () => {
    await expectErrorCode(
      createCard(buildValidPayload({ access_type: 'public', access_code: 'ABC123' })),
      'AC05'
    );
  });

  it('rejects a client-provided slug with invalid characters', async () => {
    await expectErrorCode(
      createCard(buildValidPayload({ slug: 'not a valid slug!' })),
      'INVALID_REQUEST_DATA'
    );
  });

  it('rejects a non-integer service rate amount', async () => {
    const payload = buildValidPayload();
    payload.service_rates.rates[0].amount = 5000.99;

    await expectErrorCode(createCard(payload), 'INVALID_REQUEST_DATA');
  });

  it('rejects more than 50 links', async () => {
    const links = [];
    for (let i = 0; i < 51; i++) {
      links.push({ title: `Link ${i}`, url: `https://example.com/${i}` });
    }

    await expectErrorCode(createCard(buildValidPayload({ links })), 'INVALID_REQUEST_DATA');
  });

  it('rejects more than 20 service rates', async () => {
    const rates = [];
    for (let i = 0; i < 21; i++) {
      rates.push({ name: `Rate ${i}`, description: 'A service tier.', amount: 1000 });
    }

    await expectErrorCode(
      createCard(buildValidPayload({ service_rates: { currency: 'NGN', rates } })),
      'INVALID_REQUEST_DATA'
    );
  });

  it('rejects a client-provided slug that is already taken (SL02)', async () => {
    // findOne returns a truthy document -> slug already exists.
    stubs.configure({ method: 'findOne', docConfig: { slug: 'taken-slug' } });

    await expectErrorCode(createCard(buildValidPayload({ slug: 'taken-slug' })), 'SL02');
  });

  it('rejects an invalid payload (title too short) via the validator', async () => {
    let thrown;
    try {
      await createCard(buildValidPayload({ title: 'ab' }));
    } catch (error) {
      thrown = error;
    }
    expect(thrown, 'expected validation to throw').to.be.an('error');
  });
});
