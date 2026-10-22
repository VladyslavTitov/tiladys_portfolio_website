import { ControlText } from '@/components/control-language';

export default function DashboardLoading() {
  return <section className="panel" role="status" aria-live="polite" aria-busy="true">
    <p><ControlText value="Loading…" /></p>
    <div className="control-loading-placeholder" aria-hidden="true" />
  </section>;
}
