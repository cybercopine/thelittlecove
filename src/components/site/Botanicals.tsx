type P = { className?: string };

export function Leaf({ className }: P) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M26 5C14 5 6 12 6 22c0 2 .5 4 1 5 10 0 19-7 19-22z" />
      <path d="M7 27C12 20 17 15 22 10" />
    </svg>
  );
}

export function Fern({ className }: P) {
  return (
    <svg viewBox="0 0 90 80" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M20 78C30 50 50 25 85 8" />
      <path d="M40 46c-8-4-18-4-30 2M48 36c-6-8-16-12-28-12M58 26c-2-8-10-16-20-20M48 36c8 0 18 4 26 12M58 26c8-2 18 0 24 6M40 46c6 4 12 12 14 20" />
    </svg>
  );
}

export function Sprig({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M12 21V6" />
      <path d="M12 9c-3 0-5-2-5-4 3 0 5 2 5 4zM12 9c3 0 5-2 5-4-3 0-5 2-5 4zM12 14c-3 0-5-2-5-4 3 0 5 2 5 4zM12 14c3 0 5-2 5-4-3 0-5 2-5 4z" fill="currentColor" fillOpacity=".25" />
    </svg>
  );
}

export function Moth({ className }: P) {
  return (
    <svg viewBox="0 0 160 70" className={className} aria-hidden="true">
      <ellipse cx="48" cy="28" rx="34" ry="16" transform="rotate(-12 48 28)" fill="var(--pale)" stroke="var(--moss)" strokeWidth="1.4" />
      <ellipse cx="112" cy="28" rx="34" ry="16" transform="rotate(12 112 28)" fill="var(--pale)" stroke="var(--moss)" strokeWidth="1.4" />
      <ellipse cx="62" cy="50" rx="18" ry="11" transform="rotate(40 62 50)" fill="var(--oat)" stroke="var(--moss)" strokeWidth="1.2" />
      <ellipse cx="98" cy="50" rx="18" ry="11" transform="rotate(-40 98 50)" fill="var(--oat)" stroke="var(--moss)" strokeWidth="1.2" />
      <ellipse cx="80" cy="36" rx="4" ry="22" fill="var(--moss)" />
    </svg>
  );
}

export function Divider({ label, className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="h-px flex-1 dotted-rule" />
      {label ? (
        <h2 className="flex items-center gap-2 text-center text-2xl text-moss sm:text-3xl">
          <Sprig className="h-5 w-5 shrink-0" />
          {label}
        </h2>
      ) : (
        <Sprig className="h-5 w-5 text-moss" />
      )}
      <span className="h-px flex-1 dotted-rule" />
    </div>
  );
}
