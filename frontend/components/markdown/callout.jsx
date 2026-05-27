import { Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const VARIANTS = {
  note: { label: 'Note', Icon: Info, cls: 'border-sky-500/50 bg-sky-500/5 text-sky-700 dark:text-sky-300' },
  tip: { label: 'Tip', Icon: Lightbulb, cls: 'border-emerald-500/50 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' },
  important: { label: 'Important', Icon: MessageSquareWarning, cls: 'border-violet-500/50 bg-violet-500/5 text-violet-700 dark:text-violet-300' },
  warning: { label: 'Warning', Icon: TriangleAlert, cls: 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-300' },
  caution: { label: 'Caution', Icon: OctagonAlert, cls: 'border-red-500/50 bg-red-500/5 text-red-700 dark:text-red-300' },
};

export function Callout({ type = 'note', children }) {
  const { label, Icon, cls } = VARIANTS[type] ?? VARIANTS.note;
  return (
    <div className={cn('my-4 rounded-r-lg border-l-4 px-4 py-3', cls)}>
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 shrink-0" />
        {label}
      </p>
      <div className="callout-body text-sm text-foreground">{children}</div>
    </div>
  );
}
