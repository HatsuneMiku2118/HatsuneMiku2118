# 自动巡检结果

- 目标：https://hatsunemiku2118.github.io/HatsuneMiku2118
- 云端会话：session_200f9cb9-f48a-4363-a70a-f3554903af6b（nanjing-1）
- 时间：2026-11-05T04:50:41.164Z　用时：47.6s
- 结论：**8/8 PASS**

| 检查项 | 结果 | 详情 |
| --- | --- | --- |
| T1 标题页加载 | PASS | titleScreen.on 就绪 |
| T3 BGM 播放（calm） | PASS | calm 0.6s → 1.6s, vol=0.55 |
| T4 配音 wav 加载 | PASS | c1_room_12.wav |
| T5 烟花三选一 | PASS | 3 个选项 |
| T6 结局可达 ×3 | PASS | END 01, END 02, END 03 |
| T7 split/wave 版式 | PASS | split(charL=26) + wave |
| T8 记录含旁白（回归） | PASS | 5 条 |
| T9 零资源/JS 错误 | PASS | 0 错误 |

截图见本目录 `s*.png`。复跑：`node inspect.mjs`（需 Lexmount 凭证，见脚本头注释）。
