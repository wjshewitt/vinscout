
'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    kofiWidgetOverlay: {
      draw: (username: string, config: any) => void;
      toggle: () => void;
    };
    kofiToggleOverlay: () => void;
  }
}

export function KofiWidget() {
  useEffect(() => {
    // Define the toggle function and attach it to the window
    window.kofiToggleOverlay = () => {
      if (window.kofiWidgetOverlay) {
        window.kofiWidgetOverlay.toggle();
      }
    };
  }, []);

  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.kofiWidgetOverlay) {
          window.kofiWidgetOverlay.draw('autofind', {
            'type': 'button', // Use 'button' type to just load the logic without rendering a button
            'text': 'Support Me',
            'backgroundColor': '#00b9fe',
            'textColor': '#fff'
          });
        }
      }}
    />
  );
}
