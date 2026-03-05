import { motion } from 'framer-motion';
import type { WorkflowNode } from '@/types';
import { User, Brain, Activity, GitBranch, MessageSquare } from 'lucide-react';

interface WorkflowVisualizerProps {
  activeNode?: string;
}

const nodes: WorkflowNode[] = [
  { id: 'input', label: '用户输入', status: 'completed', description: '接收用户消息' },
  { id: 'sentiment', label: '情绪分析', status: 'pending', description: '分析用户情绪' },
  { id: 'intent', label: '意图识别', status: 'pending', description: '识别用户意图' },
  { id: 'router', label: '路由决策', status: 'pending', description: '决定处理策略' },
  { id: 'response', label: '响应生成', status: 'pending', description: '生成AI回复' }
];

const nodeIcons: Record<string, React.ElementType> = {
  input: User,
  sentiment: Activity,
  intent: Brain,
  router: GitBranch,
  response: MessageSquare
};

export function WorkflowVisualizer({ activeNode = 'input' }: WorkflowVisualizerProps) {
  // 根据活跃节点更新状态
  const getNodeStatus = (nodeId: string): WorkflowNode['status'] => {
    const nodeOrder = ['input', 'sentiment', 'intent', 'router', 'response'];
    const activeIndex = nodeOrder.indexOf(activeNode);
    const currentIndex = nodeOrder.indexOf(nodeId);
    
    if (currentIndex < activeIndex) return 'completed';
    if (currentIndex === activeIndex) return 'active';
    return 'pending';
  };

  const getEdgeStatus = (from: string, to: string): 'pending' | 'active' | 'completed' => {
    const fromStatus = getNodeStatus(from);
    const toStatus = getNodeStatus(to);
    
    if (fromStatus === 'completed' && toStatus === 'completed') return 'completed';
    if (fromStatus === 'completed' && toStatus === 'active') return 'active';
    return 'pending';
  };

  return (
    <div className="bg-[#262626] rounded-xl p-4 border border-[#404040]">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#d9d9d9]">Agent 工作流</h3>
        <span className="text-[10px] text-[#a3a3a3]">实时监控</span>
      </div>

      {/* 工作流图 */}
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {nodes.map((node, index) => {
          const Icon = nodeIcons[node.id];
          const status = getNodeStatus(node.id);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';
          
          return (
            <div key={node.id} className="flex items-center flex-shrink-0">
              {/* 节点 */}
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  boxShadow: isActive 
                    ? '0 0 20px rgba(59, 208, 238, 0.4)' 
                    : '0 0 0px rgba(59, 208, 238, 0)'
                }}
                transition={{ duration: 0.3 }}
                className={`relative flex flex-col items-center p-3 rounded-lg min-w-[80px] ${
                  isActive 
                    ? 'bg-[#3bd0ee20] border border-[#3bd0ee]' 
                    : isCompleted
                      ? 'bg-[#22c55e20] border border-[#22c55e]'
                      : 'bg-[#1a1a1a] border border-[#404040]'
                }`}
              >
                {/* 状态指示器 */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  isActive 
                    ? 'bg-[#3bd0ee] animate-pulse' 
                    : isCompleted
                      ? 'bg-[#22c55e]'
                      : 'bg-[#404040]'
                }`} />
                
                {/* 图标 */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  isActive 
                    ? 'bg-[#3bd0ee]' 
                    : isCompleted
                      ? 'bg-[#22c55e]'
                      : 'bg-[#404040]'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isActive || isCompleted ? 'text-[#1a1a1a]' : 'text-[#a3a3a3]'
                  }`} />
                </div>
                
                {/* 标签 */}
                <span className={`text-[10px] font-medium ${
                  isActive 
                    ? 'text-[#3bd0ee]' 
                    : isCompleted
                      ? 'text-[#22c55e]'
                      : 'text-[#a3a3a3]'
                }`}>
                  {node.label}
                </span>
                
                {/* 描述 */}
                <span className="text-[9px] text-[#666] mt-0.5 text-center">
                  {node.description}
                </span>
              </motion.div>
              
              {/* 连接线 */}
              {index < nodes.length - 1 && (
                <div className="flex items-center mx-2">
                  <div className="relative w-8 h-[2px]">
                    {/* 背景线 */}
                    <div className="absolute inset-0 bg-[#404040]" />
                    
                    {/* 流动线 */}
                    <motion.div
                      className="absolute inset-0"
                      style={{
                        background: getEdgeStatus(node.id, nodes[index + 1].id) === 'completed'
                          ? '#22c55e'
                          : getEdgeStatus(node.id, nodes[index + 1].id) === 'active'
                            ? 'linear-gradient(90deg, #22c55e, #3bd0ee)'
                            : '#404040',
                        transformOrigin: 'left'
                      }}
                      initial={{ scaleX: 0 }}
                      animate={{ 
                        scaleX: getEdgeStatus(node.id, nodes[index + 1].id) !== 'pending' ? 1 : 0 
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                    
                    {/* 流动动画 */}
                    {getEdgeStatus(node.id, nodes[index + 1].id) === 'active' && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3bd0ee] to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ 
                          duration: 1, 
                          repeat: Infinity, 
                          ease: 'linear' 
                        }}
                      />
                    )}
                  </div>
                  
                  {/* 箭头 */}
                  <div 
                    className={`w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] ${
                      getEdgeStatus(node.id, nodes[index + 1].id) === 'completed'
                        ? 'border-l-[#22c55e]'
                        : getEdgeStatus(node.id, nodes[index + 1].id) === 'active'
                          ? 'border-l-[#3bd0ee]'
                          : 'border-l-[#404040]'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-[#404040]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span className="text-[10px] text-[#a3a3a3]">已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3bd0ee] animate-pulse" />
          <span className="text-[10px] text-[#a3a3a3]">处理中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#404040]" />
          <span className="text-[10px] text-[#a3a3a3]">待处理</span>
        </div>
      </div>
    </div>
  );
}
