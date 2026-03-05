# Agent-chat - AI情绪识别智能客服系统

<div align="center">

**基于 LangGraph 多Agent编排的智能客服系统**

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)]
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)]
[![LangGraph](https://img.shields.io/badge/LangGraph-Latest-orange.svg)]
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)]

</div>

---

## 🎯 项目简介

这是一个基于 **LangGraph** 多Agent编排的智能客服系统，支持实时情绪分析、意图识别和智能路由。

### 核心功能

- 🤖 **多Agent编排** - 基于 LangGraph 的状态机架构
- 😊 **情绪分析** - 实时识别用户情绪（愤怒/不满/正常）
- 🎯 **意图识别** - 自动判断用户需求
- 📚 **RAG检索** - 混合检索（ChromaDB向量 + BM25关键词）
- 🔄 **智能路由** - 自动判断是否转人工
- 💬 **拟人化回复** - 支持多种Persona风格

---

## 🚀 快速开始

### 1. 环境要求

```bash
Python >= 3.10
Node.js >= 18
MySQL >= 8.0 (可选)
Redis (可选)
```

### 2. 克隆项目

```bash
git clone https://github.com/greatheart1000/Agent-chat.git
cd Agent-chat
```

### 3. 后端部署

#### 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

#### 配置环境变量

编辑 `backend/.env` 文件：

```bash
# LLM 配置
LLM_PROVIDER=zhipu
ZHIPU_API_KEY=your_api_key_here
ZHIPU_MODEL=glm-5

# 数据库配置
DATABASE_URL=mysql+aiomysql://root:password@localhost:3306/agent_chat
REDIS_URL=redis://localhost:6379/0

# API 配置
API_HOST=0.0.0.0
API_PORT=8000
```

#### 初始化数据库

```bash
python init_db_simple.py
```

#### 启动服务

```bash
# 方式1: 直接启动
python -m uvicorn app.api.main:app --host 0.0.0.0 --port 8000

# 方式2: 使用启动脚本
bash start_zhipu.sh
```

服务启动后访问：
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

### 4. 前端部署（可选）

```bash
cd app
npm install
npm run dev
```

前端访问：http://localhost:5173

---

## 📖 API 使用示例

### 添加知识

```bash
curl -X POST http://localhost:8000/api/v1/knowledge/add \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "订单查询：登录官网进入我的订单页面",
      "退款流程：提交申请后3-5个工作日到账"
    ],
    "ids": ["order_001", "refund_001"]
  }'
```

### 发送消息

```bash
curl -X POST http://localhost:8000/api/v1/chat/send \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，我想查询订单",
    "session_id": "test_001"
  }'
```

### 搜索知识

```bash
curl "http://localhost:8000/api/v1/knowledge/search?query=如何退款&top_k=3"
```

---

## 🏗️ 项目结构

```
Agent-chat/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── agents/         # Agent 编排
│   │   ├── api/            # REST API
│   │   ├── core/           # 核心配置
│   │   └── services/       # 业务服务
│   ├── requirements.txt    # Python 依赖
│   └── init_db_simple.py   # 数据库初始化
│
└── app/                    # 前端界面
    ├── src/
    │   ├── components/     # React 组件
    │   ├── hooks/          # 自定义 Hooks
    │   └── lib/            # 工具函数
    └── package.json        # Node 依赖
```

---

## 🔧 配置说明

### LLM 提供商

支持以下 LLM 提供商：

1. **智谱 AI** (推荐)
   - 注册地址：https://open.bigmodel.cn/
   - 模型：GLM-5
   - 配置：`LLM_PROVIDER=zhipu`

2. **Kimi** (月之暗面)
   - 配置：`LLM_PROVIDER=kimi`

3. **OpenAI**
   - 配置：`LLM_PROVIDER=openai`

### Embedding 模型

- **国产 BGE-M3** (推荐，需下载)
- **智谱 embedding-v2** (API)
- **BM25 检索** (无需模型，自动降级)

---

## 📝 技术栈

### 后端
- **FastAPI** - Web 框架
- **LangGraph** - Agent 编排
- **ChromaDB** - 向量数据库
- **MySQL** - 关系型数据库
- **Redis** - 缓存

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **shadcn/ui** - 组件库
- **Tailwind CSS** - 样式

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- [智谱 AI](https://open.bigmodel.cn/) - 提供 LLM 服务
- [LangGraph](https://langchain-ai.github.io/langgraph/) - Agent 编排框架
- [ChromaDB](https://www.trychroma.com/) - 向量数据库

---

<div align="center">

**[⬆ 返回顶部](#agent-chat---ai情绪识别智能客服系统)**

Made with ❤️ by [greatheart1000](https://github.com/greatheart1000)

</div>
