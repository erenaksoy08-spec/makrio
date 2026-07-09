import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import usePixelTheme from '../hooks/usePixelTheme'
import { PixelArrowLeft } from './pixelSprites'

// Uygulama geneli geri butonu.
// Normal temalar: cam pill + chevron; piksel tema: retro "bas-çök" gölgeli kare buton + piksel ok.
export default function BackButton({ onClick, to, label = 'Geri' }) {
  const pixel = usePixelTheme()

  if (pixel) {
    const content = (
      <>
        <PixelArrowLeft size={13} />
        {label}
      </>
    )
    const cls =
      'pixel-back btn-chip inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] font-bold text-text-muted'
    const style = { borderColor: 'var(--color-border)', background: 'var(--color-surface)' }
    return to ? (
      <Link to={to} className={cls} style={style}>
        {content}
      </Link>
    ) : (
      <button type="button" onClick={onClick} className={cls} style={style}>
        {content}
      </button>
    )
  }

  const content = (
    <>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        className="transition-transform duration-200 group-hover:-translate-x-0.5"
      >
        <path
          d="M14.5 5.5 8 12l6.5 6.5"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </>
  )
  const cls =
    'btn-chip group inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] py-1.5 pl-2.5 pr-3.5 text-[13px] font-medium text-text-muted transition-colors hover:border-white/20 hover:text-text'
  const style = { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }

  return to ? (
    <Link to={to} className={cls} style={style}>
      {content}
    </Link>
  ) : (
    <motion.button type="button" onClick={onClick} whileTap={{ scale: 0.93 }} className={cls} style={style}>
      {content}
    </motion.button>
  )
}
