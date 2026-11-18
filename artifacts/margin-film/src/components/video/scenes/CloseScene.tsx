import { motion } from 'framer-motion';
import { EASE, Shot, Wordmark } from './common';

const LINES = [
  { t: 'Rule-based extraction — no external AI', c: 'var(--color-success)', m: '✓' },
  { t: 'Saved only in this browser', c: 'var(--color-success)', m: '✓' },
  { t: 'No sync, no account — export your backups', c: 'var(--color-warning)', m: '!' },
];

export function CloseScene() {
  return (
    <Shot style={{ background: 'var(--paper)' }} exit={{ opacity: 0, transition: { duration: 0.6 } }}>
      <motion.div className="absolute top-0 bottom-0" style={{ left: '14%', width: '0.35vmin', background: 'rgba(196,81,44,.55)', transformOrigin: 'bottom' }}
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.7, ease: EASE }} />
      <div className="absolute" style={{ left: '20%', top: '18%' }}>
        <Wordmark size="22vmin" delay={0.05} stagger={0.05} />
        <div className="flex flex-col" style={{ gap: '2vmin', marginTop: '5vmin' }}>
          {LINES.map((l, i) => (
            <motion.div key={l.t} className="flex items-center" style={{ gap: '2vmin' }}
              initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.5, duration: 0.5, ease: EASE }}>
              <span className="mono flex items-center justify-center" style={{ width: '4vmin', height: '4vmin', borderRadius: 99, background: l.c, color: '#fbf8f2', fontSize: '2.2vmin' }}>{l.m}</span>
              <span style={{ fontSize: '3.4vmin', color: 'var(--color-text-primary)' }}>{l.t}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <motion.p className="serif italic absolute" style={{ right: '6%', bottom: '9%', fontSize: '3.4vmin', color: 'var(--color-text-secondary)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 0.6 }}>
        Your notes. Your understanding.
      </motion.p>
    </Shot>
  );
}
