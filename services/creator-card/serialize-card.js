function serializeCard(cardDoc, includeAccessCode = false) {
  if (!cardDoc) {
    return null;
  }

  const card = {
    id: cardDoc._id,
    title: cardDoc.title,
    description: cardDoc.description,
    slug: cardDoc.slug,
    creator_reference: cardDoc.creator_reference,
    links: cardDoc.links || [],
    service_rates: cardDoc.service_rates || null,
    status: cardDoc.status,
    access_type: cardDoc.access_type,
    created: cardDoc.created,
    updated: cardDoc.updated,
    deleted: cardDoc.deleted || null,
  };

  if (includeAccessCode) {
    card.access_code = cardDoc.access_code || null;
  }

  return card;
}

module.exports = serializeCard;
