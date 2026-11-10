export function BaseModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  sizeClass = '',
  backdropClass = '',
  bodyClass = '',
  contentAs = 'div',
  contentProps,
}) {
  if (!open) return null;

  const ContentTag = contentAs;

  // Resolve size classes
  let resolvedSize = 'w-full max-w-xl';
  if (size === 'sm' || sizeClass?.includes('--sm')) {
    resolvedSize = 'w-full max-w-md';
  } else if (size === 'md' || sizeClass?.includes('--compact')) {
    resolvedSize = 'w-full max-w-xl';
  } else if (size === 'lg' || size === 'wide' || sizeClass?.includes('max-w-3xl') || sizeClass?.includes('max-w-4xl')) {
    resolvedSize = 'w-full max-w-3xl';
  } else if (size === 'xl' || size === 'full') {
    resolvedSize = 'w-full max-w-5xl';
  }

  const backdrop = backdropClass || 'fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-[fadeIn_0.15s_ease-out]';
  const card = `bg-white rounded-[2rem] shadow-2xl border-2 border-slate-100/90 overflow-hidden my-auto max-h-[92vh] flex flex-col ${resolvedSize} ${sizeClass}`;
  const body = bodyClass || 'p-5 sm:p-6 overflow-y-auto space-y-4 text-left';

  return (
    <div className={backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <section className={card} onClick={(event) => event.stopPropagation()}>
        {title ? (
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b-2 border-slate-100 bg-slate-50/50 shrink-0">
            <div>
              <h3 className="text-base sm:text-lg font-black text-cetecBlue tracking-tight flex items-center gap-2">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-400 flex items-center justify-center transition cursor-pointer shrink-0 ml-3"
              aria-label="Fechar"
              title="Fechar"
            >
              <span className="material-symbols-rounded text-lg">close</span>
            </button>
          </div>
        ) : null}

        <ContentTag className={body} {...contentProps}>
          {children}
        </ContentTag>
      </section>
    </div>
  );
}

