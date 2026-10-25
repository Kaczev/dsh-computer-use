# 0.5.2-k1

本版基于 [Yu-tao-Li/dsh-computer-use-win 0.5.2](https://github.com/Yu-tao-Li/dsh-computer-use-win/commit/e4482b8)，保留 Kaczev 分叉的空 `elementId` 修复。包名仍为 `@kaczev/dsh-computer-use`，版本统一为 `0.5.2-k1`。npm 安装请指定 `@kaczev/dsh-computer-use@0.5.2-k1`。

## 上游更新

- 新增 Chrome / Edge 浏览器通道，通过 CDP 操作网页，支持后台标签页、表单、导航、上传、下载与对话框；默认使用隔离配置，可选择保留登录。
- 桌面操作优先使用后台控件接口；必须使用真实输入时，临时借用前台，完成后尽可能归还前台和鼠标。只读和后台操作不再显示接管提示。
- 修复 Chromium / Electron 首次读取不到网页控件和默认树深度不足的问题。
- 修复旧设置值导致整个插件无法加载、安静调用误报停止监听器不可用、浏览器多会话生命周期等问题，并重排设置页。

## 为什么仍需补丁

上游 `Get-PointFromArgs` 和 `element_info` 仍以 `$null -ne $elementId` 判断是否解析元素。模型或 schema 适配器传入空字符串时，上游会尝试解析空 ID，无法使用同时提供的坐标。

本版继续使用 `[string]::IsNullOrWhiteSpace`：省略、null、空字符串或纯空白 ID 都走坐标分支；非空 ID 仍优先，过期或无效 ID 仍报错，不会退回坐标。点击、双击、移动和滚动共用参数分派函数，元素检查保留对应修复。浏览器通道沿用上游实现。

分叉包名、Cordis 条目中的包名与客户端注册 ID 保持一致；MCP 服务名仍为 `wincu`，不新增第二个服务。本版不修改 DSH 的模型／供应商 schema 适配逻辑。

## 验证结果

- JavaScript 语法检查、分叉包路径解析、Node / Electron Node 模式下的打包启动检查通过；`npm pack` 已生成安装包。
- 使用进程级 `PSExecutionPolicyPreference=Bypass` 和 `WINDOWS_CU_POWERSHELL=pwsh.exe` 运行 38 套测试，33 套通过。没有修改系统执行策略。
- 空 ID 回归通过，覆盖省略、null、空字符串、纯空白、零／负坐标、缺失坐标、非空 ID 优先和过期 ID 不回退。原生 WinForms、MCP 往返、浏览器 78 步操作、登录保留和重连等测试通过。
- 4 套 Electron GUI 相关测试在启动阶段以 `2147483651` 退出：设置页、Chromium UIA、延迟 UIA、稀疏 Canvas。尚未定位原因，不能据此宣称界面验收通过。
- 浏览器生命周期测试中 21/22 子项通过；Chrome 共享会话心跳文件原子重命名出现 `EPERM`，两轮运行在不同子项出现。该浏览器实现沿用上游，本版未扩展修复；不能宣称全量测试通过。

## 安装

从 npm 安装：

```powershell
dsh plugin --profile desktop add @kaczev/dsh-computer-use@0.5.2-k1
```

也可下载 `kaczev-dsh-computer-use-0.5.2-k1.tgz`，在安装包所在目录运行：

```powershell
dsh plugin --profile desktop add ./kaczev-dsh-computer-use-0.5.2-k1.tgz
```

通过插件管理器安装也可。替换同名分叉包，不要同时启用上游和本版的 `wincu`。Host 模块替换后可能需要完全退出并重新启动 DSH。原 MIT 版权与来源声明保持不变。
