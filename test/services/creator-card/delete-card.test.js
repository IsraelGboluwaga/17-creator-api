const { expect } = require('chai');
const deleteCard = require('@app/services/creator-card/delete-card');
const { buildCardDoc, stubManager } = require('../../helpers/creator-card');

const OWNER_REF = 'creator_ref_00000001';
const OTHER_REF = 'creator_ref_99999999';

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

describe('creator-card/delete-card', () => {
  const stubs = stubManager();

  function stubFoundCard(overrides) {
    stubs.configure({
      method: 'findOne',
      overrideFn: () => buildCardDoc(overrides),
    });
    // delete-card soft-deletes, then re-reads via deleteOne/findOne.
    stubs.configure({ method: 'deleteOne' });
  }

  afterEach(() => {
    stubs.revertAll();
  });

  it('soft-deletes a card owned by the creator and returns it with access_code', async () => {
    stubFoundCard({ creator_reference: OWNER_REF, access_code: 'SECRET' });

    const result = await deleteCard({ slug: 'jane-doe-photography', creator_reference: OWNER_REF });

    expect(result.id).to.equal('01HZX0000000000000000000AB');
    expect(result).to.have.property('access_code');
    expect(result).to.not.have.property('_id');
  });

  it('returns NF01 when the card does not exist', async () => {
    stubs.configure({ method: 'findOne', mockNull: true });

    await expectErrorCode(
      deleteCard({ slug: 'missing-slug', creator_reference: OWNER_REF }),
      'NF01'
    );
  });

  it('returns NF01 when the creator_reference does not own the card', async () => {
    stubFoundCard({ creator_reference: OWNER_REF });

    await expectErrorCode(
      deleteCard({ slug: 'jane-doe-photography', creator_reference: OTHER_REF }),
      'NF01'
    );
  });

  it('rejects a creator_reference that is not exactly 20 characters', async () => {
    let thrown;
    try {
      await deleteCard({ slug: 'jane-doe-photography', creator_reference: 'too-short' });
    } catch (error) {
      thrown = error;
    }
    expect(thrown, 'expected validation to throw').to.be.an('error');
  });
});
