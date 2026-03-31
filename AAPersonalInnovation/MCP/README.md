# 100 工具 MCP 网关示例

这个项目提供一个可扩展的 MCP 多服务架构：将工具按业务域拆分到多个 server，再由一个统一 `client.py` 对外调用。  
当前示例包含 4 个 domain server（可扩展到 100+ 工具）：

- `db-mcp-server`: 只读数据库查询（SQLite）
- `file-mcp-server`: 受限目录下的文件浏览/读取/搜索
- `order-mcp-server`: 订单查询、客户画像、备注、状态更新
- `infra-mcp-server`: 天气 mock、安全 HTTP JSON 拉取、短信 mock

默认传输是 `streamable-http`，路径 `/mcp`。

## MCP 的几种模式

### 1) 能力模式（协议层）

- `Tool`: 可执行动作（查询、写入、调用外部 API）
- `Resource`: 只读上下文资源（runbook、字典、策略文档）
- `Prompt`: 可复用的提示词模板

### 2) 传输模式（连接层）

- `streamable-http`（推荐）: 适合远程、多实例、生产环境
- `stdio`: 适合本地单进程调试
- `sse`: 适合浏览器/流式事件场景

### 3) 部署模式（架构层）

- `单 Server`: 工具少、维护简单
- `多 Server`: 工具多（例如 100+）时按域拆分，更易扩展和治理

## 如何使用这个“100 工具”MCP

即使你最终有 100 个工具，使用方式保持不变：`发现 -> 调用 -> 观测 -> 治理`。

### 1) 安装

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) 启动服务

```bash
python run_servers.py
```

可改端口：

```bash
python run_servers.py --base-port 19001
```

### 3) 发现所有工具

```bash
python client.py list-tools
```

建议统一命名规范：`<domain>_<action>_<object>`，例如 `order_update_status`。  
当工具增长到 100 个时，命名前缀是最有效的治理手段。

### 4) 调用工具

调用 DB 工具：

```bash
python client.py call db_execute_readonly_sql --args '{"sql":"SELECT * FROM orders LIMIT 2"}'
```

调用订单工具：

```bash
python client.py call order_update_status --args '{"order_id":"O1002","status":"PAID","operator":"ops","reason":"manual verification"}'
```

### 5) 使用资源与提示模板

```bash
python client.py list-resources
python client.py read-resource --server db --uri 'runbook://db/readonly-policy'
```

### 6) 自定义服务地址（多环境/多集群）

编辑 `servers.json`：

```json
{
  "db": "http://127.0.0.1:18001/mcp",
  "file": "http://127.0.0.1:18002/mcp",
  "order": "http://127.0.0.1:18003/mcp",
  "infra": "http://127.0.0.1:18004/mcp"
}
```

然后：

```bash
python client.py --servers-file servers.json list-tools
```

## 当前目录结构

- `servers/db_mcp_server/server.py`
- `servers/file_mcp_server/server.py`
- `servers/order_mcp_server/server.py`
- `servers/infra_mcp_server/server.py`
- `client.py`
- `run_servers.py`
- `tests/`

## 安全与稳定性（已实现）

- DB 工具仅允许只读 SQL，拦截 DML/DDL 与多语句绕过
- 文件搜索跳过二进制与超大文件，防止扫描放大
- Infra HTTP 工具拦截内网/环回地址，降低 SSRF 风险
- 客户端兼容 Python 3.13 下已知 streamable-http 关闭异常（非致命）

## 测试

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```

## 还可以改进的点

1. 增加鉴权与权限模型：按工具、按参数、按租户做 RBAC/ABAC。  
2. 增加可观测性：请求 ID、调用链、耗时分位、错误分类、审计日志。  
3. 增加可靠性策略：超时分级、重试预算、熔断和并发舱壁。  
4. 增加强类型契约：统一 JSON Schema 版本、向后兼容策略。  
5. 增加工具注册中心：支持工具标签、版本、灰度发布和下线流程。  
6. 增加 CI/CD：静态检查 + 单测 + 集成测试 + 安全扫描 + 自动发布。  
7. 增加缓存层：高频只读工具可加 TTL 缓存减少后端压力。  
8. 增加多环境配置：dev/stage/prod 的 server 地址与密钥隔离。  
9. 增加限流与配额：防止 100 工具场景下某类工具把系统打满。  
10. 增加回放能力：把真实调用脱敏后沉淀为回归样本集。
