# 项目导航

此仓库是 Windows Computer Use 插件的补丁分叉。以下只列本次检查过的入口。

- [README](README.md)：原作者归属及分叉补丁范围。
- [发布配置](package.json)：包版本、导出文件与测试命令。
- [更新记录](CHANGELOG.md)：发布历史。
- [MCP 服务](mcp/server.mjs)：工具 schema、参数校验和请求分派。
- [浏览器通道](mcp/browser.mjs)：目标归一化、冲突检查与 CDP 路由。
- [测试入口](test/run-tests.mjs)：Windows 隔离测试套件。
- [目标路由回归](test/target-routing.mjs)：空定位字段、可选 schema、真实冲突与禁用浏览器场景。
- [原生 UIA 回归](test/uia-native-smoke.mjs)：专用 WinForms 夹具上的读取与截图。
- [k2 验证说明](docs/release-0.5.2-k2.md)：本版验证结果和已知限制。
