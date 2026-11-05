# 《放課後ソーダ》云端巡检 QA 报告

- **任务**：用 Lexmount 云平台（Cloud Browser）对一个真实上线的视觉小说网页项目做发布前巡检，发现问题、修复并复验。
- **巡检对象**：https://hatsunemiku2118.github.io/HatsuneMiku2118/ （GitHub Pages，main 分支根目录）
- **源码仓库**：https://github.com/HatsuneMiku2118/HatsuneMiku2118
- **工具**：Lexmount browser-cli 1.2.4（Cloud Browser，beijing-1 区，1280×720 视口）
- **日期**：2026-11-05
- **结论**：12 项检查 11 项通过；发现 1 个可复现的功能缺陷（记录面板不收旁白），已修复、重新部署并在云端复验通过。

## 一、接入过程

1. 按官方安装提示词下载 Skill ZIP（v1.2.4）与 SHA256SUMS，校验一致：
   `9a491dab…c92b24fe  lexmount-browser-v1.2.4-skillhub.zip`
2. `bootstrap.ps1` 从官方 COS 源安装 `browser-cli.exe`，本地哈希与 GitHub 官方 SHA256SUMS 交叉核对一致：
   `04f36d7b…13a5947d  browser-cli-v1.2.4-x86_64-pc-windows-msvc.exe`
3. `auth login` 浏览器授权，`doctor` 返回 `ready_for_browser_actions: true`。
4. 全程凭据仅存于本机 `~/.config/lexmount/browser-cli/`，未出现在任何输出与材料中。

## 二、巡检矩阵

| # | 检查项 | 方法 | 结果 | 证据 |
| --- | --- | --- | --- | --- |
| 1 | 页面加载与标题 | open-url + wait-selector `#titleScreen.on` | PASS | 01_title.png |
| 2 | BGM 真实播放 | eval `BGM.state`：`{key:"calm", paused:false, volume:0.55}`，currentTime 0→11.96→22.45s 递增 | PASS | 会话记录 |
| 3 | 首句配音加载 | 推进至 `c1_room_12`，resource timing 出现 `c1_room_12.wav` | PASS | 会话记录 |
| 4 | 对话/立绘渲染 | 截图核对卧室背景、立绘居中、对话框 | PASS | 02_dialogue.png |
| 5 | 三选一选择支 | `?scene=c4_fireworks&i=15` 直达，三个选项文本齐全 | PASS | 03_choice.png |
| 6 | END 01 青いソーダ | 点击选项 1，真实推进 11 步至结局 | PASS | 04_ending_blue.png |
| 7 | END 02 夏のつづき | `?scene=c4_wait&i=15` 回放直达 | PASS | 05_ending_summer.png |
| 8 | END 03 ソーダの泡 | `?scene=c4_foam&i=20` 回放直达 | PASS | 06_ending_foam.png |
| 9 | split 版式（1280 宽） | `?scene=c2_roof&i=14`：`data-ui=split`，立绘 left=26px，文字面板右列 | PASS | 07_split_roof.png |
| 10 | wave 版式 | `?scene=c1_road&i=6`：`data-ui=wave` | PASS | 08_wave_road.png |
| 11 | 设置面板与署名 | 打开面板，版权区含 `VOICEVOX:四国めたん` | PASS | 10_settings.png |
| 12 | 记录面板 | 真实推进 5 句后打开 | **FAIL→修复→PASS** | 09_log_panel.png / 09_log_panel_fixed.png |

全程通过注入的 `window.addEventListener('error', …, true)` 收集资源加载失败与 JS 错误，** errs=0**。

## 三、发现的缺陷（可复现）

**缺陷**：记录面板只收录角色台词，旁白（narr）不进记录。开场连续旁白时面板显示「还没有台词」，与 README 中「回看已读文本」的承诺不符。

**复现步骤**（云端浏览器）：
1. 打开 `?scene=c1_room&i=0`；
2. 点击 5 次推进（经过 4 条旁白 + 1 条台词）；
3. 点击「记录」→ 面板只有 1 条（陽太……再五分钟。）。

**根因**：`js/engine.js` `showLine()` 中 `if (ch || st.c)` 把无说话人的 narr 排除在 HIST 之外。

**修复**：去掉该条件，narr 同样入 HIST（无名条目不带说话人名牌）。
commit `80f8895` — "Fix log: include narration lines (found by cloud browser QA inspection)"

**复验**：推送后 GitHub Pages 自动重新部署；云端浏览器 `Page.reload(ignoreCache:true)` 后重复上述步骤，记录变为 5 条且顺序正确（见 09_log_panel_fixed.png）。

## 四、附加发现（巡检方法层面的坑）

1. **GitHub Pages 静态资源有缓存**：推送修复后直接 open-url 仍会命中旧 engine.js，复验必须 `Page.reload` 带 `ignoreCache:true`，否则会误判「修复无效」。
2. **快速连点时 wav 可能不进 resource timing**：语音元素在 fetch 完成前被 `pause()`，Performance API 不记录该条目。判断配音是否接线应以「放慢点击 + manifest + 逐 id 请求」为准，而非只看 resource timing。
3. **`<audio>` 的 mp3 请求不出现在 `performance.getEntriesByType('resource')`**（媒体类请求的归类差异），但 `BGM.state.currentTime` 递增是比资源清单更强的「真实出声」证据。

## 五、本地与云端分工

- **云端（Lexmount Cloud Browser）**：所有真实网页操作——打开线上站点、点击推进、触发选择支与结局、渲染截图、eval 采集运行时状态（BGM/VOICE/DOM 几何/错误钩子）、绕过缓存复验。
- **本地**：静态资源可达性抽查（curl）、缺陷根因定位与代码修复、git 提交推送、本报告与证据整理。

## 六、可复跑脚本版（Node + lexmount SDK）

巡检流程已固化为脚本 `qa/inspector/inspect.mjs`：通过 lexmount SDK 创建云端会话、Playwright `connectOverCDP` 接管，8 项检查全自动执行（含把本次修复的「记录不收旁白」做成回归测试 T8），退出码可接 CI。

- 复跑方式：`npm install && node inspect.mjs`（凭证读本地凭据文件或环境变量，不进代码）
- 最近一次运行：**8/8 PASS，47.6s**，结果与截图见 `qa/inspector/out/`
- 脚本在开发中还捕获到一个环境级事实：不同云端区域到 GitHub Pages 的带宽有波动（一次会话 T3 因 mp3 缓冲不足而失败），脚本以 10s 轮询兜底——这正是「实际运行」才会暴露的问题。

## 七、材料清单

- 游戏线上地址与源码仓库（见文首）
- 本报告：`qa/QA_REPORT.md`
- 可复现命令序列：`qa/QA_COMMANDS.md`
- 可复跑巡检脚本与最近运行结果：`qa/inspector/`（`inspect.mjs` + `out/RESULTS.md` + 截图）
- 证据截图 11 张：`qa/evidence/`
- 云端会话（含全程录屏）：session_4f946658-0b78-4300-ae94-a96d476662a4（回看需 Lexmount 账号）
