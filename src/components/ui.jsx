export function Arrow({ diagonal = false, className = "" }) {
  return (
    <svg
      className={`icon ${className}`}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Button({
  href,
  children,
  variant = "lime",
  className = "",
  external = false,
  ...props
}) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      className={`button button--${variant} ${className}`}
      {...(href
        ? {
            href,
            ...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {}),
          }
        : { type: "button" })}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({ children, light = false }) {
  return (
    <p className={`section-label${light ? " section-label--light" : ""}`}>
      <span aria-hidden="true" />
      {children}
    </p>
  );
}
