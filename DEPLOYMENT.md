# 本地构建与 GitHub Pages 发布准备

本轮未上传、未触发 Actions、未公开发布。仅发布 dist/ 中的文件，服务器无需 Node.js、node_modules 或 server.mjs。不要直接托管项目根目录。

## 启动与构建

使用 Node.js 22.12+（建议 Node 22 LTS），先执行 npm ci。

- npm run dev：开发服务器；npm start 同样启动 Vite。
- npm run check：原控制、IK、碰撞及构建脚本语法检查。
- npm run build：生成 dist/，默认部署根路径 /。
- npm run preview -- --port 4173：预览已构建产物，不是生产服务器。

复制 MediaPipe WASM 的脚本在 dev/start/build 前自动运行。正式模型来自 public/models，自动原样复制。所有正式美术纹理由 Canvas 在运行时生成，其代码包含在 JS 包内，无独立图片请求。third-party notices 和许可证随 public 一起复制。

## 仓库子路径（PowerShell）

以下 static-check 仅为测试路径，不是实际仓库信息：

```powershell
$env:DEPLOY_BASE='/static-check/'
npm run build
npm run preview -- --port 4174 --strictPort
# 打开 http://127.0.0.1:4174/static-check/
$env:PREVIEW_URL='http://127.0.0.1:4174/static-check/'
node verify-production.mjs
```

实际部署时，将 DEPLOY_BASE 改为 /实际仓库名/。用户站点或自定义域名使用 /。构建与 preview 应使用相同环境变量，或 preview 加 --base=/构建时路径/。恢复根路径：Remove-Item Env:DEPLOY_BASE 后重新 build。环境变量只在构建时决定 URL，不需要部署秘密或摄像头凭据。

verify-production.mjs 使用本机既有 Playwright/Chrome 路径，仅为本地验收工具，不打进 dist，也不是 CI 依赖；换电脑需调整其导入路径。

## Pages 工作流

.github/workflows/pages.yml 只有 workflow_dispatch，没有 push 或 pull_request 触发。未来授权发布后，再上传仓库，在 GitHub Settings → Pages 选择 GitHub Actions，然后手动运行工作流并填写 base。工作流先 npm ci、check、build，上传 dist，再部署到 github-pages 环境。可在该环境配置人工审批。当前未创建或假定任何远程仓库。

方案遵循 Vite 静态部署文档：https://vite.dev/guide/static-deploy 。Pages 摄像头需要 HTTPS 与用户授权；本机 localhost 可用于测试。

## 验收边界

使用 /static-check/ 验证实际生产包，记录请求 URL、HTTP 错误、页面异常和浏览器控制台错误；故意阻断一次模型下载以验证重试，再实际初始化模型和 WASM。所有 WASM 变体额外逐一请求确认 200。启用模拟抬手、灯光开关检查。未请求 /node_modules/，未向外部域名发送请求或上传摄像头画面。

故障注入阶段有一条预期的 ERR_FAILED 控制台信息（主动阻断模型请求）；恢复后正常阶段控制台错误为零。模型已与官方 float16/1 下载文件核对 SHA256，一致且未更换。

真人摄像头实测：本轮未执行。自动测试模拟权限拒绝，没有采集真人视频；仍需真人验证双手识别、遮挡恢复、不同设备与摄像头权限重试。

产物约 49.05 MiB，主要为三种 WASM 变体和手部模型。保留 SIMD、非 SIMD、module 三种完整版本以适配运行时选择。JS 主包约 742 kB（gzip 195 kB），构建有大于 500 kB 的体积提示，属于提示，不是失败；本轮未做额外拆包。

库、模型、美术来源与许可详见 public/THIRD_PARTY_NOTICES.txt，完整许可位于 public/licenses/，二者都会复制到 dist。
