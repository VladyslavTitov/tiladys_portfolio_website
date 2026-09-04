export default function ServicesLoading() {
  return (
    <main className="services-loading" aria-hidden="true">
      <div className="services-loading__hero" />
      <div className="services-loading__grid">
        {Array.from({ length: 6 }, (_, index) => <div key={index} />)}
      </div>
    </main>
  );
}
