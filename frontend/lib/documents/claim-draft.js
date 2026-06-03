import { createDocumentRequest } from '@/lib/api/documents';
import { readGuestDraft, clearGuestDraft, hasMeaningfulGuestDraft } from '@/lib/documents/draft';

export async function claimGuestDraft() {
  if (!hasMeaningfulGuestDraft()) return null;
  const content = readGuestDraft();
  try {
    const document = await createDocumentRequest({ content });
    clearGuestDraft();
    return document;
  } catch {
    return null;
  }
}
