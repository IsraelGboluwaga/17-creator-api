function generateSlug(title) {
  // Step 1: Lowercase
  let slug = title.toLowerCase();

  // Step 2: Replace whitespace with hyphens
  slug = slug.replace(/\s+/g, '-');

  // Step 3: Remove any characters that are not letters, numbers, hyphens, or underscores
  slug = slug
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Allow: a-z (97-122), 0-9 (48-57), hyphen (45), underscore (95)
      return (
        (code >= 97 && code <= 122) || (code >= 48 && code <= 57) || code === 45 || code === 95
      );
    })
    .join('');

  // Step 4: Ensure slug is between 5 and 50 characters
  // If too short, we'll append suffix later when checking uniqueness
  return slug;
}

function appendRandomSuffix(baseSlug) {
  // Generate 6-character alphanumeric suffix
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    suffix += chars[randomIndex];
  }
  return `${baseSlug}-${suffix}`;
}

module.exports = {
  generateSlug,
  appendRandomSuffix,
};
