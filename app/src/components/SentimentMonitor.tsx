import { motion } from 'framer-motion';
import type { SentimentResult } from '@/types';
import { getSentimentColor, getSentimentLabel } from '@/lib/sentimentRules';
import { Activity, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SentimentMonitorProps {
  sentiment: SentimentResult | null;
  isAnalyzing: boolean;
}

export function SentimentMonitor({ sentiment, isAnalyzing }: SentimentMonitorProps) {
  if (isAnalyzing) {
    return (
      <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#404040]">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#3bd0ee]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">情绪监控 Agent</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#3bd0ee] rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-[#3bd0ee] rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="w-2 h-2 bg-[#3bd0ee] rounded-full animate-bounce [animation-delay:0.2s]" />
            <span className="text-xs text-[#a3a3a3] ml-2">分析中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#404040]">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-[#a3a3a3]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">情绪监控 Agent</h3>
        </div>
        <p className="text-xs text-[#666] text-center py-4">
          等待用户输入以进行情绪分析
        </p>
      </div>
    );
  }

  const color = getSentimentColor(sentiment.level);
  const label = getSentimentLabel(sentiment.level);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[#2a2a2a] rounded-xl p-4 border border-[#404040]"
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#3bd0ee]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">情绪监控 Agent</h3>
        </div>
        <Badge 
          variant="outline" 
          className="text-[10px] border-[#404040] text-[#a3a3a3]"
        >
          实时
        </Badge>
      </div>

      {/* 情绪分数 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#a3a3a3]">情绪指数</span>
          <motion.span 
            key={sentiment.score}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-lg font-bold"
            style={{ color }}
          >
            {sentiment.score}
          </motion.span>
        </div>
        <div className="relative h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sentiment.score}%` }}
            transition={{ duration: 0.5, ease: [0.165, 0.84, 0.44, 1] }}
            className="absolute h-full rounded-full"
            style={{ 
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}40`
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#22c55e]">平静</span>
          <span className="text-[10px] text-[#f59e0b]">不耐烦</span>
          <span className="text-[10px] text-[#ef4444]">愤怒</span>
        </div>
      </div>

      {/* 情绪状态 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-[#1a1a1a] rounded-lg">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: `${color}20`,
            border: `2px solid ${color}`
          }}
        >
          {sentiment.level === 'normal' && <TrendingUp className="w-5 h-5" style={{ color }} />}
          {sentiment.level === 'warning' && <AlertTriangle className="w-5 h-5" style={{ color }} />}
          {sentiment.level === 'critical' && <Zap className="w-5 h-5" style={{ color }} />}
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color }}>{label}</p>
          <p className="text-[10px] text-[#a3a3a3]">
            {sentiment.level === 'normal' && '用户情绪平稳'}
            {sentiment.level === 'warning' && '检测到负面情绪'}
            {sentiment.level === 'critical' && '需要立即干预'}
          </p>
        </div>
      </div>

      {/* 触发因素 */}
      {sentiment.triggers.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-[#a3a3a3] mb-2">触发因素</p>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.triggers.map((trigger, index) => (
              <span 
                key={index}
                className="text-[10px] px-2 py-1 rounded-md bg-[#1a1a1a] text-[#d9d9d9]"
              >
                {trigger}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 检测到的关键词 */}
      {sentiment.keywords.length > 0 && (
        <div>
          <p className="text-[10px] text-[#a3a3a3] mb-2">关键词</p>
          <div className="flex flex-wrap gap-1.5">
            {sentiment.keywords.slice(0, 5).map((keyword, index) => (
              <span 
                key={index}
                className="text-[10px] px-2 py-1 rounded-md"
                style={{ 
                  backgroundColor: `${color}20`,
                  color
                }}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
