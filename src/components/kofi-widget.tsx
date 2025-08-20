
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
    // Check if the script is already on the page to avoid adding it multiple times
    if (document.querySelector('script[src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js';
    script.async = true;

    // This function will run once the script has loaded
    script.onload = () => {
      const kofiButton = document.getElementById('kofi-button');
      if (kofiButton) {
        kofiButton.addEventListener('click', () => {
          // Trigger the Ko-fi panel when the custom button is clicked
          window.kofiWidgetOverlay.draw('autofind', {
              'type': 'donation-panel',
              'panel.template': 'modern',
              'panel.goal.show': 'true'
          });
        });
      }
    };
    
    // Add the script to the document's head
    document.head.appendChild(script);

  }, []);

  return null; // This component doesn't render anything itself
}
