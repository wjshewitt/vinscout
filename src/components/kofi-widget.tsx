
'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, config: any) => void;
      setConfig: (configName: string, config: any) => void;
    };
  }
}

export function KofiWidget() {

  useEffect(() => {
    // This effect runs only on the client side after the component mounts
    
    // Check if script is already loaded to avoid duplicates during development hot-reloads
    if (document.querySelector('script[src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"]')) {
      // If the script is already there, we assume the listeners are also attached.
      // A more complex cleanup/re-init logic might be needed for some edge cases,
      // but this handles the common case of React StrictMode double-invoking useEffect.
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;

    // This is the crucial part: The code inside onload runs only AFTER the script is fully loaded.
    script.onload = () => {
      // Now window.kofiWidgetOverlay is guaranteed to exist and be fully initialized.
      window.kofiWidgetOverlay.setConfig('Overlay', {
        'widgetToken': 'autofind'
      });

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

  return null; // This component doesn't render anything itself
}
