const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');
const { generateSlug, appendRandomSuffix } = require('./generate-slug');
const serializeCard = require('./serialize-card');

const spec = `root {
  title string<trim|minLength:3|maxLength:100>
  description? string<trim|maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|startsWith:http>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedSpec = validator.parse(spec);

async function createCard(serviceData) {
  const data = validator.validate(serviceData, parsedSpec);
  let response;

  try {
    // Default access_type to public
    if (!data.access_type) {
      data.access_type = 'public';
    }

    // Validate access_code rules
    if (data.access_type === 'private' && !data.access_code) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED_ON_PRIVATE, ERROR_CODE.AC01);
    }

    if (data.access_type === 'public' && data.access_code) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED_ON_PUBLIC, ERROR_CODE.AC05);
    }

    // Handle slug generation and uniqueness
    let finalSlug = data.slug;
    if (!finalSlug) {
      // Auto-generate slug from title
      finalSlug = generateSlug(data.title);
    }

    // Check if slug is taken
    const existingCard = await CreatorCardRepository.findOne({
      query: { slug: finalSlug, deleted: 0 },
    });

    if (existingCard) {
      // If auto-generated slug is taken, append suffix
      if (!data.slug) {
        finalSlug = appendRandomSuffix(finalSlug);
      } else {
        // Client-provided slug is taken - return error
        throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.SL02);
      }
    }

    // Prepare data for creation
    const cardData = {
      ...data,
      slug: finalSlug,
    };

    // Create the card
    const createdCard = await CreatorCardRepository.create(cardData);

    // Serialize with access_code included
    response = serializeCard(createdCard, true);
  } catch (error) {
    appLogger.errorX(error, 'create-card-error');
    throw error;
  }

  return response;
}

module.exports = createCard;
