import { motion } from 'framer-motion';
import type { AgentState } from '@/types';
import { Bot, Activity, GitBranch, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface AgentStatusProps {
  agents: AgentState[];
}

const agentConfig: Record<string, { 
  label: string; 
  icon: React.ElementType;
  color: string;
}> = {
  conversation: {
    label: '对话 Agent',
    icon: Bot,
    color: '#3bd0ee'
  },
  sentiment: {
    label: '情绪监控',
    icon: Activity,
    color: '#22c55e'
  },
  router: {
    label: '路由决策',
    icon: GitBranch,
    color: '#f59e0b'
  }
};

const statusConfig: Record<string, { 
  label: string; 
  icon: React.ElementType;
  color: string;
}> = {
  idle: {
    label: '空闲',
    icon: CheckCircle,
    color: '#666'
  },
  processing: {
    label: '处理中',
    icon: Loader2,
    color: '#3bd0ee'
  },
  completed: {
    label: '完成',
    icon: CheckCircle,
    color: '#22c55e'
  },
  error: {
    label: '错误',
    icon: AlertCircle,
    color: '#ef4444'
  }
};

export function AgentStatus({ agents }: AgentStatusProps) {
  return (
    <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#404040]">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#3bd0ee]" />
          <h3 className="text-sm font-medium text-[#d9d9d9]">Agent 状态</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
          <span className="text-[10px] text-[#22c55e]">运行中</span>
        </div>
      </div>

      {/* Agent列表 */}
      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-xs text-[#666]">等待任务启动</span>
          </div>
        ) : (
          agents.map((agent, index) => {
            const config = agentConfig[agent.type];
            const status = statusConfig[agent.status];
            const Icon = config?.icon || Bot;
            const StatusIcon = status?.icon || CheckCircle;
            
            return (
              <motion.div
                key={agent.type}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${config?.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config?.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#d9d9d9]">
                      {config?.label || agent.type}
                    </p>
                    {agent.currentTask && (
                      <p className="text-[10px] text-[#a3a3a3] mt-0.5">
                        {agent.currentTask}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <StatusIcon 
                    className={`w-3.5 h-3.5 ${
                      agent.status === 'processing' ? 'animate-spin' : ''
                    }`}
                    style={{ color: status?.color }}
                  />
                  <span 
                    className="text-[10px]"
                    style={{ color: status?.color }}
                  >
                    {status?.label}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* 系统状态 */}
      <div className="mt-4 pt-4 border-t border-[#404040]">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-[#1a1a1a] rounded-lg">
            <p className="text-[10px] text-[#a3a3a3]">响应时间</p>
            <p className="text-xs font-medium text-[#d9d9d9]">&lt;100ms</p>
          </div>
          <div className="text-center p-2 bg-[#1a1a1a] rounded-lg">
            <p className="text-[10px] text-[#a3a3a3]">准确率</p>
            <p className="text-xs font-medium text-[#22c55e]">98.5%</p>
          </div>
          <div className="text-center p-2 bg-[#1a1a1a] rounded-lg">
            <p className="text-[10px] text-[#a3a3a3]">在线</p>
            <p className="text-xs font-medium text-[#3bd0ee]">24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}
