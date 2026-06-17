module.exports = {
  // Slug errors
  SLUG_ALREADY_TAKEN: 'Slug is already taken',

  // Access code errors
  ACCESS_CODE_REQUIRED_ON_PRIVATE: 'access_code is required when access_type is private',
  ACCESS_CODE_NOT_ALLOWED_ON_PUBLIC: 'access_code can only be set on private cards',
  PRIVATE_CARD_ACCESS_CODE_REQUIRED: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',

  // Not found errors
  CREATOR_CARD_NOT_FOUND: 'Creator card not found',
  CREATOR_CARD_DRAFT: 'Creator card not found',

  // Validation errors
  INVALID_SLUG_FORMAT: 'Slug must contain only letters, numbers, hyphens, and underscores',
  INVALID_RATE_AMOUNT: 'Service rate amount must be a positive integer (no decimals)',
  TOO_MANY_LINKS: 'Maximum 50 links allowed per card',
  TOO_MANY_RATES: 'Maximum 20 service rates allowed per card',

  // Success messages
  CREATOR_CARD_CREATED: 'Creator Card Created Successfully.',
  CREATOR_CARD_RETRIEVED: 'Creator Card Retrieved Successfully.',
  CREATOR_CARD_DELETED: 'Creator Card Deleted Successfully.',
};
