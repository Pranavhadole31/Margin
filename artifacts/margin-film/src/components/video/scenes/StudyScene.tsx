import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, Shot } from './common';

const OPTS = ['Rereading the highlighted page', 'Pulling it from memory without looking', 'Cramming in one sitting'];
const CHART = 'M0 80 L40 70 L80 74 L120 52 L160 46 L200 30 L240 18';

export function StudyScene() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 1300, callback: () => setPhase(1) },
    { time: 2300, callback: () => setPhase(2) },
    { time: 2800, callback: () => setPhase(3) },
  ]);
  return (
    <Shot style={{ background: 'var(--paper)' }} exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.5, ease: EASE } }}>
      <motion.div className="absolute" style={{ left: '6%', top: '8%' }} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">04 — Study</p>
        <h2 className="serif" style={{ fontSize: '7vmin', color: 'var(--color-text-primary)', marginTop: '1vmin' }}>Study only what <em style={{ color: 'var(--color-accent)' }}>you approved.</em></h2>
      </motion.div>
      {/* Flashcard */}
      <motion.div className="absolute" style={{ left: '6%', top: '33%', width: '40%', height: '52%', perspective: '1400px' }}
        initial={{ opacity: 0, y: 60, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -1.5 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 22 }}>
        <motion.div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }} animate={{ rotateY: phase >= 1 ? 180 : 0 }} transition={{ duration: 0.7, ease: EASE }}>
          <div className="paper-card absolute inset-0 flex flex-col justify-center ruled" style={{ padding: '5vmin', backfaceVisibility: 'hidden' }}>
            <p className="mono" style={{ fontSize: '1.9vmin', color: 'var(--color-text-muted)', letterSpacing: '.15em' }}>FLASHCARD · 3 / 6</p>
            <p className="serif" style={{ fontSize: '6.4vmin', color: 'var(--color-text-primary)', marginTop: '2vmin' }}>What is a chunk?</p>
          </div>
          <div className="paper-card absolute inset-0 flex flex-col justify-center" style={{ padding: '5vmin', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--color-primary)' }}>
            <p className="mono" style={{ fontSize: '1.9vmin', color: 'rgba(251,248,242,.6)', letterSpacing: '.15em' }}>ANSWER</p>
            <p className="serif" style={{ fontSize: '4.2vmin', color: '#fbf8f2', marginTop: '2vmin', lineHeight: 1.25 }}>A compact unit of meaning your mind can retrieve as a single piece.</p>
          </div>
        </motion.div>
      </motion.div>
      {/* Quiz */}
      <motion.div className="paper-card absolute" style={{ right: '6%', top: '33%', width: '42%', padding: '3vmin' }}
        initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 220, damping: 24 }}>
        <p className="serif" style={{ fontSize: '3.2vmin', color: 'var(--color-text-primary)' }}>Which is retrieval practice?</p>
        <div className="flex flex-col" style={{ gap: '1.2vmin', marginTop: '1.8vmin' }}>
          {OPTS.map((o, i) => {
            const right = i === 1 && phase >= 2;
            return (
              <motion.div key={o} animate={{ scale: right ? [1, 1.04, 1] : 1 }} transition={{ duration: 0.4 }}
                style={{ fontSize: '2.4vmin', padding: '1.2vmin 1.8vmin', borderRadius: '1vmin', border: `1px solid ${right ? 'var(--color-success)' : 'var(--line)'}`, background: right ? 'rgba(74,122,99,.14)' : 'transparent', color: 'var(--color-text-primary)' }}>
                {right ? '✓ ' : ''}{o}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      {/* Timer + chart */}
      <motion.div className="absolute flex items-center" style={{ right: '6%', bottom: '8%', width: '42%', gap: '3vmin' }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6, duration: 0.5, ease: EASE }}>
        <div className="relative" style={{ width: '13vmin', height: '13vmin' }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="6" />
            <motion.circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-accent)" strokeWidth="6" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: phase >= 3 ? 0.72 : 0 }} transition={{ duration: 2.2, ease: 'easeInOut' }} />
          </svg>
          <p className="mono absolute inset-0 flex items-center justify-center" style={{ fontSize: '2.4vmin', color: 'var(--color-text-primary)' }}>25:00</p>
        </div>
        <div className="flex-1">
          <p className="mono" style={{ fontSize: '1.8vmin', letterSpacing: '.15em', color: 'var(--color-text-muted)' }}>UNDERSTANDING · 6 SESSIONS</p>
          <svg viewBox="0 0 240 90" style={{ width: '100%', height: '10vmin' }}>
            <motion.path d={CHART} fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: phase >= 3 ? 1 : 0 }} transition={{ duration: 1.6, ease: EASE }} />
          </svg>
        </div>
      </motion.div>
    </Shot>
  );
}
