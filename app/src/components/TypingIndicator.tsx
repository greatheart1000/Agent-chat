import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* AI头像 */}
      <div className="w-9 h-9 rounded-full bg-[#404040] flex items-center justify-center flex-shrink-0">
        <svg 
          className="w-5 h-5 text-[#d9d9d9]" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        </svg>
      </div>
      
      {/* 打字动画 */}
      <div className="bg-[#2a2a2a] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
            className="w-2 h-2 bg-[#a3a3a3] rounded-full"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
            className="w-2 h-2 bg-[#a3a3a3] rounded-full"
          />
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
            className="w-2 h-2 bg-[#a3a3a3] rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
