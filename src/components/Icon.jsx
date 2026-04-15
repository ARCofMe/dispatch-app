const baseStroke = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const ICONS = {
  attention: (
    <>
      <path {...baseStroke} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path {...baseStroke} d="M10 21h4" />
    </>
  ),
  board: (
    <>
      <path {...baseStroke} d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" />
    </>
  ),
  brain: (
    <>
      <path {...baseStroke} d="M12 3 4.8 7.2v8.6L12 20l7.2-4.2V7.2z" />
      <circle {...baseStroke} cx="12" cy="12" r="3.2" />
      <path {...baseStroke} d="M12 8.8V5.7M12 18.3v-3.1M8.8 12H5.7M18.3 12h-3.1M9.6 9.6 7.5 7.5M16.5 16.5l-2.1-2.1" />
    </>
  ),
  external: (
    <>
      <path {...baseStroke} d="M8 8h-3v11h11v-3" />
      <path {...baseStroke} d="M13 5h6v6M19 5 9 15" />
    </>
  ),
  field: (
    <>
      <path {...baseStroke} d="M14.7 5.3a4.2 4.2 0 0 0 4.9 5.4L10.7 19.6a2.3 2.3 0 0 1-3.3-3.3l8.9-8.9a4.2 4.2 0 0 0-1.6-2.1z" />
    </>
  ),
  intake: (
    <>
      <path {...baseStroke} d="M4 13h4l2 3h4l2-3h4" />
      <path {...baseStroke} d="M5 13 7 5h10l2 8v6H5z" />
      <path {...baseStroke} d="M12 5v7M9 9l3 3 3-3" />
    </>
  ),
  ops: (
    <>
      <path {...baseStroke} d="M12 3 4.8 7.2v8.6L12 20l7.2-4.2V7.2z" />
      <path {...baseStroke} d="M8 12h8M12 8v8" />
    </>
  ),
  parts: (
    <>
      <path {...baseStroke} d="m12 3 7.5 4.2v8.6L12 20l-7.5-4.2V7.2z" />
      <path {...baseStroke} d="M4.8 7.5 12 11.7l7.2-4.2M12 11.7V20" />
    </>
  ),
  route: (
    <>
      <circle {...baseStroke} cx="5" cy="18" r="2" />
      <circle {...baseStroke} cx="19" cy="6" r="2" />
      <circle {...baseStroke} cx="12" cy="12" r="2" />
      <path {...baseStroke} d="M6.7 16.8 10.3 13.2M13.8 10.8l3.5-3.5" />
    </>
  ),
  routes: (
    <>
      <path {...baseStroke} d="M5 19c4-8 10 2 14-6" />
      <path {...baseStroke} d="M7 5h7a4 4 0 0 1 0 8H8" />
      <circle {...baseStroke} cx="5" cy="19" r="2" />
      <circle {...baseStroke} cx="19" cy="13" r="2" />
    </>
  ),
  settings: (
    <>
      <circle {...baseStroke} cx="12" cy="12" r="3" />
      <path {...baseStroke} d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5 6.8 15M17.2 9l2.6-1.5" />
    </>
  ),
  sr: (
    <>
      <path {...baseStroke} d="M7 3h7l4 4v14H7z" />
      <path {...baseStroke} d="M14 3v5h5M10 12h6M10 16h5" />
    </>
  ),
  triage: (
    <>
      <path {...baseStroke} d="M4 5h16l-6 7v5l-4 2v-7z" />
      <path {...baseStroke} d="m15.5 17 1.7 1.7 3.3-3.7" />
    </>
  ),
};

export default function Icon({ name, className = "", title }) {
  const classes = ["icon", className].filter(Boolean).join(" ");

  return (
    <svg
      className={classes}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {ICONS[name] ?? ICONS.ops}
    </svg>
  );
}
