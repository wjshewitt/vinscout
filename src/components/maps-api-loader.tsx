
'use client';

// This component is no longer needed as API loading is handled by the APIProvider in the root layout.
// This prevents unnecessary API calls for logged-out users.
// This component renders nothing, it's only for the side-effect of loading the script.
export function MapsApiLoader() {
  return null;
}
