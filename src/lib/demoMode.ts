const isLocalhost = typeof window !== 'undefined'
  && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

// A public demo is safe only because it uses synthetic records and browser-local storage.
export const isDemoMode = import.meta.env.VITE_PUBLIC_DEMO_MODE === 'true'
  || (import.meta.env.DEV && isLocalhost);
