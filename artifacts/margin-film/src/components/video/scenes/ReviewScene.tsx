import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { EASE, Shot } from './common';

type Card = { id: string; title: string; status: 'pending' | 'approved' | 'gone'; tag?: string; action?: string };
const START: Card[] = [
  { id: 'a', title: 'Retrieval practice', status: 'pending' },
  { id: 'b', title: 'Spaced repitition', status: 'pending' },
  { id: 'c', title: 'Illusion of competence', status: 'pending' },
  { id: 'd', title: 'Therefore not quitting', status: 'pending' },
];

export function ReviewScene() {
  const [cards, setCards] = useState(START);
  const upd = (id: string, p: Partial<Card>) => () => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...p } : c)));
  useSceneTimer([
    { time: 900, callback: upd('a', { status: 'approved', action: 'Approved' }) },
    { time: 1700, callback: upd('b', { title: 'Spaced repetition', action: 'Edited' }) },
    { time: 2200, callback: upd('b', { status: 'approved', action: 'Approved' }) },
    { time: 2900, callback: upd('c', { tag: '#memory', action: 'Tagged' }) },
    { time: 3400, callback: upd('c', { status: 'approved', action: 'Approved' }) },
    { time: 4000, callback: upd('d', { status: 'gone' }) },
  ]);
  const pending = cards.filter((c) => c.status === 'pending').length;
  const library = cards.filter((c) => c.status === 'approved').length;

  return (
    <Shot style={{ background: 'var(--color-bg-dark)' }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.45, ease: EASE } }}>
      <div className="absolute" style={{ left: '6%', top: '12%', width: '38%' }}>
        <motion.p className="eyebrow" style={{ color: '#e39b78' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>03 — Review</motion.p>
        <motion.h2 className="serif" style={{ fontSize: '10vmin', lineHeight: 1, color: 'var(--color-text-inverse)', marginTop: '2vmin' }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6, ease: EASE }}>
          You decide <em>what stays.</em>
        </motion.h2>
        <motion.p style={{ fontSize: '3vmin', color: 'rgba(251,248,242,.7)', marginTop: '3vmin' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          Approve, edit, merge, tag or discard. Nothing reaches your library without you.
        </motion.p>
        <div className="flex mono" style={{ gap: '5vmin', marginTop: '5vmin', color: 'var(--color-text-inverse)' }}>
          {[['Pending', pending, '#e39b78'], ['Library', library, '#9cc7ac']].map(([l, n, c]) => (
            <div key={l as string}>
              <p style={{ fontSize: '1.9vmin', letterSpacing: '.18em', opacity: 0.6 }}>{(l as string).toUpperCase()}</p>
              <AnimatePresence mode="popLayout">
                <motion.p key={n as number} style={{ fontSize: '9vmin', color: c as string, lineHeight: 1.1 }}
                  initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -24, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                  {n as number}
                </motion.p>
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute flex flex-col" style={{ right: '6%', top: '12%', width: '44%', gap: '2vmin' }}>
        <AnimatePresence>
          {cards.filter((c) => c.status !== 'gone').map((c, i) => (
            <motion.div key={c.id} layout className="paper-card relative flex items-center" style={{ padding: '2.6vmin 3vmin', gap: '2vmin', borderLeft: `0.8vmin solid ${c.status === 'approved' ? 'var(--color-success)' : 'var(--line)'}` }}
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: '60%', rotate: 6, transition: { duration: 0.5, ease: EASE } }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 240, damping: 24 }}>
              <div className="flex-1">
                <AnimatePresence mode="popLayout">
                  <motion.p key={c.title} className="serif" style={{ fontSize: '4vmin', color: 'var(--color-text-primary)' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>{c.title}</motion.p>
                </AnimatePresence>
                {c.tag && <motion.span className="mono" style={{ fontSize: '1.9vmin', color: 'var(--color-primary)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{c.tag}</motion.span>}
                {c.id === 'd' && <p className="mono" style={{ fontSize: '1.8vmin', color: 'var(--color-text-muted)' }}>fragment · low signal</p>}
              </div>
              <AnimatePresence mode="popLayout">
                {c.action && (
                  <motion.span key={c.action} className="mono" style={{ fontSize: '2vmin', padding: '0.8vmin 1.6vmin', borderRadius: 99, color: c.action === 'Approved' ? '#fbf8f2' : 'var(--color-primary)', background: c.action === 'Approved' ? 'var(--color-success)' : 'rgba(31,83,112,.1)' }}
                    initial={{ scale: 1.8, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}>
                    {c.action}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
        <motion.p className="mono" style={{ fontSize: '1.9vmin', color: '#e39b78', textAlign: 'right' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.1 }}>
          discarded — never enters study
        </motion.p>
      </div>
    </Shot>
  );
}
