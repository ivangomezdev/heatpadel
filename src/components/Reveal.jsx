"use client";

import { useEffect, useRef, useState } from "react";
import "./Reveal.css";

export default function Reveal({
  as: Tag = "div",
  children,
  className = "",
  delay = 0,
  style,
  ...props
}) {
  const elementRef = useRef(null);
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (motionPreference.matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setPhase("visible");
        observer.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -24px 0px" },
    );

    setPhase("pending");
    observer.observe(elementRef.current);

    const reduceMotion = (event) => {
      if (!event.matches) return;
      observer.disconnect();
      setPhase("visible");
    };
    motionPreference.addEventListener("change", reduceMotion);

    return () => {
      observer.disconnect();
      motionPreference.removeEventListener("change", reduceMotion);
    };
  }, []);

  return (
    <Tag
      ref={elementRef}
      className={`reveal reveal--${phase} ${className}`.trim()}
      style={{ ...style, "--reveal-delay": `${delay}ms` }}
      {...props}
    >
      {children}
    </Tag>
  );
}
