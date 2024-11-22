import { z } from 'zod';

const AuthContextDefault = {
  userId: -1,
  externalId: 'unknown',
  username: 'unknown',
} as const;

export const AuthContext = z
  .object({
    userId: z.number().catch(AuthContextDefault.userId),
    externalId: z.string().catch(AuthContextDefault.externalId).optional(),
    username: z.string().catch(AuthContextDefault.username),
  })
  .catch(AuthContextDefault);

export type AuthContext = z.infer<typeof AuthContext>;
