const { ModelSchema, SchemaTypes, DatabaseModel } = require('@app-core/mongoose');

const modelName = 'creator-cards';

/**
 * @typedef {Object} CreatorCard
 * @property {String} _id - ULID identifier
 * @property {String} id - Virtual id field (mapped from _id)
 * @property {String} title - Card title (3-100 characters)
 * @property {String} description - Card description (max 500 characters)
 * @property {String} slug - Public identifier (5-50 chars, unique)
 * @property {String} creator_reference - Creator identifier (exactly 20 chars)
 * @property {Object[]} links - Array of links
 * @property {String} links[].title - Link title (1-100 chars)
 * @property {String} links[].url - Link URL (max 200 chars, http/https)
 * @property {Object} service_rates - Service rates object
 * @property {String} service_rates.currency - Currency (NGN|USD|GBP|GHS)
 * @property {Object[]} service_rates.rates - Array of rates
 * @property {String} service_rates.rates[].name - Rate name (3-100 chars)
 * @property {String} service_rates.rates[].description - Rate description (max 250 chars)
 * @property {Number} service_rates.rates[].amount - Rate amount (positive integer, minor units)
 * @property {String} status - draft|published
 * @property {String} access_type - public|private
 * @property {String} access_code - 6 alphanumeric characters (if private)
 * @property {Number} created - Unix epoch milliseconds
 * @property {Number} updated - Unix epoch milliseconds
 * @property {Number|null} deleted - Unix epoch milliseconds (soft delete)
 */

const schemaConfig = {
  _id: { type: SchemaTypes.ULID },
  title: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  slug: { type: SchemaTypes.String, unique: true, index: true },
  creator_reference: { type: SchemaTypes.String },
  links: { type: SchemaTypes.Mixed },
  service_rates: { type: SchemaTypes.Mixed },
  status: { type: SchemaTypes.String, index: true },
  access_type: { type: SchemaTypes.String },
  access_code: { type: SchemaTypes.String },
  created: { type: SchemaTypes.Number },
  updated: { type: SchemaTypes.Number },
  deleted: { type: SchemaTypes.Number, default: null, index: true },
};

const modelSchema = new ModelSchema(schemaConfig, { collection: modelName });

// Plugin to configure virtuals and toJSON transform
function creatorCardPlugin(schema) {
  schema.virtual('id').get(function getIdVirtual() {
    return this._id;
  });

  schema.set('toJSON', {
    virtuals: true,
    transform(doc, retObj) {
      // eslint-disable-next-line no-param-reassign
      retObj.id = retObj._id;
      // eslint-disable-next-line no-param-reassign
      delete retObj._id;
      // eslint-disable-next-line no-param-reassign
      delete retObj.__v;
      return retObj;
    },
  });

  schema.set('toObject', {
    virtuals: true,
    transform(doc, retObj) {
      // eslint-disable-next-line no-param-reassign
      retObj.id = retObj._id;
      // eslint-disable-next-line no-param-reassign
      delete retObj._id;
      // eslint-disable-next-line no-param-reassign
      delete retObj.__v;
      return retObj;
    },
  });
}

modelSchema.plugin(creatorCardPlugin);

/** @type {CreatorCard} */
module.exports = DatabaseModel.model(modelName, modelSchema, { paranoid: true });
