interface DisciviumMarkProps {
  compact?: boolean;
  tone?: 'light' | 'dark';
}

export function DisciviumMark({ compact = false, tone = 'light' }: DisciviumMarkProps) {
  const strokePrimary = tone === 'light' ? '#F7F6F2' : '#0F172A';
  const accentFill = '#14B8A6';

  return (
    <span className="inline-flex items-center gap-2.5 select-none whitespace-nowrap shrink-0">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="7"
          stroke={strokePrimary}
          strokeOpacity="0.24"
          strokeWidth="1.5"
        />
        <path
          d="M9.5 8.5H16.2C20.6 8.5 23.8 11.7 23.8 16C23.8 20.3 20.6 23.5 16.2 23.5H9.5V8.5Z"
          stroke={strokePrimary}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <line
          x1="13.5"
          y1="12.5"
          x2="13.5"
          y2="19.5"
          stroke={accentFill}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="22.5" cy="9.5" r="2" fill={accentFill} />
      </svg>
      {!compact && (
        <span
          className={`font-display text-lg font-semibold tracking-tight ${
            tone === 'light' ? 'text-[var(--sidebar-text)]' : 'text-[var(--ink)]'
          }`}
        >
          Discivium
        </span>
      )}
    </span>
  );
}
