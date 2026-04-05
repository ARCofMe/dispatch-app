export default function BrandBar({ appName = "SendIt" }) {
  return (
    <header className="brand-bar">
      <div>
        <p className="brand-kicker">ARCoM Ops Hub</p>
        <h1>{appName}</h1>
      </div>
      <p className="brand-copy">Start with your calls. Plan the route. Send it.</p>
    </header>
  );
}
