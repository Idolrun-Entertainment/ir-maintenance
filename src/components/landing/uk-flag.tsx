export function UkFlag() {
  return (
    <svg
      viewBox="0 0 60 30"
      className="h-3.5 w-6 shrink-0"
      aria-hidden
    >
      <clipPath id="uk-flag-clip">
        <rect width="60" height="30" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0 0 L60 30 M60 0 L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0 L60 30 M60 0 L0 30" stroke="#C8102E" strokeWidth="3" />
        <path d="M30 0 V30 M0 15 H60" stroke="#fff" strokeWidth="12" />
        <path d="M30 0 V30 M0 15 H60" stroke="#C8102E" strokeWidth="7" />
      </g>
    </svg>
  )
}
