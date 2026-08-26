export const toPublicMessage = (m) => ({
  id: m.publicId,
  role: m.role,
  content: m.content,
  sources: m.sources ?? null,
  createdAt: m.createdAt,
});

export const toPublicConversation = (c) => ({
  id: c.publicId,
  title: c.title,
  repoOwner: c.repoOwner,
  repoName: c.repoName,
  repoRef: c.repoRef,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
  ...(c.messages && { messages: c.messages.map(toPublicMessage) }),
});
