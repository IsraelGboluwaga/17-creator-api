const crypto = require('crypto');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const serializeCard = require('./serialize-card');

async function getCard(serviceData) {
  let response;

  try {
    const { slug } = serviceData;
    // eslint-disable-next-line camelcase
    const { access_code } = serviceData;

    // Step 1: Check if card exists and is not deleted
    const card = await CreatorCardRepository.findOne({
      query: { slug, deleted: 0 },
    });

    if (!card) {
      throwAppError(CreatorCardMessages.CREATOR_CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    // Step 2: Check if card is in draft status
    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.CREATOR_CARD_DRAFT, ERROR_CODE.NF02);
    }

    // Step 3: Check if card is private and access code is required
    if (card.access_type === 'private') {
      // eslint-disable-next-line camelcase
      if (!access_code) {
        throwAppError(CreatorCardMessages.PRIVATE_CARD_ACCESS_CODE_REQUIRED, ERROR_CODE.AC03);
      }

      // Step 4: Validate access code (constant-time comparison to prevent timing attacks)
      try {
        // eslint-disable-next-line camelcase
        const isValidCode = crypto.timingSafeEqual(
          // eslint-disable-next-line camelcase
          Buffer.from(access_code || ''),
          Buffer.from(card.access_code || '')
        );
        if (!isValidCode) {
          throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.AC04);
        }
      } catch {
        // timingSafeEqual throws if buffers are different lengths; treat as invalid
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.AC04);
      }
    }

    // Serialize without access_code
    response = serializeCard(card, false);
  } catch (error) {
    appLogger.errorX(error, 'get-card-error');
    throw error;
  }

  return response;
}

module.exports = getCard;
