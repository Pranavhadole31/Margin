import { motion } from 'framer-motion';
import { EASE, Shot, Wordmark } from './common';

const CHIPS = ['notes', 'source-linked items', 'understanding'];

export function OpenScene() {
  return (
    <Shot style={{ background: 'var(--paper)' }} exit={{ x: '-12%', opacity: 0, transition: { duration: 0.5, ease: EASE } }}>
      <motion.div className="absolute top-0 bottom-0" style={{ left: '14%', width: '0.35vmin', background: 'rgba(196,81,44,.55)', transformOrigin: 'top' }}
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.3, duration: 0.9, ease: EASE }} />
      <div className="absolute" style={{ left: '20%', top: '24%' }}>
        <motion.p className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5, ease: EASE }}>
          A study notebook
        </motion.p>
        <div style={{ marginTop: '2vmin' }}><Wordmark size="26vmin" delay={0.25} /></div>
        <motion.p className="serif" style={{ fontSize: '4.6vmin', color: 'var(--color-text-secondary)', marginTop: '3vmin' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7, duration: 0.7, ease: EASE }}>
          From your own notes to real understanding.
        </motion.p>
        <div className="flex items-center" style={{ gap: '1.6vmin', marginTop: '4.5vmin' }}>
          {CHIPS.map((c, i) => (
            <motion.div key={c} className="flex items-center" style={{ gap: '1.6vmin' }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 2.6 + i * 0.55, type: 'spring', stiffness: 260, damping: 20 }}>
              {i > 0 && <span className="mono" style={{ fontSize: '2.4vmin', color: 'var(--color-accent)' }}>→</span>}
              <span className="mono" style={{ fontSize: '2.2vmin', padding: '0.9vmin 1.8vmin', borderRadius: '99px', border: '1px solid var(--line)', background: 'var(--card)', color: 'var(--color-primary)' }}>{c}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.p className="mono absolute" style={{ right: '6%', bottom: '8%', fontSize: '1.9vmin', color: 'var(--color-text-muted)', letterSpacing: '.12em' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.4, duration: 0.6 }}>
        COURSE · LEARNING HOW TO LEARN
      </motion.p>
    </Shot>
  );
}
