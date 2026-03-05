import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AgentState } from '@/types';
import { useSentimentAnalyzer } from '@/hooks/useSentimentAnalyzer';
import { useRouterAgent } from '@/hooks/useRouterAgent';
import { useChat } from '@/hooks/useChat';
import { useHandoff } from '@/hooks/useHandoff';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { SentimentMonitor } from '@/components/SentimentMonitor';
import { RouterPanel } from '@/components/RouterPanel';
import { AgentStatus } from '@/components/AgentStatus';
import { WorkflowVisualizer } from '@/components/WorkflowVisualizer';
import { HandoffModal } from '@/components/HandoffModal';
import { TypingIndicator } from '@/components/TypingIndicator';
import { Bot, Activity, MessageSquare, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';

function App() {
  // 自定义hooks
  const { sentiment, isAnalyzing, analyze } = useSentimentAnalyzer();
  const { routerResult, isRouting, makeDecision } = useRouterAgent();
  const { messages, isTyping, addMessage, clearChat, generateSummary } = useChat();
  const { handoffState, isHandingOff, startHandoff, cancelHandoff, reset: resetHandoff } = useHandoff();

  // 本地状态
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [activeWorkflowNode, setActiveWorkflowNode] = useState('input');
  const [showHandoffModal, setShowHandoffModal] = useState(false);

  // 更新Agent状态
  const updateAgentStatus = useCallback((type: AgentState['type'], status: AgentState['status'], task?: string) => {
    setAgents(prev => {
      const existing = prev.find(a => a.type === type);
      if (existing) {
        return prev.map(a => a.type === type ? { ...a, status, currentTask: task } : a);
      }
      return [...prev, { type, status, currentTask: task }];
    });
  }, []);

  // 处理用户消息
  const handleSendMessage = useCallback(async (content: string) => {
    // 1. 对话Agent处理输入
    updateAgentStatus('conversation', 'processing', '接收用户输入');
    setActiveWorkflowNode('input');

    // 2. 情绪分析
    updateAgentStatus('sentiment', 'processing', '分析用户情绪');
    setActiveWorkflowNode('sentiment');
    const sentimentResult = await analyze(content, messages);
    updateAgentStatus('sentiment', 'completed', '情绪分析完成');

    // 3. 路由决策
    updateAgentStatus('router', 'processing', '决策路由策略');
    setActiveWorkflowNode('router');
    const intentType = sentimentResult.score >= 80 ? 'handoff' : 'unknown';
    const intent = { type: intentType, confidence: 0.8 };
    const routerDecision = await makeDecision(sentimentResult, intent);
    updateAgentStatus('router', 'completed', '路由决策完成');

    // 4. 生成响应
    setActiveWorkflowNode('response');
    await addMessage(content, sentimentResult, routerDecision);
    updateAgentStatus('conversation', 'completed', '响应已生成');

    // 5. 检查是否需要转人工
    if (routerDecision.decision === 'handoff' || sentimentResult.score >= 80) {
      setShowHandoffModal(true);
      const summary = generateSummary();
      await startHandoff(uuidv4(), messages, summary);
    }
  }, [analyze, makeDecision, addMessage, messages, startHandoff, generateSummary, updateAgentStatus]);

  // 处理重置
  const handleReset = useCallback(() => {
    clearChat();
    resetHandoff();
    setAgents([]);
    setActiveWorkflowNode('input');
  }, [clearChat, resetHandoff]);

  // 监听转人工状态变化
  useEffect(() => {
    if (handoffState.status === 'queued' && handoffState.queuePosition) {
      // 可以在这里添加系统消息
    }
  }, [handoffState]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#d9d9d9] flex flex-col">
      {/* 头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-16 bg-[#1a1a1a] border-b border-[#404040] flex items-center justify-between px-6 flex-shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3bd0ee] to-[#22c55e] flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#1a1a1a]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[#d9d9d9]">AI客服Agent系统</h1>
            <p className="text-xs text-[#a3a3a3]">多Agent协作智能客服平台</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 系统状态 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded-full border border-[#404040]">
            <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
            <span className="text-xs text-[#a3a3a3]">系统运行中</span>
          </div>

          {/* 重置按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-[#a3a3a3] hover:text-[#d9d9d9] hover:bg-[#2a2a2a]"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置对话
          </Button>
        </div>
      </motion.header>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：聊天区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 消息列表 */}
          <ScrollArea className="flex-1 p-6">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3bd0ee20] to-[#22c55e20] flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10 text-[#3bd0ee]" />
                </div>
                <h2 className="text-xl font-semibold text-[#d9d9d9] mb-2">
                  欢迎使用AI客服Agent系统
                </h2>
                <p className="text-sm text-[#a3a3a3] max-w-md mb-6">
                  这是一个基于多Agent协作的智能客服系统，具备情绪识别和智能转人工能力。
                  试着发送消息体验一下吧！
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                  {['查询订单', '物流追踪', '转人工', '你们服务太差了！！！'].map((text, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(text)}
                      className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#333] border border-[#404040] rounded-lg text-sm text-[#a3a3a3] hover:text-[#d9d9d9] transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-3xl mx-auto">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
              </div>
            )}
          </ScrollArea>

          {/* 工作流可视化 */}
          <div className="px-6 pb-4">
            <WorkflowVisualizer activeNode={activeWorkflowNode} />
          </div>

          {/* 输入框 */}
          <ChatInput 
            onSend={handleSendMessage}
            disabled={isTyping || isHandingOff}
            placeholder={isHandingOff ? '转接中，请稍候...' : '输入消息...'}
          />
        </div>

        {/* 右侧：Agent监控面板 */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-80 bg-[#2a2a2a] border-l border-[#404040] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-[#404040]">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3bd0ee]" />
              <h2 className="text-lg font-semibold text-[#d9d9d9]">Agent 监控中心</h2>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* 情绪监控 */}
              <SentimentMonitor sentiment={sentiment} isAnalyzing={isAnalyzing} />

              {/* 路由决策 */}
              <RouterPanel routerResult={routerResult} isRouting={isRouting} />

              {/* Agent状态 */}
              <AgentStatus agents={agents} />

              {/* 使用说明 */}
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#404040]">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[#a3a3a3]" />
                  <h3 className="text-sm font-medium text-[#d9d9d9]">快速测试</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-[#666]">试试这些触发场景：</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[9px] px-2 py-1 bg-[#22c55e20] text-[#22c55e] rounded">
                      正常: &quot;你好&quot;
                    </span>
                    <span className="text-[9px] px-2 py-1 bg-[#f59e0b20] text-[#f59e0b] rounded">
                      不耐烦: &quot;太慢了&quot;
                    </span>
                    <span className="text-[9px] px-2 py-1 bg-[#ef444420] text-[#ef4444] rounded">
                      愤怒: &quot;垃圾服务!!!&quot;
                    </span>
                    <span className="text-[9px] px-2 py-1 bg-[#8b5cf620] text-[#8b5cf6] rounded">
                      转人工: &quot;找真人&quot;
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.aside>
      </div>

      {/* 转人工模态框 */}
      <HandoffModal
        isOpen={showHandoffModal}
        handoffState={handoffState}
        summary={generateSummary()}
        onCancel={() => {
          cancelHandoff();
          setShowHandoffModal(false);
        }}
      />
    </div>
  );
}

export default App;
