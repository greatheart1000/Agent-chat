import { useState, useCallback, useRef } from 'react';
import type { Message, SentimentResult, RouterResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { detectIntent, getResponse } from '@/lib/mockResponses';

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  addMessage: (content: string, sentiment: SentimentResult, routerResult: RouterResult) => Promise<void>;
  clearChat: () => void;
  generateSummary: () => string;
}

// 生成会话摘要
function generateConversationSummary(messages: Message[]): string {
  if (messages.length === 0) return '新会话';
  
  const userMessages = messages.filter(m => m.role === 'user');
  
  // 提取关键问题
  const issues: string[] = [];
  userMessages.slice(-5).forEach(m => {
    const content = m.content;
    if (content.includes('订单')) issues.push('订单查询');
    if (content.includes('物流') || content.includes('快递')) issues.push('物流追踪');
    if (content.includes('退款') || content.includes('退货')) issues.push('退款问题');
    if (content.includes('投诉')) issues.push('投诉反馈');
    if (content.includes('技术') || content.includes('错误')) issues.push('技术问题');
  });
  
  const uniqueIssues = [...new Set(issues)];
  const issueText = uniqueIssues.length > 0 
    ? uniqueIssues.join('、') 
    : '一般咨询';
  
  // 统计情绪
  const criticalCount = userMessages.filter(m => m.sentiment?.level === 'critical').length;
  const warningCount = userMessages.filter(m => m.sentiment?.level === 'warning').length;
  
  let emotionSummary = '情绪平稳';
  if (criticalCount > 0) emotionSummary = '情绪严重不满';
  else if (warningCount > 0) emotionSummary = '情绪不耐烦';
  
  return `用户问题: ${issueText} | 对话轮数: ${userMessages.length}轮 | 情绪状态: ${emotionSummary}`;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(messages);
  
  // 保持ref同步
  messagesRef.current = messages;

  const addMessage = useCallback(async (
    content: string,
    sentiment: SentimentResult,
    routerResult: RouterResult
  ): Promise<void> => {
    // 添加用户消息
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      sentiment
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // 检测意图
    const intent = detectIntent(content);
    const isHandoffRequest = intent.type === 'handoff';
    
    // 如果是转人工，不生成AI回复
    if (routerResult.decision === 'handoff' || isHandoffRequest) {
      setIsTyping(true);
      
      // 模拟思考时间
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const response = getResponse('handoff', intent.type, true);
      
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        metadata: {
          strategy: 'handoff',
          responseTime: 800
        }
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
      return;
    }
    
    // AI思考中
    setIsTyping(true);
    
    // 模拟响应时间 (根据策略不同)
    const baseDelay = routerResult.decision === 'empathetic' ? 1200 : 800;
    const randomDelay = Math.floor(Math.random() * 400);
    await new Promise(resolve => setTimeout(resolve, baseDelay + randomDelay));
    
    // 生成回复
    const response = getResponse(routerResult.decision, intent.type);
    
    const aiMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        strategy: routerResult.decision,
        responseTime: baseDelay + randomDelay
      }
    };
    
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
  }, []);

  const generateSummary = useCallback((): string => {
    return generateConversationSummary(messagesRef.current);
  }, []);

  return {
    messages,
    isTyping,
    addMessage,
    clearChat,
    generateSummary
  };
}
