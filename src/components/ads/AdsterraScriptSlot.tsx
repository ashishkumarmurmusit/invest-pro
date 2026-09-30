import React, { useEffect, useRef } from 'react';

interface AdsterraScriptSlotProps {
  scriptCode: string;
  bannerSize?: string;
  slotTitle?: string;
  className?: string;
}

export const AdsterraScriptSlot: React.FC<AdsterraScriptSlotProps> = ({
  scriptCode,
  bannerSize = 'Responsive',
  slotTitle = 'Sponsored Adsterra Ad',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !scriptCode || !scriptCode.trim()) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear previous contents

    // Parse HTML string to DOM nodes
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = scriptCode.trim();

    // Recreate script tags dynamically so browsers execute them
    const scripts = tempDiv.querySelectorAll('script');
    const nonScripts = tempDiv.cloneNode(true) as HTMLElement;
    const innerScripts = nonScripts.querySelectorAll('script');
    innerScripts.forEach(s => s.remove());

    // Append non-script HTML elements first (e.g. wrapper divs, noscript tags, anchor links)
    if (nonScripts.innerHTML.trim()) {
      const contentWrapper = document.createElement('div');
      contentWrapper.innerHTML = nonScripts.innerHTML;
      container.appendChild(contentWrapper);
    }

    // Execute scripts in sequential order
    Array.from(scripts).forEach(oldScript => {
      const newScript = document.createElement('script');
      newScript.type = oldScript.type || 'text/javascript';
      if (oldScript.src) {
        newScript.src = oldScript.src;
        if (oldScript.async) newScript.async = true;
        if (oldScript.getAttribute('data-cfasync')) {
          newScript.setAttribute('data-cfasync', oldScript.getAttribute('data-cfasync')!);
        }
      } else {
        newScript.textContent = oldScript.textContent;
      }
      container.appendChild(newScript);
    });

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [scriptCode]);

  if (!scriptCode || !scriptCode.trim()) return null;

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 px-1">
        <span className="font-bold tracking-wider uppercase flex items-center gap-1 text-purple-600 dark:text-purple-400">
          ⭐ {slotTitle}
        </span>
        <span className="font-mono text-[9px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          Adsterra {bannerSize}
        </span>
      </div>

      <div
        ref={containerRef}
        className="w-full flex items-center justify-center overflow-hidden min-h-[50px] transition-all"
      />
    </div>
  );
};
