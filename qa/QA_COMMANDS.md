# 可复现命令序列（Lexmount browser-cli 1.2.4 / Windows PowerShell）

`$S` 为会话 ID。完整巡检约 20 条命令，全程只读线上站点，不修改任何远端数据。

```powershell
$cli = "<skill-root>\bin\browser-cli.exe"
$base = "https://hatsunemiku2118.github.io/HatsuneMiku2118"

# 0. 就绪检查
& $cli doctor                      # 要求 ready_for_browser_actions: true

# 1. 建会话（1280x720，自动录屏）
& $cli session create --window-size 1280,720
$S = "<返回的 session_id>"

# 2. 打开游戏，等标题页
& $cli action open-url    --session-id $S --url $base
& $cli action wait-selector --session-id $S --selector '#titleScreen.on'

# 3. 注入错误钩子（资源失败 + JS 错误），截标题图
& $cli action eval --session-id $S --expression "window.__ERRS=[];window.addEventListener('error',e=>{const t=e.target;t!==window&&t.src?__ERRS.push(String(t.src)):__ERRS.push(String(e.message))},true);'hooks installed'"
& $cli action screenshot --session-id $S --path evidence\01_title.png

# 4. 开始游戏：点开始 → 过章节卡 → 检查 BGM 真实播放
& $cli action click --session-id $S --selector '#btnStart'
& $cli action wait-selector --session-id $S --selector '#chapterCard.on'
& $cli action click --session-id $S --selector '#stage'
& $cli action eval --session-id $S --expression "JSON.stringify({bgm:BGM.state, voiceCount:VOICE.count, errs:window.__ERRS.length})"
#   预期: bgm={key:"calm",paused:false,volume:0.55}，随后 currentTime 持续递增

# 5. 推进到配音句，验证 wav 加载与渲染
1..7 | %{ & $cli action click --session-id $S --selector '#stage'; sleep -m 700 }
& $cli action eval --session-id $S --expression "performance.getEntriesByType('resource').filter(r=>/\.wav/.test(r.name)).map(r=>r.name.split('/').pop()).join(',')"
& $cli action screenshot --session-id $S --path evidence\02_dialogue.png

# 6. 烟花场景选择支（引擎调试参数直达 step 15 = choice）
& $cli action open-url --session-id $S --url "$base/?scene=c4_fireworks&i=15"
& $cli action wait-selector --session-id $S --selector '#choices.on'
& $cli action eval --session-id $S --expression "JSON.stringify([...document.querySelectorAll('#choices button')].map(b=>b.textContent.slice(0,14)))"
& $cli action screenshot --session-id $S --path evidence\03_choice.png

# 7. 选第一个选项 → 真实推进 11 步 → END 01
& $cli action click --session-id $S --selector '#choices button:nth-child(1)'
1..17 | %{ & $cli action click --session-id $S --selector '#stage'; sleep -m 450 }
& $cli action eval --session-id $S --expression "JSON.stringify({endingOn:document.getElementById('endingScreen').classList.contains('on'), endTitle:document.getElementById('endTitle').textContent, errs:window.__ERRS})"
& $cli action screenshot --session-id $S --path evidence\04_ending_blue.png

# 8. 另两个结局（回放直达 ending 步进）
& $cli action open-url --session-id $S --url "$base/?scene=c4_wait&i=15"
& $cli action wait-selector --session-id $S --selector '#endingScreen.on'
& $cli action screenshot --session-id $S --path evidence\05_ending_summer.png
& $cli action open-url --session-id $S --url "$base/?scene=c4_foam&i=20"
& $cli action wait-selector --session-id $S --selector '#endingScreen.on'
& $cli action screenshot --session-id $S --path evidence\06_ending_foam.png

# 9. 版式检查：split（左立绘右面板）与 wave（无立绘声音演出）
& $cli action open-url --session-id $S --url "$base/?scene=c2_roof&i=14"
& $cli action eval --session-id $S --expression "JSON.stringify({ui:document.getElementById('stage').dataset.ui, charLeft:Math.round(document.getElementById('charL').getBoundingClientRect().left)})"
& $cli action screenshot --session-id $S --path evidence\07_split_roof.png
& $cli action open-url --session-id $S --url "$base/?scene=c1_road&i=6"
& $cli action eval --session-id $S --expression "document.getElementById('stage').dataset.ui"
& $cli action screenshot --session-id $S --path evidence\08_wave_road.png

# 10. 缺陷复现：真实推进 5 句后开记录面板
& $cli action open-url --session-id $S --url "$base/?scene=c1_room&i=0"
1..5 | %{ & $cli action click --session-id $S --selector '#stage'; sleep -m 500 }
& $cli action click --session-id $S --selector '#btnLog'
& $cli action eval --session-id $S --expression "document.querySelectorAll('#logBody > p').length"
#   修复前: 1（只有台词）  修复后: 5（旁白入记录）

# 11. 修复复验必须绕过 Pages 缓存
& $cli action raw --session-id $S --method Page.reload --params-json '{\"ignoreCache\":true}'
#   重复第 10 步 → 5 条

# 12. 收尾：错误汇总 + 关闭会话（触发录屏归档）
& $cli action eval --session-id $S --expression "JSON.stringify(window.__ERRS)"
& $cli session close --session-id $S
```

本地侧配合命令（不属于云端任务，但报告中引用）：

```powershell
# 静态可达性抽查
curl.exe -s -o NUL -w "%{http_code}" <url>/assets/bgm/calm.mp3   # 200
# 修复部署
git commit -m "Fix log: include narration lines" ; git push      # Pages 自动重新部署
```
