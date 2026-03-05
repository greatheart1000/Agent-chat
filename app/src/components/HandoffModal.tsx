import { motion, AnimatePresence } from 'framer-motion';
import type { HandoffState } from '@/types';
import { 
  X, 
  UserCircle, 
  Clock, 
  Users, 
  CheckCircle, 
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';

interface HandoffModalProps {
  isOpen: boolean;
  handoffState: HandoffState;
  summary: string;
  onCancel: () => void;
}

const statusConfig: Record<string, { 
  title: string; 
  description: string;
  icon: React.ElementType;
  color: string;
}> = {
  idle: {
    title: '准备转接',
    description: '正在准备转接人工客服',
    icon: Loader2,
    color: '#a3a3a3'
  },
  queued: {
    title: '排队中',
    description: '已加入人工客服队列',
    icon: Users,
    color: '#f59e0b'
  },
  assigned: {
    title: '已分配',
    description: '已为您分配专属客服',
    icon: UserCircle,
    color: '#3bd0ee'
  },
  connected: {
    title: '已连接',
    description: '人工客服已接入',
    icon: CheckCircle,
    color: '#22c55e'
  },
  cancelled: {
    title: '已取消',
    description: '转接已取消',
    icon: X,
    color: '#ef4444'
  }
};

export function HandoffModal({ isOpen, handoffState, summary, onCancel }: HandoffModalProps) {
  const [showSummary, setShowSummary] = useState(false);
  
  const config = statusConfig[handoffState.status];
  const StatusIcon = config.icon;
  
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
            className="bg-[#2a2a2a] rounded-2xl border border-[#404040] w-full max-w-md overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-[#404040]">
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-[#3bd0ee]" />
                <h2 className="text-lg font-semibold text-[#d9d9d9]">转接人工客服</h2>
              </div>
              {handoffState.status !== 'connected' && handoffState.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCancel}
                  className="text-[#a3a3a3] hover:text-[#d9d9d9] hover:bg-[#404040]"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* 内容 */}
            <div className="p-6">
              {/* 状态图标 */}
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{
                    scale: handoffState.status === 'queued' ? [1, 1.05, 1] : 1
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${config.color}20`,
                    border: `2px solid ${config.color}`
                  }}
                >
                  <StatusIcon 
                    className={`w-10 h-10 ${
                      handoffState.status === 'queued' ? 'animate-pulse' : ''
                    }`}
                    style={{ color: config.color }}
                  />
                </motion.div>
              </div>

              {/* 状态文字 */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-[#d9d9d9] mb-2">
                  {config.title}
                </h3>
                <p className="text-sm text-[#a3a3a3]">
                  {config.description}
                </p>
              </div>

              {/* 排队信息 */}
              {handoffState.status === 'queued' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#1a1a1a] rounded-xl p-4 mb-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#f59e0b]" />
                      <span className="text-sm text-[#a3a3a3]">排队人数</span>
                    </div>
                    <span className="text-lg font-semibold text-[#f59e0b]">
                      {handoffState.queuePosition} 人
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3bd0ee]" />
                      <span className="text-sm text-[#a3a3a3]">预计等待</span>
                    </div>
                    <span className="text-lg font-semibold text-[#3bd0ee]">
                      {handoffState.estimatedWaitTime} 分钟
                    </span>
                  </div>
                  
                  {/* 进度条 */}
                  <div className="mt-4">
                    <div className="h-2 bg-[#404040] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.max(10, 100 - (handoffState.queuePosition || 0) * 20)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#f59e0b] to-[#3bd0ee] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 客服信息 */}
              {(handoffState.status === 'assigned' || handoffState.status === 'connected') && handoffState.agentName && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[#1a1a1a] rounded-xl p-4 mb-6"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14 border-2 border-[#3bd0ee]">
                      <AvatarImage src={handoffState.agentAvatar} />
                      <AvatarFallback className="bg-[#3bd0ee] text-[#1a1a1a] text-lg">
                        {handoffState.agentName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold text-[#d9d9d9]">
                        {handoffState.agentName}
                      </p>
                      <p className="text-sm text-[#a3a3a3]">
                        专属客服专员
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[10px] text-[#22c55e]">
                          {handoffState.status === 'connected' ? '在线服务中' : '准备接入'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 会话摘要 */}
              <div className="mb-4">
                <button
                  onClick={() => setShowSummary(!showSummary)}
                  className="flex items-center justify-between w-full p-3 bg-[#1a1a1a] rounded-lg hover:bg-[#262626] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#a3a3a3]" />
                    <span className="text-sm text-[#d9d9d9]">会话摘要</span>
                  </div>
                  {showSummary ? (
                    <ChevronUp className="w-4 h-4 text-[#a3a3a3]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#a3a3a3]" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showSummary && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 bg-[#1a1a1a] mt-2 rounded-lg border border-[#404040]">
                        <p className="text-xs text-[#a3a3a3] leading-relaxed">
                          {summary}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 操作按钮 */}
              {handoffState.status === 'queued' && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full border-[#ef4444] text-[#ef4444] hover:bg-[#ef444420]"
                >
                  取消排队
                </Button>
              )}
              
              {handoffState.status === 'connected' && (
                <Button
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white"
                >
                  开始对话
                </Button>
              )}
              
              {handoffState.status === 'cancelled' && (
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="w-full border-[#404040] text-[#d9d9d9] hover:bg-[#404040]"
                >
                  返回对话
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
