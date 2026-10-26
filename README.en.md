# dsh-computer-use · 0.5.2-k3

The original plugin was created by **Yu-tao-Li**: [Yu-tao-Li/dsh-computer-use-win](https://github.com/Yu-tao-Li/dsh-computer-use-win). This fork is based on upstream 0.5.2. Its main features, architecture and interface belong to the original author and contributors. We only maintain a few patches for problems encountered in use.

Fork package: `@kaczev/dsh-computer-use`.

## Our patches

### 0.5.2-k3

Every optional tool argument explicitly accepts `null`. At execution, null uses the default when one exists and otherwise removes the argument. MCP callers can still omit optional fields. When a model provider requires every field, browser calls can use null for HWND, PID, window title and coordinates instead of inventing desktop targets.

Opening a tab still needs only `{"elementId":"new-tab","value":"https://example.com"}`. Real browser/desktop target conflicts remain invalid. Required arguments reject null; numeric limits, types and unknown-field checks remain strict. Regressions cover discovery, new browser tabs, screenshots, UIA and desktop routing.

### 0.5.2-k2-1

Test maintenance only: Electron GUI suites use a temporary runtime copy with default sandboxing, and focus regressions observe actual foreground ownership by the takeover helper. No new product patches; runtime logic is unchanged from 0.5.2-k2.

### 0.5.2-k2

- **Fix empty target placeholders.** Empty or whitespace-only `browserTab` no longer selects the browser lane. Empty `windowTitle` is also removed. Desktop calls can retain these placeholders alongside HWND/PID and do not require a browser connection.
- **Keep real target conflicts invalid.** A nonempty tab ID or page element ID cannot be combined with desktop locators or screen coordinates. Errors list the conflicting field names and values. Browser targets combined with nonempty UIA element IDs are also rejected.
- **Clarify the parameter contract and add regressions.** Target locators were already optional in the exported MCP schema. The description now says to omit `browserTab` for desktop calls and documents empty placeholders. Tests cover blank fields, HWND/PID, HWND alone, desktop reads with the browser lane disabled, page-ID conflicts, and screenshot/UIA reads against a real WinForms fixture.

This patch does not change DSH or provider-side adapters that may turn optional properties into required ones. It keeps the flat MCP parameter schema for client compatibility and enforces target exclusivity at runtime rather than adding `oneOf` branches.

### Retained k1 patches

- Empty `elementId` uses the supplied coordinates. Nonempty IDs still take precedence; invalid or stale IDs never silently fall back to coordinates.
- Use a separate fork package name and matching client registration ID. The MCP service remains `wincu`.

The original MIT copyright and license notices remain intact.
