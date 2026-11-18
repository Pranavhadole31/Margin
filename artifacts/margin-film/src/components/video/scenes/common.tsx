import { motion, type TargetAndTransition } from 'framer-motion';
import type { ReactNode } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

export function Shot({ children, className = '', style, exit }: { children: ReactNode; className?: string; style?: React.CSSProperties; exit?: TargetAndTransition }) {
  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={style}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={exit ?? { opacity: 0, transition: { duration: 0.35 } }}
    >
      {children}
    </motion.div>
  );
}

export function Wordmark({ size, delay = 0, stagger = 0.07 }: { size: string; delay?: number; stagger?: number }) {
  return (
    <span className="serif italic inline-flex items-baseline" style={{ fontSize: size, lineHeight: 1, color: 'var(--color-text-primary)', fontWeight: 400 }}>
      {'Margin'.split('').map((c, i) => (
        <motion.span key={i} initial={{ opacity: 0, y: '0.25em', filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: delay + i * stagger, duration: 0.6, ease: EASE }}>
          {c}
        </motion.span>
      ))}
      <motion.span
        style={{ width: '0.04em', height: '0.72em', background: 'var(--color-accent)', marginLeft: '0.12em', display: 'inline-block', transformOrigin: 'bottom' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delay + 6 * stagger + 0.1, duration: 0.4, ease: EASE }}
      />
    </span>
  );
}

export function Highlight({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <span className="relative inline">
      <motion.span
        className="absolute"
        style={{ left: '-0.1em', right: '-0.1em', top: '0.12em', bottom: '0.02em', background: 'var(--ochre-hl)', borderRadius: '0.12em', transformOrigin: 'left', zIndex: 0 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay, duration: 0.45, ease: [0.6, 0, 0.3, 1] }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}
