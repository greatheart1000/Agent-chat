import { motion } from 'framer-motion';
import type { Message } from '@/types';
import { getSentimentColor, getSentimentLabel } from '@/lib/sentimentRules';
import { User, Bot, AlertCircle } from 'lucide-react';
import { format } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  showSentiment?: boolean;
}

export function ChatMessage({ message, showSentiment = true }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center my-3"
      >
        <span className="text-xs text-[#a3a3a3] bg-[#2a2a2a] px-3 py-1.5 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 头像 */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-[#3bd0ee]' : 'bg-[#404040]'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-[#1a1a1a]" />
        ) : (
          <Bot className="w-5 h-5 text-[#d9d9d9]" />
        )}
      </div>
      
      {/* 消息内容 */}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 气泡 */}
        <div className={`relative px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-[#3bd0ee] text-[#1a1a1a] rounded-tr-sm' 
            : 'bg-[#2a2a2a] text-[#d9d9d9] rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
          
          {/* 时间戳 */}
          <span className={`text-[10px] mt-1 block ${
            isUser ? 'text-[#1a1a1a]/60' : 'text-[#a3a3a3]'
          }`}>
            {format(message.timestamp, 'HH:mm')}
          </span>
        </div>
        
        {/* 情绪标签 (仅用户消息) */}
        {isUser && showSentiment && message.sentiment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-1.5 mt-1.5"
          >
            <div 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: getSentimentColor(message.sentiment.level) }}
            />
            <span 
              className="text-[10px] font-medium"
              style={{ color: getSentimentColor(message.sentiment.level) }}
            >
              {getSentimentLabel(message.sentiment.level)} · {message.sentiment.score}分
            </span>
            {message.sentiment.level !== 'normal' && (
              <AlertCircle 
                className="w-3 h-3" 
                style={{ color: getSentimentColor(message.sentiment.level) }}
              />
            )}
          </motion.div>
        )}
        
        {/* AI策略标签 */}
        {!isUser && message.metadata?.strategy && message.metadata.strategy !== 'standard' && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] text-[#a3a3a3] mt-1"
          >
            策略: {message.metadata.strategy === 'empathetic' ? '共情安抚' : 
                   message.metadata.strategy === 'handoff' ? '转人工' : '标准'}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}
