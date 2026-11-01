# 本地生产验收报告

构建路径：`/static-check/`（测试占位，不是真实仓库名）。

检查与 build 通过；preview 子路径页面与全部 WASM 变体请求成功，实际模型初始化完成。正常阶段控制台和 HTTP 错误为零。人为阻断模型下载阶段出现预期 ERR_FAILED，重试成功。未采集真人摄像头。

总计 51434656 字节（49.05 MiB）。纹理在 JS 中通过 Canvas 生成，无独立纹理下载。

| 文件 | 字节 |
|---|---:|
| dist/assets/index-93BQQlQK.css | 4087 |
| dist/assets/index-BkAIwle0.js | 741958 |
| dist/index.html | 2937 |
| dist/licenses/mediapipe-Apache-2.0.txt | 12331 |
| dist/licenses/three-MIT.txt | 1081 |
| dist/mediapipe/wasm/vision_wasm_internal.js | 334128 |
| dist/mediapipe/wasm/vision_wasm_internal.wasm | 14466654 |
| dist/mediapipe/wasm/vision_wasm_module_internal.js | 334166 |
| dist/mediapipe/wasm/vision_wasm_module_internal.wasm | 14466676 |
| dist/mediapipe/wasm/vision_wasm_nosimd_internal.js | 333931 |
| dist/mediapipe/wasm/vision_wasm_nosimd_internal.wasm | 12915401 |
| dist/models/hand_landmarker.task | 7819105 |
| dist/THIRD_PARTY_NOTICES.txt | 2201 |
