# 可复跑自动巡检（Node + lexmount SDK + Playwright CDP）

一条命令在 Lexmount 云端浏览器里完整跑一遍发布巡检，8 项检查，退出码可接 CI。

```powershell
npm install                       # 需设 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1（经 CDP 连云端，无需本地浏览器）
node inspect.mjs                  # 默认巡检 https://hatsunemiku2118.github.io/HatsuneMiku2118
node inspect.mjs --base <url> --out <dir>
```

- 凭证自动读取 `browser-cli auth login` 保存的本地凭据文件，或用 `LEXMOUNT_API_KEY` / `LEXMOUNT_PROJECT_ID` 环境变量。密钥不进代码、不进输出。
- 检查项：标题加载 / BGM 真实播放（currentTime 递增）/ 配音 wav 加载 / 三选一 / 三结局可达 / split+wave 版式几何 / 记录面板含旁白（回归测试）/ 全程零错误。
- 输出：控制台逐条 PASS/FAIL、`out/results.json`、`out/RESULTS.md`、`out/s*.png` 截图。
- 已知波动：云端区域到 GitHub Pages 带宽不稳定时 T3 可能缓冲超时，脚本已轮询 10s 兜底。

最近一次运行：8/8 PASS，47.6s（见 `out/RESULTS.md`，含云端会话 ID 可回看录屏）。
