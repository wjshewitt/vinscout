
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
    const kofiButton = document.getElementById('kofi-button');

    const initializeKofi = () => {
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.setConfig('Overlay', {
          'widgetToken': 'autofind'
        });

        if (kofiButton) {
          kofiButton.addEventListener('click', () => {
            window.kofiWidgetOverlay.draw('autofind', {
                'type': 'donation-panel',
                'panel.template': 'modern',
                'panel.goal.show': 'true'
            });
          });
        }
      }
    };
    
    // Check if script is already loaded
    if (document.querySelector('script[src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"]')) {
      initializeKofi();
    } else {
      const script = document.createElement('script');
      script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
      script.async = true;
      script.onload = initializeKofi;
      document.head.appendChild(script);
    }
    
    // No cleanup needed as the button and script should persist
  }, []);

  return null; // This component doesn't render anything itself
}
