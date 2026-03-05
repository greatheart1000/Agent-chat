import { motion } from 'framer-motion';
import type { RouterResult } from '@/types';
import { GitBranch, ArrowRight, CheckCircle, AlertCircle, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RouterPanelProps {
  routerResult: RouterResult | null;
  isRouting: boolean;
}

type DecisionType = 'continue' | 'empathetic' | 'handoff';

const decisionConfig: Record<DecisionType, { 
  label: string; 
  color: string; 
  icon: React.ElementType;
  description: string;
}> = {
  continue: {
    label: '继续对话',
    color: '#22c55e',
    icon: CheckCircle,
    description: '使用标准策略回复'
  },
  empathetic: {
    label: '安抚策略',
    color: '#f59e0b',
    icon: AlertCircle,
    description: '切换共情话术安抚用户'
  },
  handoff: {
    label: '转人工',
    color: '#ef4444',
    icon: UserCircle,
    description: '立即转接人工客服'
  }
};

export function RouterPanel({ routerResult, isRouting }: RouterPanelProps) {
  if (isRouting) {
    return (
      <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#404040]">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-[#3bd0ee]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">路由决策 Agent</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#3bd0ee] rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-[#3bd0ee] rounded-full animate-pulse [animation-delay:0.1s]" />
            <div className="w-2 h-2 bg-[#3bd0ee] rounded-full animate-pulse [animation-delay:0.2s]" />
            <span className="text-xs text-[#a3a3a3] ml-2">决策中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!routerResult) {
    return (
      <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#404040]">
        <div className="flex items-center gap-2 mb-3">
          <GitBranch className="w-4 h-4 text-[#a3a3a3]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">路由决策 Agent</h3>
        </div>
        <p className="text-xs text-[#666] text-center py-4">
          等待情绪分析结果进行路由决策
        </p>
      </div>
    );
  }

  const config = decisionConfig[routerResult.decision as DecisionType];
  const Icon = config.icon;

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
          <GitBranch className="w-4 h-4 text-[#3bd0ee]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">路由决策 Agent</h3>
        </div>
        <Badge 
          variant="outline" 
          className="text-[10px] border-[#404040] text-[#a3a3a3]"
        >
          决策引擎
        </Badge>
      </div>

      {/* 决策结果 */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-lg mb-4"
        style={{ 
          backgroundColor: `${config.color}15`,
          border: `1px solid ${config.color}40`
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${config.color}30` }}
          >
            <Icon className="w-6 h-6" style={{ color: config.color }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: config.color }}>
              {config.label}
            </p>
            <p className="text-[10px] text-[#a3a3a3] mt-0.5">
              {config.description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 决策理由 */}
      <div className="mb-4">
        <p className="text-[10px] text-[#a3a3a3] mb-2">决策依据</p>
        <div className="flex items-start gap-2 p-3 bg-[#1a1a1a] rounded-lg">
          <ArrowRight className="w-3 h-3 text-[#3bd0ee] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#d9d9d9]">{routerResult.reason}</p>
        </div>
      </div>

      {/* 优先级 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#a3a3a3]">优先级</span>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((level) => (
            <div
              key={level}
              className={`w-2 h-2 rounded-full ${
                level >= routerResult.priority 
                  ? '' 
                  : 'bg-[#404040]'
              }`}
              style={{
                backgroundColor: level >= routerResult.priority ? config.color : undefined
              }}
            />
          ))}
          <span className="text-[10px] text-[#d9d9d9] ml-1">
            P{routerResult.priority}
          </span>
        </div>
      </div>

      {/* 决策流程可视化 */}
      <div className="mt-4 pt-4 border-t border-[#404040]">
        <p className="text-[10px] text-[#a3a3a3] mb-3">决策流程</p>
        <div className="flex items-center justify-between">
          {[
            { label: '输入', active: true },
            { label: '分析', active: true },
            { label: '决策', active: true },
            { label: '执行', active: routerResult.decision !== 'continue' }
          ].map((step, index, arr) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                    step.active 
                      ? 'bg-[#3bd0ee] text-[#1a1a1a]' 
                      : 'bg-[#404040] text-[#666]'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`text-[9px] mt-1 ${
                  step.active ? 'text-[#d9d9d9]' : 'text-[#666]'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < arr.length - 1 && (
                <div className={`w-4 h-[2px] mx-1 ${
                  step.active ? 'bg-[#3bd0ee]' : 'bg-[#404040]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
