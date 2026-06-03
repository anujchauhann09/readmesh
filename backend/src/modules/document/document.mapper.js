export const toPublicDocument = (d) => ({
  id: d.publicId,
  title: d.title,
  content: d.content,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

export const toPublicDocumentSummary = (d) => ({
  id: d.publicId,
  title: d.title,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});
