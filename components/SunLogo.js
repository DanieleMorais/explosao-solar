export default function SunLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sunGrad" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B00" />
          <stop offset="1" stopColor="#FFB300" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="10" fill="url(#sunGrad)" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        const r1 = 14.5
        const r2 = i % 3 === 0 ? 22 : 18.5
        return (
          <line
            key={i}
            x1={24 + r1 * Math.cos(a)}
            y1={24 + r1 * Math.sin(a)}
            x2={24 + r2 * Math.cos(a)}
            y2={24 + r2 * Math.sin(a)}
            stroke="url(#sunGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}
