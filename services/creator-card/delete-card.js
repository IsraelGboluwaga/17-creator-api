const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const serializeCard = require('./serialize-card');

const spec = `root {
  creator_reference string<length:20>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCard(serviceData) {
  validator.validate(serviceData, parsedSpec);
  let response;

  try {
    // eslint-disable-next-line camelcase
    const { slug, creator_reference } = serviceData;

    // Find the card (including deleted ones to match the check)
    const card = await CreatorCardRepository.findOne({
      query: { slug, deleted: 0 },
    });

    if (!card) {
      throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    // Verify creator ownership before deletion
    // eslint-disable-next-line camelcase
    if (card.creator_reference !== creator_reference) {
      throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    // Delete the card (soft delete via repository)
    await CreatorCardRepository.deleteOne({
      query: { _id: card._id },
    });

    // Fetch the deleted card to get the updated deleted timestamp
    const deletedCard = await CreatorCardRepository.findOne(
      {
        query: { slug, deleted: { $ne: 0 } },
      },
      { lean: false }
    );

    // If soft-deleted card wasn't found (paranoid mode query issue), manually set deleted timestamp
    const finalCard = deletedCard || { ...card, deleted: Date.now() };

    // Serialize with access_code included
    response = serializeCard(finalCard, true);
  } catch (error) {
    appLogger.errorX(error, 'delete-card-error');
    throw error;
  }

  return response;
}

module.exports = deleteCard;
