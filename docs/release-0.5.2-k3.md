# 0.5.2-k3

## 修复

本版为所有可选工具参数增加明确的 `null` 类型。MCP 客户端仍可省略可选字段；模型供应商把全部字段设为必填时，调用者可以用 `null` 表示未提供，不必为浏览器调用编造 HWND 或 PID。

执行前会移除这些 null 参数，或使用字段原有的默认值。`set_value` 的 `elementId`、`value` 等必填参数仍拒绝 null；真实浏览器目标与桌面定位混用仍然报错。没有修改 DSH 安装文件或模型供应商适配器。

## 验证

使用进程级 `PSExecutionPolicyPreference=Bypass`、`WINDOWS_CU_POWERSHELL=pwsh.exe` 运行 `npm test`，39 套全部通过。全量测试启动时版本元数据仍为 k2-1，产品代码和回归改动已在临时副本中；更新到 k3 元数据后，另外复跑目标路由与工具发现测试通过。

- 公开 MCP schema：可选字段及枚举接受 null，必填字段保持严格，工具列表与 describe 定义一致。
- 参数路由：最小 `new-tab` 调用、所有可选字段填 null、仅 HWND 的桌面调用、默认值和真实冲突拒绝；禁用浏览器时，有效浏览器请求能到达浏览器分派并返回通道不可用，而非参数冲突。
- 真实浏览器：最小参数与 null 占位均能新建标签页；null 占位的页面树读取和截图通过。

本机安装已由插件管理器应用。实际 DSH 工具定义中，`set_value.required` 仍只有 `elementId` 和 `value`，可选 HWND/PID 明确包含 null。通过本会话的模型工具调用，以 null 填充桌面参数成功新建标签页、读取页面树并截图；填写真实 HWND/PID 的冲突调用仍被拒绝。测试标签页已关闭，工具加载状态已重置。

本次全量原生后端使用 PowerShell 7；稀疏 Canvas 测试沿用既有规则，不运行 PowerShell 5.1 专属的 WinRT OCR 断言。没有将结果表述为双 PowerShell 环境全部验收。
