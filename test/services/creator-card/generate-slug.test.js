const fs = require('fs');
const path = require('path');
const { expect } = require('chai');
const {
  generateSlug,
  isValidSlug,
  appendRandomSuffix,
} = require('@app/services/creator-card/generate-slug');

describe('creator-card/generate-slug', () => {
  describe('generateSlug', () => {
    it('lowercases the title and replaces spaces with hyphens', () => {
      expect(generateSlug('Jane Doe Photography')).to.equal('jane-doe-photography');
    });

    it('collapses consecutive whitespace into a single hyphen', () => {
      expect(generateSlug('Jane   Doe')).to.equal('jane-doe');
    });

    it('drops disallowed characters', () => {
      expect(generateSlug('Jane! Doe? (Pro)')).to.equal('jane-doe-pro');
    });

    it('keeps existing hyphens and underscores', () => {
      expect(generateSlug('jane_doe-photo')).to.equal('jane_doe-photo');
    });

    it('does not leave a trailing hyphen', () => {
      expect(generateSlug('Jane Doe !!!')).to.equal('jane-doe');
    });

    it('does not use any regular expressions internally', () => {
      // The codebase forbids regex for string manipulation; assert the source
      // of the slug module contains no regex literals.
      const source = fs.readFileSync(
        path.resolve(__dirname, '../../../services/creator-card/generate-slug.js'),
        'utf-8'
      );
      expect(source).to.not.match(/\.(test|match|exec)\(/);
      expect(source).to.not.match(/\.(replace|split)\(\//);
    });
  });

  describe('isValidSlug', () => {
    it('accepts letters, numbers, hyphens and underscores', () => {
      expect(isValidSlug('my-valid_slug-123')).to.equal(true);
      expect(isValidSlug('UPPER_case-99')).to.equal(true);
    });

    it('rejects spaces and special characters', () => {
      expect(isValidSlug('my invalid slug')).to.equal(false);
      expect(isValidSlug('bad!slug')).to.equal(false);
      expect(isValidSlug('slug@home')).to.equal(false);
    });

    it('rejects empty or non-string values', () => {
      expect(isValidSlug('')).to.equal(false);
      expect(isValidSlug(undefined)).to.equal(false);
      expect(isValidSlug(null)).to.equal(false);
    });
  });

  describe('appendRandomSuffix', () => {
    it('appends a 6-character alphanumeric suffix', () => {
      const result = appendRandomSuffix('base-slug');
      expect(result.startsWith('base-slug-')).to.equal(true);

      const suffix = result.slice('base-slug-'.length);
      expect(suffix).to.have.lengthOf(6);
      expect(isValidSlug(suffix)).to.equal(true);
    });

    it('produces different suffixes across calls', () => {
      const a = appendRandomSuffix('base');
      const b = appendRandomSuffix('base');
      // Extremely unlikely to collide; guards against a constant suffix.
      expect(a).to.not.equal(b);
    });
  });
});
