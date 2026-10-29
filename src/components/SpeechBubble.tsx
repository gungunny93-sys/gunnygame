import { motion } from 'framer-motion';

const ICON = { happy: '😊', okay: '🙂', returned: '↩ 반품', timeout: '💨', hint: '💡' } as const;
const BORDER = { happy: 'border-good', okay: 'border-wood', returned: 'border-danger', timeout: 'border-warn', hint: 'border-cold' } as const;

export function SpeechBubble(props: { text: string; kind: 'happy' | 'okay' | 'returned' | 'timeout' | 'hint' }) {
  const { text, kind } = props;
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0, y: 8 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className={`relative w-max max-w-[200px] rounded-xl border-2 bg-milk px-2 py-1 text-xs sm:max-w-[260px] sm:text-sm font-bold leading-snug text-ink shadow-md ${BORDER[kind]}`}
      role="status"
    >
      <span className="mr-1" aria-hidden>{ICON[kind]}</span>{text}
      <span className={`absolute -left-[7px] top-3 h-3 w-3 rotate-45 border-b-2 border-l-2 bg-milk ${BORDER[kind]}`} aria-hidden />
    </motion.div>
  );
}
