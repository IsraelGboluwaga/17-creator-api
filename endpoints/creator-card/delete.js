const { createHandler } = require('@app-core/server');
const deleteCardService = require('@app/services/creator-card/delete-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const payload = {
      slug: rc.params.slug,
      creator_reference: rc.body.creator_reference,
    };

    const response = await deleteCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_DELETED,
      data: response,
    };
  },
});
