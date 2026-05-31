import { z } from 'zod';
import { ANNOTATION_TYPES, HIGHLIGHT_COLORS } from '@readmesh/shared';

const nonEmpty = (max) => z.string().trim().min(1).max(max);

const scope = {
  repoOwner: nonEmpty(100),
  repoName: nonEmpty(100),
  repoRef: nonEmpty(255),
  filePath: nonEmpty(1024),
};

const createBody = z
  .object({
    type: z.enum(ANNOTATION_TYPES),
    ...scope,
    exact: z.string().trim().min(1).max(10_000).optional(),
    prefix: z.string().max(500).optional(),
    suffix: z.string().max(500).optional(),
    textPosition: z.number().int().min(0).optional(),
    sectionId: z.string().trim().max(255).optional(),
    sectionTitle: z.string().trim().max(500).optional(),
    color: z.enum(HIGHLIGHT_COLORS).optional(),
    body: z.string().trim().min(1).max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.type === 'HIGHLIGHT' || data.type === 'NOTE') && !data.exact) {
      ctx.addIssue({ code: 'custom', path: ['exact'], message: 'Selected text is required' });
    }
    if ((data.type === 'NOTE' || data.type === 'COMMENT') && !data.body) {
      ctx.addIssue({ code: 'custom', path: ['body'], message: 'A note body is required' });
    }
  });

export const createAnnotationSchema = z.object({ body: createBody });

export const listAnnotationsSchema = z.object({
  query: z.object({
    owner: nonEmpty(100),
    name: nonEmpty(100),
    ref: nonEmpty(255),
    path: nonEmpty(1024).optional(),
  }),
});

export const updateAnnotationSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid annotation id') }),
  body: z
    .object({
      color: z.enum(HIGHLIGHT_COLORS).optional(),
      body: z.string().trim().min(1).max(5000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
});

export const annotationIdSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid annotation id') }),
});
