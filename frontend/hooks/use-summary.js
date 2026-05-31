'use client';

import { useMutation } from '@tanstack/react-query';
import {
  tldrRequest,
  commandsRequest,
  beginnerRequest,
  translateRequest,
} from '@/lib/api/summary';

export function useSummary() {
  const tldr = useMutation({ mutationFn: tldrRequest });
  const commands = useMutation({ mutationFn: commandsRequest });
  const beginner = useMutation({ mutationFn: beginnerRequest });
  const translate = useMutation({ mutationFn: translateRequest });

  return { tldr, commands, beginner, translate };
}
