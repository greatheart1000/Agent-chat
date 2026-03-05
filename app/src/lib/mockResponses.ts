import type { RouterDecision } from '@/types';

// 模拟AI响应库
export const MOCK_RESPONSES: Record<string, string[]> = {
  greeting: [
    '您好！我是AI客服助手，很高兴为您服务。请问有什么可以帮您？',
    '您好！欢迎来到智能客服中心，请问您需要什么帮助？',
    '您好！我是您的专属AI客服，有什么可以为您效劳的吗？'
  ],
  
  order: [
    '我来帮您查询订单状态。请提供您的订单号，我立即为您查看。',
    '好的，请告诉我您的订单号，我来帮您跟踪订单进度。',
    '明白，查询订单需要您的订单号，请提供一下。'
  ],
  
  shipping: [
    '关于物流问题，我需要您的订单号来查询具体配送情况。',
    '物流查询需要订单号，您方便提供一下吗？',
    '我来帮您查看物流状态，请先提供订单号。'
  ],
  
  refund: [
    '关于退款问题，我需要了解您的订单情况。请提供订单号，我帮您查询退款进度。',
    '退款问题我来帮您处理。请提供相关订单号，我查看一下具体情况。',
    '理解您的退款需求，请提供订单号，我立即为您核实。'
  ],
  
  complaint: [
    '非常抱歉给您带来了不好的体验。请您详细描述一下遇到的问题，我会尽力帮您解决。',
    '对于您遇到的问题，我深表歉意。请告诉我具体情况，我来协助处理。',
    '抱歉让您失望了。请详细说明问题，我会认真对待并帮您解决。'
  ],
  
  technical: [
    '关于技术问题，我来帮您排查。请描述一下具体遇到了什么错误提示？',
    '技术问题我来协助解决。请告诉我详细的错误信息和操作步骤。',
    '我来帮您解决技术问题。请描述一下问题的具体表现。'
  ],
  
  unknown: [
    '我理解您的需求，让我来帮您处理。',
    '好的，我来协助您解决这个问题。',
    '明白了，让我为您提供帮助。'
  ]
};

// 安抚策略响应
export const EMPATHETIC_RESPONSES: Record<string, string[]> = {
  greeting: [
    '您好！我完全理解您现在的心情，让我来帮您解决问题。',
    '您好！非常理解您的感受，我会尽全力协助您。'
  ],
  
  order: [
    '我理解您着急查询订单的心情，我立刻为您查看。请提供订单号。',
    '非常理解您想尽快了解订单状态的心情，我马上帮您查询。'
  ],
  
  shipping: [
    '等待物流确实让人着急，我完全理解。让我来帮您查看具体情况。',
    '理解您盼望收货的心情，我来帮您追踪物流进度。'
  ],
  
  refund: [
    '退款问题确实让人担心，我非常理解。请放心，我会认真帮您处理。',
    '理解您对退款的关切，让我来帮您核实进度，请提供订单号。'
  ],
  
  complaint: [
    '非常抱歉给您带来了困扰，我能感受到您的不满。请允许我认真帮您解决这个问题。',
    '对于给您造成的不便，我深感抱歉。请详细告诉我情况，我会全力协助。',
    '您的感受我完全理解，真的很抱歉。让我来帮您妥善处理这个问题。'
  ],
  
  technical: [
    '技术问题确实让人头疼，我理解您的困扰。让我来帮您一步步解决。',
    '遇到技术故障很烦人，我完全理解。请告诉我具体情况，我来协助排查。'
  ],
  
  unknown: [
    '我理解您现在的感受，让我来认真帮您处理。',
    '请放心，我会尽全力协助您解决问题。'
  ]
};

// 转人工提示
export const HANDOFF_RESPONSES = [
  '好的，马上为您转接人工客服，请稍候...',
  '理解您的需求，我立即为您转接人工客服专员。',
  '好的，正在为您安排人工客服，请耐心等待...',
  '明白，我立即为您转接人工客服，请稍等片刻。'
];

// 系统消息
export const SYSTEM_MESSAGES = {
  handoffQueued: (position: number, waitTime: number) => 
    `已加入排队队列，当前排队人数: ${position}人，预计等待时间: ${waitTime}分钟`,
  
  handoffAssigned: (agentName: string) => 
    `已为您分配客服专员: ${agentName}，正在接入...`,
  
  handoffConnected: (agentName: string) => 
    `客服专员 ${agentName} 已接入，您好！`,
  
  handoffCancelled: 
    '已取消转人工，继续由AI客服为您服务。',
  
  sentimentWarning: 
    '【系统提示】检测到用户情绪变化，AI已切换至安抚模式。',
  
  sentimentCritical: 
    '【系统提示】检测到用户情绪严重不满，准备转接人工客服。'
};

// 意图识别关键词
export const INTENT_KEYWORDS: Record<string, string[]> = {
  greeting: ['你好', '您好', 'hi', 'hello', '在吗', '有人吗'],
  order: ['订单', '查询', '查一下', '我的订单', '订单号'],
  shipping: ['物流', '快递', '发货', '配送', '送到', '什么时候到', '到哪了'],
  refund: ['退款', '退货', '退钱', '退款进度', '怎么退'],
  complaint: ['投诉', '不满', '太差', '服务不好', '态度差'],
  technical: ['错误', 'bug', '故障', '不能用', '出问题', '报错'],
  handoff: ['转人工', '人工', '真人', '客服', '找你们']
};

// 简单的意图识别
export function detectIntent(message: string): { type: string; confidence: number } {
  const lowerMsg = message.toLowerCase();
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword.toLowerCase())) {
        return { type: intent, confidence: 0.8 };
      }
    }
  }
  
  return { type: 'unknown', confidence: 0.5 };
}

// 根据决策和意图获取响应
export function getResponse(
  decision: RouterDecision, 
  intent: string,
  isHandoffRequest: boolean = false
): string {
  if (decision === 'handoff' || isHandoffRequest) {
    const responses = HANDOFF_RESPONSES;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  const responseMap = decision === 'empathetic' ? EMPATHETIC_RESPONSES : MOCK_RESPONSES;
  const responses = responseMap[intent] || responseMap.unknown;
  return responses[Math.floor(Math.random() * responses.length)];
}
