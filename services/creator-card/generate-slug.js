// Slug helpers.
//
// Per the codebase conventions (see README "String Manipulation - No Regex
// Allowed"), these helpers use only basic string methods and character-code
// checks. No regular expressions are used anywhere in this module.

// Allowed slug characters: a-z (97-122), A-Z (65-90), 0-9 (48-57),
// hyphen (45) and underscore (95).
function isAllowedSlugCharCode(code, allowUppercase) {
  const isLower = code >= 97 && code <= 122;
  const isUpper = code >= 65 && code <= 90;
  const isDigit = code >= 48 && code <= 57;
  const isSymbol = code === 45 || code === 95;

  return isLower || isDigit || isSymbol || (allowUppercase && isUpper);
}

// Generate a slug from a title: lowercase, separators collapsed to a single
// hyphen, and any disallowed characters dropped.
function generateSlug(title) {
  const lower = title.toLowerCase().trim();

  let slug = '';
  let lastCharWasHyphen = false;

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    const code = char.charCodeAt(0);

    if (isAllowedSlugCharCode(code, false)) {
      slug += char;
      lastCharWasHyphen = char === '-';
    } else if (!lastCharWasHyphen && slug.length > 0) {
      // Treat whitespace / disallowed characters as a separator.
      slug += '-';
      lastCharWasHyphen = true;
    }
  }

  // Remove a trailing separator if present.
  if (slug.endsWith('-')) {
    slug = slug.slice(0, -1);
  }

  return slug;
}

// Validate a client-provided slug: every character must be allowed
// (letters, numbers, hyphen, underscore). Empty strings are invalid.
function isValidSlug(slug) {
  let valid = typeof slug === 'string' && slug.length > 0;

  if (valid) {
    for (let i = 0; i < slug.length; i++) {
      if (!isAllowedSlugCharCode(slug.charCodeAt(i), true)) {
        valid = false;
        break;
      }
    }
  }

  return valid;
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
  isValidSlug,
  appendRandomSuffix,
};
