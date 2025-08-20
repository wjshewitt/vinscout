
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, config: any) => void;
    };
  }
}

export function KofiWidget() {

  useEffect(() => {
    if (document.querySelector('script[src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;

    script.onload = () => {
      const kofiButton = document.getElementById('kofi-button');
      if (kofiButton) {
        kofiButton.addEventListener('click', () => {
          window.kofiWidgetOverlay.draw('autofind', {
              'type': 'donation-panel',
              'panel.template': 'modern',
              'panel.goal.show': 'true'
          });
        });
      }
    };
    
    document.head.appendChild(script);

  }, []);

  return null;
}
