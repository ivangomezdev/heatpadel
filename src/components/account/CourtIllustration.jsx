import { useId } from "react";

export default function CourtIllustration({
  sport = "padel",
  selected = false,
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="court-illustration"
      viewBox="0 0 180 124"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={`${id}-floor`}
          x1="90"
          y1="22"
          x2="90"
          y2="108"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={selected ? "#1585b5" : "#467d92"} />
          <stop offset="1" stopColor={selected ? "#154b78" : "#284b64"} />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="20" y1="20" x2="160" y2="90">
          <stop stopColor="#a6e1e4" stopOpacity=".4" />
          <stop offset="1" stopColor="#81bbca" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <ellipse cx="90" cy="109" rx="78" ry="10" fill="#17363c" opacity=".14" />
      <path d="m14 76 80-39 72 35-80 40Z" fill="#173d50" />
      <path d="m14 72 80-39 72 35-80 40Z" fill={`url(#${id}-floor)`} />
      <path d="m23 72 71-34 63 30-71 34Z" stroke="#e1f7f8" strokeWidth="1.3" />
      {sport === "padel" ? (
        <path
          d="m45 61 63 30M72 48l63 30M59 70l27-13M91 86l27-13"
          stroke="#e1f7f8"
          strokeWidth="1.1"
        />
      ) : (
        <path
          d="m53 57 63 30M64 52l63 30M38 79l35-17M104 77l35-17"
          stroke="#e1f7f8"
          strokeWidth="1.1"
        />
      )}
      <path
        d="M14 72V41l80-39v31M94 2l72 35v31"
        stroke="#82a7b4"
        strokeWidth="1.4"
        fill={`url(#${id}-glass)`}
      />
      <path
        d="M34 62V31m20 21V21m20 21V12m38 30V11m18 40V20m18 40V29"
        stroke="#a1cbd2"
        strokeWidth=".7"
        opacity=".65"
      />
      <path
        d="M14 41 94 2l72 35"
        stroke={selected ? "#b5f052" : "#b0c9cd"}
        strokeWidth="2"
      />
      <path
        d="m54 51 72 35v10L54 61Z"
        fill="#122d3e"
        fillOpacity=".48"
        stroke="#d7e5dc"
        strokeWidth=".7"
      />
      <path
        d="m54 54 72 35m-72-32 72 35M62 55v10m8-6v10m8-6v10m8-6v10m8-6v10m8-6v10m8-6v10m8-6v10"
        stroke="#e3eadf"
        strokeWidth=".45"
        opacity=".75"
      />
      <path
        d="M53 49v15m74 20v15"
        stroke="#e1eacb"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m21 48 21-10M111 20l15 7"
        stroke="white"
        opacity=".35"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {selected && (
        <>
          <circle cx="143" cy="100" r="11" fill="#c4f35b" />
          <path
            d="m138 100 3 3 6-6"
            stroke="#183e29"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
