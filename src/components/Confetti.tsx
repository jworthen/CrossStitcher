import styles from './Confetti.module.css'

type Variant = 'header' | 'corner' | 'inline'

interface Props {
  /**
   * Where the confetti is being placed. `header` lays out a small horizontal
   * strip suitable for the right side of a sticky screen header. `corner`
   * is a tiny tucked-into-a-corner cluster. `inline` is a few sprinkles
   * intended to sit beside text.
   */
  variant?: Variant
  /** Extra positioning class from the host stylesheet. */
  className?: string
}

const Heart = ({ fill }: { fill: string }) => (
  <path d="M7 4 c -2 -3 -6 -1 -6 2 c 0 3 6 6 6 6 s 6 -3 6 -6 c 0 -3 -4 -5 -6 -2 z" fill={fill}/>
)

const Star = ({ fill }: { fill: string }) => (
  <path d="M7 1 L8.3 5.5 L13 6 L9.3 8.7 L10.6 13 L7 10.5 L3.4 13 L4.7 8.7 L1 6 L5.7 5.5 Z" fill={fill}/>
)

const Sun = ({ fill }: { fill: string }) => (
  <g>
    <circle cx="7" cy="7" r="3" fill={fill}/>
    <path d="M7 1 V3 M7 11 V13 M1 7 H3 M11 7 H13 M2.7 2.7 L4 4 M10 10 L11.3 11.3 M11.3 2.7 L10 4 M2.7 11.3 L4 10"
      stroke={fill} strokeWidth="1.2" strokeLinecap="round"/>
  </g>
)

const Sparkle = ({ fill }: { fill: string }) => (
  <path d="M7 1 L7.7 6.3 L13 7 L7.7 7.7 L7 13 L6.3 7.7 L1 7 L6.3 6.3 Z" fill={fill}/>
)

const Dot = ({ fill }: { fill: string }) => (
  <circle cx="7" cy="7" r="2.5" fill={fill}/>
)

// Ordered list of (component, fill, x, y, rotation) drawn into a 14px-tall row.
// Reused across variants — the parent SVG's viewBox decides which slots show.
const SHAPES = [
  { Cmp: Heart,   fill: 'var(--pastel-pink)',   x: 0,  y: 4, r: -8  },
  { Cmp: Star,    fill: 'var(--pastel-butter)', x: 18, y: 0, r: 12  },
  { Cmp: Dot,     fill: 'var(--pastel-mint)',   x: 36, y: 4, r: 0   },
  { Cmp: Sun,     fill: 'var(--pastel-peach)',  x: 50, y: 0, r: -5  },
  { Cmp: Sparkle, fill: 'var(--pastel-sky)',    x: 70, y: 4, r: 8   },
  { Cmp: Heart,   fill: 'var(--pastel-lilac)',  x: 88, y: 0, r: 18  },
  { Cmp: Star,    fill: 'var(--pastel-pink)',   x: 106, y: 6, r: -10 },
]

export default function Confetti({ variant = 'header', className }: Props) {
  // Each variant picks a slice + viewBox so the shapes fill the space nicely.
  const config = {
    header: { width: 130, height: 18, slice: SHAPES.slice(0, 7) },
    corner: { width: 60, height: 18, slice: SHAPES.slice(0, 3) },
    inline: { width: 70, height: 18, slice: SHAPES.slice(2, 6) },
  }[variant]

  return (
    <svg
      className={`${styles.confetti} ${className ?? ''}`}
      width={config.width}
      height={config.height}
      viewBox={`0 0 ${config.width} ${config.height}`}
      fill="none"
      aria-hidden="true"
    >
      {config.slice.map((s, i) => (
        <g key={i} transform={`translate(${s.x},${s.y}) rotate(${s.r},7,7)`}>
          <s.Cmp fill={s.fill} />
        </g>
      ))}
    </svg>
  )
}
