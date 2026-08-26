export const toPublicSavedRepo = (r) => ({
  id: r.publicId,
  owner: r.owner,
  name: r.name,
  fullName: `${r.owner}/${r.name}`,
  ref: r.ref,
  description: r.description,
  stars: r.stars,
  language: r.language,
  lastOpenedAt: r.lastOpenedAt,
  createdAt: r.createdAt,
});
