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
      <svg
        className="section-label__ball"
        width="7"
        height="7"
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
      >
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="#c4f35b"
          stroke="#17211d"
          strokeWidth="1.4"
        />
        <path
          d="M4 3.3C10 6 10 14 4 16.7M16 3.3C10 6 10 14 16 16.7"
          fill="none"
          stroke="#fff"
          strokeWidth="1.7"
        />
      </svg>
      {children}
    </p>
  );
}
