export function contactContext(query: Pick<URLSearchParams, 'get'>, serviceAliases: Record<string, string>) {
  const requested = (query.get('service') || '').slice(0, 120);
  const mode = query.get('mode') || '';
  const detail = query.get('detail') || '';
  const reference = query.get('project') || query.get('product') || '';
  return {
    initialService: Object.hasOwn(serviceAliases, requested) ? serviceAliases[requested] : '',
    initialMode: ['idea', 'file', 'batch', 'local', 'remote'].includes(mode) ? mode : '',
    initialDetail: ['web-business', 'web-landing', 'web-maintenance', 'pc-setup', 'pc-troubleshooting', 'pc-cleaning', 'pc-upgrade', 'pc-backup', 'pc-remote'].includes(detail) ? detail : '',
    publicReference: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(reference) ? reference : '',
  };
}
