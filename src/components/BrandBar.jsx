export default function BrandBar({ appName = "RouteDesk" }) {
  return (
    <header className="brand-bar">
      <div>
        <p className="brand-kicker">ARCoM Ops Hub</p>
        <h1>{appName}</h1>
      </div>
      <p className="brand-copy">Own the dispatch board. Work the queue. Shape the route before the day slips.</p>
    </header>
  );
}
