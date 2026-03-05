import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = '输入消息...' }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="border-t border-[#404040] bg-[#1a1a1a] p-4"
    >
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        {/* 附件按钮 */}
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-[#a3a3a3] hover:text-[#d9d9d9] hover:bg-[#2a2a2a]"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
        
        {/* 输入框 */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? '请稍候...' : placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] bg-[#262626] border-[#404040] text-[#d9d9d9] placeholder:text-[#666] resize-none pr-12 py-3 px-4 rounded-xl focus-visible:ring-[#3bd0ee] focus-visible:ring-1"
            rows={1}
          />
          
          {/* 语音按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-1.5 text-[#a3a3a3] hover:text-[#d9d9d9] hover:bg-transparent"
            disabled={disabled}
          >
            <Mic className="w-4 h-4" />
          </Button>
        </div>
        
        {/* 发送按钮 */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="flex-shrink-0 bg-[#3bd0ee] hover:bg-[#2bc0de] text-[#1a1a1a] rounded-xl px-4 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 mr-2" />
          发送
        </Button>
      </div>
      
      {/* 提示文字 */}
      <p className="text-center text-[10px] text-[#666] mt-2">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </motion.div>
  );
}
