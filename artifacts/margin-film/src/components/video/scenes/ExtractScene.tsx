import { motion } from 'framer-motion';
import { EASE, Shot } from './common';

const ITEMS = [
  { t: 'Focused mode', e: 'Focused mode is the tight, deliberate attention you use…' },
  { t: 'Diffuse mode', e: 'Diffuse mode is a relaxed, wide-angle state of mind…' },
  { t: 'Chunk', e: 'A chunk is a compact unit of meaning your mind can retrieve…' },
];

export function ExtractScene() {
  return (
    <Shot style={{ background: 'var(--color-bg-muted)' }} exit={{ x: '18%', opacity: 0, transition: { duration: 0.45, ease: EASE } }}>
      <div className="absolute" style={{ left: '6%', top: '9%' }}>
        <motion.p className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>02 — Extract</motion.p>
        <motion.h2 className="serif" style={{ fontSize: '8.5vmin', lineHeight: 1.02, marginTop: '1.6vmin', color: 'var(--color-text-primary)', maxWidth: '40vw' }}
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}>
          Every item keeps <em style={{ color: 'var(--color-accent)' }}>its source.</em>
        </motion.h2>
        <motion.p style={{ fontSize: '3.1vmin', color: 'var(--color-text-secondary)', marginTop: '3vmin', maxWidth: '36vw' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.6 }}>
          The original excerpt stays attached, so you can always check the words you wrote down.
        </motion.p>
      </div>
      <div className="absolute flex flex-col" style={{ right: '6%', top: '10%', width: '46%', gap: '2.4vmin' }}>
        {ITEMS.map((it, i) => (
          <motion.div key={it.t} className="paper-card" style={{ padding: '2.4vmin 3vmin' }}
            initial={{ opacity: 0, x: '-40%', rotate: -2, scale: 0.92 }} animate={{ opacity: 1, x: 0, rotate: i === 1 ? 0.6 : -0.4, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.55, type: 'spring', stiffness: 200, damping: 22 }}>
            <div className="flex items-center justify-between">
              <span className="serif" style={{ fontSize: '4.2vmin', color: 'var(--color-text-primary)' }}>{it.t}</span>
              <motion.span className="mono" style={{ fontSize: '1.8vmin', color: 'var(--color-primary)', background: 'rgba(31,83,112,.08)', padding: '0.5vmin 1.2vmin', borderRadius: 99 }}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 + i * 0.55, type: 'spring', stiffness: 300, damping: 18 }}>
                definition
              </motion.span>
            </div>
            <p className="excerpt" style={{ fontSize: '2.6vmin', color: 'var(--color-text-secondary)', padding: '1vmin 1.6vmin', marginTop: '1.4vmin' }}>{it.e}</p>
            <motion.p className="mono" style={{ fontSize: '1.8vmin', color: 'var(--color-accent)', marginTop: '1.2vmin' }}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.1 + i * 0.55, duration: 0.4 }}>
              ↳ from “Modes of thinking and chunking”
            </motion.p>
          </motion.div>
        ))}
      </div>
    </Shot>
  );
}
