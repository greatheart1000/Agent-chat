import { useState, useCallback } from 'react';
import type { SentimentResult, RouterResult } from '@/types';

interface UseRouterAgentReturn {
  routerResult: RouterResult | null;
  isRouting: boolean;
  makeDecision: (sentiment: SentimentResult, intent: { type: string; confidence: number }) => Promise<RouterResult>;
  reset: () => void;
}

// 路由决策逻辑
export function makeRoutingDecision(
  sentiment: SentimentResult,
  intent: { type: string; confidence: number }
): RouterResult {
  // 最高优先级: 显式转人工请求
  if (intent.type === 'handoff' || intent.type === 'handoff_request') {
    return {
      decision: 'handoff',
      reason: '用户明确要求转接人工客服',
      priority: 1
    };
  }
  
  // 最高优先级: 情绪分数达到临界值
  if (sentiment.score >= 80) {
    return {
      decision: 'handoff',
      reason: `情绪分数过高 (${sentiment.score}分)，需要人工介入`,
      priority: 1
    };
  }
  
  // 次高优先级: 严重负面情绪
  if (sentiment.level === 'critical') {
    return {
      decision: 'handoff',
      reason: `检测到严重负面情绪 (${sentiment.triggers.join(', ')})`,
      priority: 1
    };
  }
  
  // 中等级别: 警告级别情绪，使用安抚策略
  if (sentiment.level === 'warning' || sentiment.score >= 50) {
    return {
      decision: 'empathetic',
      reason: `检测到用户情绪不耐烦 (${sentiment.score}分)，切换安抚策略`,
      priority: 2
    };
  }
  
  // 默认: 继续标准对话
  return {
    decision: 'continue',
    reason: sentiment.score > 0 
      ? `情绪分数 ${sentiment.score}分，在正常范围内`
      : '用户情绪平稳，继续标准服务流程',
    priority: 3
  };
}

export function useRouterAgent(): UseRouterAgentReturn {
  const [routerResult, setRouterResult] = useState<RouterResult | null>(null);
  const [isRouting, setIsRouting] = useState(false);

  const makeDecision = useCallback(async (
    sentiment: SentimentResult,
    intent: { type: string; confidence: number }
  ): Promise<RouterResult> => {
    setIsRouting(true);
    
    // 模拟路由决策过程
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const result = makeRoutingDecision(sentiment, intent);
    
    setRouterResult(result);
    setIsRouting(false);
    
    return result;
  }, []);

  const reset = useCallback(() => {
    setRouterResult(null);
    setIsRouting(false);
  }, []);

  return {
    routerResult,
    isRouting,
    makeDecision,
    reset
  };
}
