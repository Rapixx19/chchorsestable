/**
 * @module clients/ui
 * @description Telegram status badge for clients
 * @safety GREEN
 */

interface TelegramBadgeProps {
  isLinked: boolean;
}

export function TelegramBadge({ isLinked }: TelegramBadgeProps) {
  return (
    <div className={`
      inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
      ${isLinked
        ? 'bg-stable-emerald/10 text-stable-emerald border-stable-emerald/20'
        : 'bg-zinc-500/10 text-zinc-500 border-white/5'}
    `}>
      <span className={`w-1 h-1 rounded-full ${isLinked ? 'bg-stable-emerald' : 'bg-zinc-500'}`} />
      {isLinked ? 'Linked' : 'Not Linked'}
    </div>
  );
}
