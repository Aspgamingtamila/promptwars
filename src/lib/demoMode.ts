import { resolveDemoMode } from './demoModePolicy';

// A public demo is safe only because it uses synthetic records and browser-local storage.
const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
export const isDemoMode = resolveDemoMode(
  import.meta.env.DEV,
  hostname,
  import.meta.env.VITE_PUBLIC_DEMO_MODE
);
