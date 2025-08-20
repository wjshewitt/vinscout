"use client";

import Script from 'next/script';

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: object) => void;
    };
  }
}

export function KofiWidget() {
  return (
    <Script
      src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.kofiWidgetOverlay) {
          window.kofiWidgetOverlay.draw('autofind', {
            'type': 'floating-chat',
            'floating-chat.donateButton.text': 'Support me',
            'floating-chat.donateButton.background-color': 'hsl(var(--primary))',
            'floating-chat.donateButton.text-color': '#fff'
          });
        }
      }}
    />
  );
}
