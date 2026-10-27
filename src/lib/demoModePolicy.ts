const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function resolveDemoMode(isDevelopment: boolean, hostname: string, publicDemoFlag?: string): boolean {
  return publicDemoFlag === 'true' || (isDevelopment && LOOPBACK_HOSTS.has(hostname));
}
