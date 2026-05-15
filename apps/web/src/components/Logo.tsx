interface Props {
  size?: number;
}

// Prism-with-spectrum mark — equilateral triangle that splits a single
// horizontal beam into the five LPDoctor spectrum colours (amber, gold,
// green, red-orange, violet). Used as the brand glyph.

export function Logo({ size = 22 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
    >
      <polygon
        points="11,2 20,18 2,18"
        stroke="var(--cyan)"
        strokeWidth="1.2"
        fill="rgba(255, 176, 32, 0.06)"
        strokeLinejoin="round"
      />
      <line x1="3" y1="11" x2="10" y2="11" stroke="var(--text)" strokeWidth="1" opacity="0.9" />
      <line x1="12" y1="11" x2="20" y2="7" stroke="var(--spec-1)" strokeWidth="0.8" />
      <line x1="12" y1="11" x2="20" y2="10" stroke="var(--spec-2)" strokeWidth="0.8" />
      <line x1="12" y1="11" x2="20" y2="13" stroke="var(--spec-3)" strokeWidth="0.8" />
      <line x1="12" y1="11" x2="20" y2="16" stroke="var(--spec-4)" strokeWidth="0.8" />
      <line x1="12" y1="11" x2="20" y2="19" stroke="var(--spec-5)" strokeWidth="0.8" />
    </svg>
  );
}
