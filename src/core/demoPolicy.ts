export function demoPolicy(configured: boolean, environment: unknown, requested: boolean) {
  const demo = !configured && environment === 'homologation' && requested;
  return { demo, blocked: !configured && !demo };
}
