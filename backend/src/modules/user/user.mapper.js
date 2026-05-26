import { DEFAULT_THEME } from '@readmesh/shared';

export const toPublicUser = (user) => ({
  id: user.publicId,
  email: user.email,
  role: user.role?.name ?? null,
  status: user.status,
  displayName: user.profile?.displayName ?? null,
  bio: user.profile?.bio ?? null,
  preferences: {
    theme: user.preferences?.theme ?? DEFAULT_THEME,
    locale: user.preferences?.locale ?? 'en',
  },
  createdAt: user.createdAt,
});
