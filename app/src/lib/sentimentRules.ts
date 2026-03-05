import type { SentimentResult, Message, SentimentLevel } from '@/types';

// 情绪分析规则配置
export const SENTIMENT_RULES = {
  // 显式转人工指令 - 直接触发最高级别
  explicitHandoff: [
    '转人工', '找真人', '人工客服', '人工服务', '人工',
    '我要投诉', '找你们领导', '叫你们经理', '找主管',
    '不要机器人', '不要ai', '不要智能客服',
    '听不懂人话', '鸡同鸭讲', '对牛弹琴'
  ],
  
  // 强烈负面情绪词 - +30分
  strongNegativeWords: [
    '垃圾', '废物', '骗子', '坑人', '倒闭', '投诉', '举报',
    '诈骗', '流氓', '无耻', '混蛋', '他妈的', 'tmd', 'md',
    '气死了', '气死我了', '火大', '愤怒', '暴怒'
  ],
  
  // 中等负面情绪词 - +15分
  mediumNegativeWords: [
    '差', '慢', '烂', '气', '烦', '失望', '不满', '郁闷',
    '糟糕', '难受', '恶心', '讨厌', '反感', '无奈', '头疼',
    '有问题', '出错了', '不好用', '不灵', '不行'
  ],
  
  // 轻微负面情绪词 - +5分
  lightNegativeWords: [
    '不好', '不行', '不对', '问题', '错误', '麻烦', '困惑',
    '不懂', '不明白', '不清楚', '不知道', '疑惑'
  ],
  
  // 标点权重
  punctuation: {
    multipleExclamation: 10,  // !!!
    multipleQuestion: 8,      // ???
    allCaps: 15               // 全大写
  },
  
  // 重复提问检测
  repetition: {
    threshold: 2,             // 重复2次就开始加分
    score: 15                 // 每次重复+15
  },
  
  // 连续否定检测
  negation: {
    words: ['不', '没', '无', '非'],
    consecutiveBonus: 10      // 连续否定加分
  }
};

// 计算字符串相似度 (简化版)
function similarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, '');
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  let matchCount = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matchCount++;
  }
  
  return matchCount / longer.length;
}

// 主情绪分析函数
export function analyzeSentiment(
  message: string, 
  history: Message[]
): SentimentResult {
  let score = 0;
  const triggers: string[] = [];
  const keywords: string[] = [];
  const lowerMsg = message.toLowerCase();
  
  // 1. 检测显式转人工指令 (最高优先级)
  for (const word of SENTIMENT_RULES.explicitHandoff) {
    if (lowerMsg.includes(word)) {
      score = 100;
      triggers.push('用户明确要求转人工');
      keywords.push(word);
      return { 
        score: 100, 
        level: 'critical', 
        triggers, 
        keywords 
      };
    }
  }
  
  // 2. 检测强烈负面情绪词
  for (const word of SENTIMENT_RULES.strongNegativeWords) {
    if (lowerMsg.includes(word)) {
      score += 30;
      keywords.push(word);
      if (!triggers.includes('检测到强烈负面情绪词')) {
        triggers.push('检测到强烈负面情绪词');
      }
    }
  }
  
  // 3. 检测中等负面情绪词
  for (const word of SENTIMENT_RULES.mediumNegativeWords) {
    if (lowerMsg.includes(word)) {
      score += 15;
      keywords.push(word);
      if (!triggers.includes('检测到负面情绪')) {
        triggers.push('检测到负面情绪');
      }
    }
  }
  
  // 4. 检测轻微负面情绪词
  for (const word of SENTIMENT_RULES.lightNegativeWords) {
    if (lowerMsg.includes(word)) {
      score += 5;
      keywords.push(word);
    }
  }
  
  // 5. 检测标点符号情绪
  if (/!{2,}/.test(message)) {
    score += SENTIMENT_RULES.punctuation.multipleExclamation;
    triggers.push('强烈情绪标点(!!)');
  }
  
  if (/\?{2,}/.test(message)) {
    score += SENTIMENT_RULES.punctuation.multipleQuestion;
    triggers.push('连续疑问(??)');
  }
  
  // 6. 检测全大写 (英文愤怒)
  const lettersOnly = message.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length > 3 && lettersOnly === lettersOnly.toUpperCase()) {
    score += SENTIMENT_RULES.punctuation.allCaps;
    triggers.push('全大写输入');
  }
  
  // 7. 检测重复提问
  const userMessages = history.filter(m => m.role === 'user');
  let repeatCount = 0;
  for (const histMsg of userMessages.slice(-5)) { // 只看最近5条
    if (similarity(histMsg.content, message) > 0.7) {
      repeatCount++;
    }
  }
  
  if (repeatCount >= SENTIMENT_RULES.repetition.threshold) {
    score += SENTIMENT_RULES.repetition.score * (repeatCount - 1);
    triggers.push(`重复提问${repeatCount + 1}次`);
  }
  
  // 8. 检测连续否定
  const negationMatches = lowerMsg.match(/[不没无非]/g);
  if (negationMatches && negationMatches.length >= 3) {
    score += SENTIMENT_RULES.negation.consecutiveBonus;
    triggers.push('连续否定表达');
  }
  
  // 确保分数在0-100范围内
  score = Math.min(Math.max(score, 0), 100);
  
  // 确定情绪等级
  let level: SentimentLevel = 'normal';
  if (score >= 71) level = 'critical';
  else if (score >= 41) level = 'warning';
  
  // 如果没有明确触发因素但分数较高，添加默认说明
  if (triggers.length === 0 && score > 0) {
    triggers.push('综合情绪评估');
  }
  
  return { 
    score, 
    level, 
    triggers: triggers.length > 0 ? triggers : ['情绪正常'], 
    keywords: keywords.length > 0 ? keywords : [] 
  };
}

// 获取情绪等级对应的颜色
export function getSentimentColor(level: SentimentLevel): string {
  switch (level) {
    case 'normal':
      return '#22c55e'; // 绿色
    case 'warning':
      return '#f59e0b'; // 琥珀色
    case 'critical':
      return '#ef4444'; // 红色
    default:
      return '#22c55e';
  }
}

// 获取情绪等级对应的标签
export function getSentimentLabel(level: SentimentLevel): string {
  switch (level) {
    case 'normal':
      return '平静';
    case 'warning':
      return '不耐烦';
    case 'critical':
      return '愤怒';
    default:
      return '平静';
  }
}
