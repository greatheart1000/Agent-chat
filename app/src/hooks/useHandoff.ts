import { useState, useCallback, useRef } from 'react';
import type { HandoffState, Message } from '@/types';

interface UseHandoffReturn {
  handoffState: HandoffState;
  isHandingOff: boolean;
  startHandoff: (userId: string, history: Message[], summary: string) => Promise<void>;
  cancelHandoff: () => void;
  reset: () => void;
}

const INITIAL_STATE: HandoffState = {
  status: 'idle'
};

// 模拟人工客服队列
const MOCK_AGENTS = ['小王', '李姐', '张哥', '陈主管', '刘专员'];

export function useHandoff(): UseHandoffReturn {
  const [handoffState, setHandoffState] = useState<HandoffState>(INITIAL_STATE);
  const [isHandingOff, setIsHandingOff] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearHandoffInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startHandoff = useCallback(async (
    _userId: string,
    _history: Message[],
    _summary: string
  ): Promise<void> => {
    clearHandoffInterval();
    setIsHandingOff(true);
    
    // 模拟加入队列
    const initialPosition = Math.floor(Math.random() * 5) + 1;
    setHandoffState({
      status: 'queued',
      queuePosition: initialPosition,
      estimatedWaitTime: Math.floor(Math.random() * 3) + 1
    });
    
    // 模拟队列进度
    let position = initialPosition;
    intervalRef.current = setInterval(() => {
      position--;
      
      if (position > 0) {
        setHandoffState(prev => ({
          ...prev,
          queuePosition: position,
          estimatedWaitTime: Math.max(1, position)
        }));
      } else {
        // 分配客服
        clearHandoffInterval();
        const agentName = MOCK_AGENTS[Math.floor(Math.random() * MOCK_AGENTS.length)];
        
        setHandoffState({
          status: 'assigned',
          agentName,
          estimatedWaitTime: 0
        });
        
        // 模拟连接成功
        setTimeout(() => {
          setHandoffState({
            status: 'connected',
            agentName,
            agentAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${agentName}`
          });
          setIsHandingOff(false);
        }, 1500);
      }
    }, 2000);
  }, [clearHandoffInterval]);

  const cancelHandoff = useCallback(() => {
    clearHandoffInterval();
    setHandoffState({
      status: 'cancelled'
    });
    setIsHandingOff(false);
    
    // 3秒后重置为空闲状态
    setTimeout(() => {
      setHandoffState(INITIAL_STATE);
    }, 3000);
  }, [clearHandoffInterval]);

  const reset = useCallback(() => {
    clearHandoffInterval();
    setHandoffState(INITIAL_STATE);
    setIsHandingOff(false);
  }, [clearHandoffInterval]);

  return {
    handoffState,
    isHandingOff,
    startHandoff,
    cancelHandoff,
    reset
  };
}
