import { motion } from 'framer-motion';
import { EASE, Highlight, Shot } from './common';

export function AddScene() {
  const line = (d: number) => ({ initial: { opacity: 0, x: -14 }, animate: { opacity: 1, x: 0 }, transition: { delay: d, duration: 0.45, ease: EASE } });
  return (
    <Shot className="ruled" style={{ background: 'var(--paper)' }} exit={{ scale: 1.25, opacity: 0, transition: { duration: 0.45, ease: EASE } }}>
      <motion.div className="absolute inset-0" initial={{ x: '8%' }} animate={{ x: 0 }} transition={{ duration: 0.7, ease: EASE }}>
        <div className="absolute top-0 bottom-0" style={{ left: '14%', width: '0.35vmin', background: 'rgba(196,81,44,.55)' }} />
        <div className="absolute" style={{ left: '19%', right: '10%', top: '9%' }}>
          <motion.p className="eyebrow" {...line(0.05)}>01 — Add your notes</motion.p>
          <motion.h2 className="serif" style={{ fontSize: '8vmin', lineHeight: 1.1, marginTop: '2vmin', color: 'var(--color-text-primary)' }} {...line(0.2)}>
            # Two modes of thinking
          </motion.h2>
          <div className="serif" style={{ fontSize: '3.6vmin', lineHeight: '6vmin', color: 'var(--color-text-primary)', marginTop: '2vmin', maxWidth: '62vw' }}>
            <motion.p {...line(0.45)}><Highlight delay={1.2}>Focused mode is the tight, deliberate attention</Highlight> you use on a familiar kind of problem.</motion.p>
            <motion.p {...line(0.65)}><Highlight delay={1.8}>Diffuse mode is a relaxed, wide-angle state of mind</Highlight> where ideas connect loosely.</motion.p>
            <motion.p {...line(0.85)}><Highlight delay={2.4}>A chunk is a compact unit of meaning</Highlight> your mind can retrieve as one piece.</motion.p>
          </div>
        </div>
      </motion.div>
      <motion.div className="paper-card absolute flex items-center" style={{ right: '6%', bottom: '9%', padding: '1.6vmin 2.4vmin', gap: '1.4vmin' }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.9, type: 'spring', stiffness: 240, damping: 22 }}>
        <span style={{ width: '1.4vmin', height: '1.4vmin', borderRadius: 99, background: 'var(--color-success)' }} />
        <span className="mono" style={{ fontSize: '2.1vmin', color: 'var(--color-primary)' }}>Text &amp; Markdown · extracted locally, by rules</span>
      </motion.div>
    </Shot>
  );
}
