const { createHandler } = require('@app-core/server');
const createCardService = require('@app/services/creator-card/create-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = rc.body;

    const response = await createCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_CREATED,
      data: response,
    };
  },
});
