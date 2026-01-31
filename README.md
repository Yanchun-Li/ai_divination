# AI占卜

以「占卜」为仪式外壳、以「被理解」为核心体验的AI情绪型娱乐App。

**主要功能：**
- 每日运势（轻量入口，培养打开习惯）
- 塔罗占卜 + AI对话（仪式感占卜，AI解读并提供情绪共情）

**技术栈：** Next.js（前端）+ FastAPI（后端）

详细部署说明请参考 [DEPLOY.md](./DEPLOY.md)。

---

## 快速开始

```bash
# 前端
cd web && npm install && npm run dev

# 后端
cd backend && uv venv && uv pip install -e . && uv run uvicorn app.main:app --reload --port 8000
```

环境变量示例：`backend/.env.example`
