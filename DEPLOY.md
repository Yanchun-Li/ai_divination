# 使用 AI Builder 部署本项目的说明

## 一、AI Builder 部署是什么？

AI Builder 的 **Deployments API** 会把你仓库里的代码部署到 **Koyeb** 云上，得到一个公网地址，例如：

`https://你的服务名.ai-builders.space`

- **单进程、单端口**：平台要求一个服务只跑一个进程，只监听一个端口。
- **必须遵守 PORT**：运行时平台会设置环境变量 `PORT`（例如 8000），你的应用必须监听这个端口，否则健康检查会失败。
- **公开仓库**：只能部署公开的 Git 仓库，代码里不要写密钥（密钥用环境变量传入）。

所以我们的项目（前端 Next.js + 后端 FastAPI）需要**合并成一个服务**：  
用 FastAPI 同时提供 API 和静态页面，并监听 `PORT`。

---

## 二、我们项目当前结构 vs 部署要求

| 当前本地开发 | 部署后的形态 |
|-------------|--------------|
| 前端：Next.js 跑在 3000 端口 | 前端：Next.js 先打成**静态文件**，由 FastAPI 托管 |
| 后端：FastAPI 跑在 8000 端口 | 后端：FastAPI 跑在 **PORT** 端口，同时挂载静态文件 |
| 两个进程 | **一个进程**（uvicorn 跑 FastAPI） |

实现思路：

1. **Next.js** 使用 `output: 'export'` 做静态导出，生成 `web/out` 目录。
2. **FastAPI** 在挂完所有 API 路由后，把 `web/out` 挂到根路径 `/`，这样访问首页或前端路由时返回静态文件；`/api/*`、`/health` 仍由 FastAPI 处理。
3. **启动时** 使用环境变量 `PORT`（例如 `uvicorn ... --port $PORT`），保证监听平台给的端口。
4. 用 **Docker** 在镜像里完成「先 build 前端，再拷贝到后端目录，最后只跑 uvicorn」这一套流程，满足「单进程、单端口」。

---

## 三、部署流程（你需要做的）

1. **代码推送到公开 Git 仓库**（GitHub 等），确保没有把 `.env`、密钥等提交进去。
2. **拿到 AI Builder 的 API Token**（用于调用 Deployments API）。
3. **调用部署接口**（见下方「如何触发部署」），或在平台提供的界面里填写仓库地址、服务名、分支等。
4. **等待约 5–10 分钟**，然后访问 `https://你的服务名.ai-builders.space` 检查是否正常。

部署时如需带环境变量（如 `AI_BUILDER_API_KEY`、`FRONTEND_ORIGIN`），在请求 body 里通过 `env_vars` 传入即可（不要写进代码）。

---

## 四、如何触发部署（调用 AI Builder Deployments API）

1. **准备**  
   - 项目已推送到**公开** Git 仓库（如 GitHub）。  
   - 你有 AI Builder 的 **API Token**（Bearer Token）。

2. **请求示例**  
   向 AI Builder 后端发 `POST` 请求（Base URL 以平台文档为准，例如 `https://space.ai-builders.com/backend`）：

   ```http
   POST /v1/deployments
   Authorization: Bearer 你的AI_BUILDER_TOKEN
   Content-Type: application/json
   ```

   Body（JSON）：

   ```json
   {
     "repo_url": "https://github.com/你的用户名/AI_Divination",
     "service_name": "ai-divination",
     "branch": "main",
     "port": 8000,
     "env_vars": {
       "FRONTEND_ORIGIN": "https://ai-divination.ai-builders.space",
       "REDIS_URL": "redis://...",
       "AI_BUILDER_API_KEY": "你的 AI Builder Chat API Key"
     }
   }
   ```

   - `service_name`：3–32 位小写字母/数字/连字符，也是子域名（如 `ai-divination` → `https://ai-divination.ai-builders.space`）。  
   - `env_vars`：按需填写，**不要**把密钥写进代码或提交到仓库。

3. **参考配置**  
   根目录的 `deploy-config.example.json` 里有一份示例，可复制为 `deploy-config.json` 并改成自己的仓库、服务名、分支和 `env_vars`。不要把含真实密钥的 `deploy-config.json` 提交到 Git。

4. **结果与等待**  
   - 接口通常返回 **202 Accepted**，表示部署已排队。  
   - 约 **5–10 分钟** 后，用 `GET /v1/deployments/你的服务名` 查看状态；当 `status` 为 `HEALTHY` 时即可访问 `https://你的服务名.ai-builders.space`。

5. **平台要求**  
   - 仓库根目录需要有可用的 **Dockerfile**（本仓库已提供）。  
   - 应用需监听环境变量 **PORT**（本镜像的 CMD 已使用 `$PORT`）。

---

## 五、本仓库已做的修改（便于你对照）

- **Next.js**：`web/next.config.js` 增加 `output: 'export'`，构建时生成静态站点到 `web/out`。
- **FastAPI**：`backend/app/main.py` 在存在 `backend/app/static` 时，将其挂载到 `/`，并设置 `html=True` 以便前端路由回退到 `index.html`；端口由启动命令通过 `PORT` 传入。
- **Docker**：根目录的 `Dockerfile` 先构建 Next.js（可传 `NEXT_PUBLIC_API_BASE=""` 做同域请求），再把 `web/out` 拷贝到 `backend/app/static`，最后只运行 `uvicorn`，且 `CMD` 使用 `$PORT`。
- **部署配置示例**：根目录的 `deploy-config.example.json` 给出调用 AI Builder Deployments API 的示例（`repo_url`、`service_name`、`branch`、可选 `env_vars` 等），可按需复制为 `deploy-config.json` 并修改，不要提交含密钥的 `deploy-config.json`。

按上述修改后，项目满足「单进程、单端口、遵守 PORT、静态+API 一体」的要求，可以直接用 AI Builder 的 Deployments API 部署。
