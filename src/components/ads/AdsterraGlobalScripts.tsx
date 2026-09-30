import React, { useEffect } from 'react';
import { AdsterraSettings } from '../../types';

interface AdsterraGlobalScriptsProps {
  adsterra?: AdsterraSettings | null;
}

export const AdsterraGlobalScripts: React.FC<AdsterraGlobalScriptsProps> = ({ adsterra }) => {
  useEffect(() => {
    if (!adsterra || !adsterra.isEnabled) return;

    const injectedElements: HTMLElement[] = [];

    const injectScript = (scriptHtml: string, identifier: string) => {
      if (!scriptHtml || !scriptHtml.trim()) return;
      if (document.getElementById(identifier)) return; // Already injected

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = scriptHtml.trim();
      const scripts = tempDiv.querySelectorAll('script');

      Array.from(scripts).forEach((oldScript, idx) => {
        const newScript = document.createElement('script');
        newScript.id = `${identifier}-${idx}`;
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
        document.head.appendChild(newScript);
        injectedElements.push(newScript);
      });
    };

    // 1. Inject Popunder / Onclick Script
    if (adsterra.popunderScript) {
      injectScript(adsterra.popunderScript, 'adsterra-popunder-script');
    }

    // 2. Inject Social Bar / In-Page Push Script
    if (adsterra.socialBarScript) {
      injectScript(adsterra.socialBarScript, 'adsterra-socialbar-script');
    }

    return () => {
      injectedElements.forEach(el => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, [adsterra]);

  return null;
};
