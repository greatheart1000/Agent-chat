export type SentimentLevel = 'normal' | 'warning' | 'critical';

export interface SentimentResult {
  score: number;           // 0-100
  level: SentimentLevel;
  triggers: string[];      // 触发因素
  keywords: string[];      // 检测到的关键词
}

export type IntentType = 'handoff_request' | 'query' | 'greeting' | 'complaint' | 'unknown' | 'handoff';

export interface IntentResult {
  type: IntentType;
  confidence: number;
  entities?: Record<string, string>;
}

export type RouterDecision = 'continue' | 'empathetic' | 'handoff';

export interface RouterResult {
  decision: RouterDecision;
  reason: string;
  priority: number;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sentiment?: SentimentResult;
  metadata?: {
    responseTime?: number;
    strategy?: string;
  };
}

export type AgentType = 'conversation' | 'sentiment' | 'router';

export interface AgentState {
  type: AgentType;
  status: 'idle' | 'processing' | 'completed' | 'error';
  currentTask?: string;
}

export type HandoffStatus = 'idle' | 'queued' | 'assigned' | 'connected' | 'cancelled';

export interface HandoffState {
  status: HandoffStatus;
  queuePosition?: number;
  estimatedWaitTime?: number;
  agentName?: string;
  agentAvatar?: string;
}

export interface WorkflowNode {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  status: 'pending' | 'active' | 'completed';
}
