import { useState, useCallback, useRef } from 'react';
import type { SentimentResult, Message } from '@/types';
import { analyzeSentiment } from '@/lib/sentimentRules';

interface UseSentimentAnalyzerReturn {
  sentiment: SentimentResult | null;
  isAnalyzing: boolean;
  analyze: (message: string, history: Message[]) => Promise<SentimentResult>;
  reset: () => void;
}

export function useSentimentAnalyzer(): UseSentimentAnalyzerReturn {
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (
    message: string, 
    history: Message[]
  ): Promise<SentimentResult> => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    
    try {
      // 模拟异步分析过程
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 执行情绪分析
      const result = analyzeSentiment(message, history);
      
      setSentiment(result);
      setIsAnalyzing(false);
      
      return result;
    } catch (error) {
      setIsAnalyzing(false);
      // 返回默认结果
      const defaultResult: SentimentResult = {
        score: 0,
        level: 'normal',
        triggers: ['分析失败'],
        keywords: []
      };
      setSentiment(defaultResult);
      return defaultResult;
    }
  }, []);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSentiment(null);
    setIsAnalyzing(false);
  }, []);

  return {
    sentiment,
    isAnalyzing,
    analyze,
    reset
  };
}
