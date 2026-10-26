# 0.5.2-k2 验证记录

本版基于上游 0.5.2，修复空 `browserTab` 导致桌面调用被误判为浏览器调用的问题。MCP 定位字段原本可选；本版保留扁平 schema，在分派前清理空白字符串，再检查真实目标冲突。没有修改 DSH 或模型供应商的 schema 适配器。

## 通过的检查

- JavaScript 语法检查和 `git diff --check`。
- `test/target-routing.mjs`：公开 MCP schema 的定位字段可选；空字符串和纯空白的 `browserTab`、`windowTitle` 与 HWND/PID 共存；仅 HWND 的截图和 UIA 读取；浏览器禁用不影响桌面路由；非空页面目标与桌面定位、坐标或 UIA ID 冲突时拒绝；数字和 null 的严格类型校验。桌面 worker 为确定性替身，不代替原生验收。
- `test/uia-native-smoke.mjs`：真实 WinForms 专用夹具的截图、UIA 读取，包含空定位字段与 HWND/PID、仅 HWND；保留原有原生读取断言。
- `test/bundle-startup.mjs`：Node 与 Electron Node 模式启动打包插件，返回版本 0.5.2-k2，列出 24 项工具，health、wait、6 项资源通过。此项使用合成 PowerShell worker。
- `test/profile-resolution.mjs` 与 `test/tool-context.mjs`：分叉路径解析、工具选集和 schema 契约通过。
- 浏览器通道、可见模式、重连、登录保留及共享配置生命周期套件通过。

## 全量测试与未通过项

使用进程级环境变量 `PSExecutionPolicyPreference=Bypass`、`WINDOWS_CU_POWERSHELL=pwsh.exe` 运行 `npm test`，未修改系统执行策略。39 套中 34 套通过，5 套失败：

- 设置页、Chromium UIA、延迟 Chromium UIA、稀疏 Canvas 四套 Electron GUI 夹具在启动阶段以 `2147483651` 退出，与 k1 记录一致。设置页单独复跑仍失败；启动原因未定位，不能据此声称这些界面已验收。
- takeover-native 首轮报 `Overlay must not activate`，实际前台窗口与预期不一致。单独复跑整套通过，包含 `noFocusSteal: true`；保留首轮失败记录，不把全量结果改写为全部通过。

本次未更改设置页、浏览器界面或系统权限配置。
