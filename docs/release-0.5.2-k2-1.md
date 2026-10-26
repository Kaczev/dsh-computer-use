# 0.5.2-k2-1

本版只维护测试环境与焦点回归，不新增产品功能补丁。产品运行源码与 0.5.2-k2 相同。

## 变更

- Electron GUI 测试将已安装的同版本运行时复制到独立临时目录，避免继承仓库 ACL 和完整性标签。启动前执行版本预检，保留默认 Chromium 沙箱，不修改系统权限；进程结束时清理临时运行时。
- 焦点测试用 WinEvent 监听前台事件，并读取实际前台 HWND 确认进程归属。其他应用切窗不再触发“提示层抢焦点”误报；接管助手实际获得前台仍会失败。监听结果保留在测试产物中。
- 本机上游克隆路径记录在被 Git 忽略的 agent 提示文件中，不随 GitHub 或 npm 分发。

## 验证

在 Windows 上使用进程级 `PSExecutionPolicyPreference=Bypass`、`WINDOWS_CU_POWERSHELL=pwsh.exe` 运行 `npm test`，39 套全部通过。原先失败的四项 Electron GUI 测试及原生接管测试均通过，没有跳过测试或降低功能断言。

最终版本另外复跑设置页与原生接管测试通过，确认临时 Electron 自动清理。JavaScript 语法检查、`git diff --check` 和 npm 打包清单检查通过；本机 agent 提示与测试代码不包含在 npm 包中。

本次全量原生后端使用 PowerShell 7；稀疏 Canvas 套件在此模式下按原有规则不运行 PowerShell 5.1 专属的 WinRT OCR 断言。没有将本次结果表述为双 PowerShell 环境全部验收。
