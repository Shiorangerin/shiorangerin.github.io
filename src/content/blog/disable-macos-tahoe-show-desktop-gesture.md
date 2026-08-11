---
title: 'macOS Tahoe 触控板「显示桌面」手势：如何单独关掉它'
description: 'macOS 26 Tahoe 把四指向外张开（显示桌面）和向里捏合（App Library）打包成了同一个开关。本文记录如何用 defaults write 单独关掉张开手势。'
date: 2026-06-20T14:00:00
tags: ["macOS", "Tahoe", "触控板", "技巧"]
---

> 本博客由 Codex 生成。


## 问题

macOS 26 Tahoe 的 `系统设置 > 触控板 > 更多手势` 里有一项叫**"显示桌面"**，打开后会同时触发两个手势：

| 手势 | 行为 |
|------|------|
| 四指向外张开（spread） | 显示桌面 |
| 四指向里捏合（pinch） | 打开应用菜单（App Expose） |

很多人只想要向里捏合打开应用菜单的功能，却不想让向外张开弹出桌面。然而系统设置里只有一个二元开关——要么全开，要么全关，没有中间选项。

---

## 探索过程

网上已有讨论确认了这一绑定关系。BetterTouchTool 社区和 Reddit 上的用户也反映，macOS 26 在系统层面将这两个手势硬编码绑定，第三方工具（如 BTT、Karabiner-Elements）也无法拦截。

但通过在本机运行 `defaults find ShowDesktop` 与 `defaults find AppExpose`，发现在 `com.apple.dock` 域下存在两个**独立**的配置项：

```
showDesktopGestureEnabled   → 控制"显示桌面"手势（向外张开）
showAppExposeGestureEnabled → 控制"应用菜单"手势（向里捏合）
```

系统设置 UI 做了一层合并开关，但底层 plist 仍然可以分别写入。这是一个 Apple 未文档化的隐藏键，在当前版本中可以放心使用。

---

## 解决方案

在 **终端** 中执行以下命令：

### 关闭"显示桌面"手势（同时保留"应用菜单"）

```bash
defaults write com.apple.dock showDesktopGestureEnabled -bool false
killall Dock
```

执行后：

- 四指向外张开 → **不再**触发显示桌面
- 四指向里捏合 → **依然**打开应用菜单

**无需重启系统。** `killall Dock` 会让 Dock 自动重启并读取新配置，整个过程约 1 秒，桌面窗口不受影响。

### 恢复原状

```bash
defaults write com.apple.dock showDesktopGestureEnabled -bool true
killall Dock
```

---

## 验证

修改后可以通过以下方式确认：

1. **命令行检查**：
   ```bash
   defaults read com.apple.dock | grep showDesktopGestureEnabled
   ```
   应显示 `showDesktopGestureEnabled = 0;`

2. **系统设置查看**：重新打开 `系统设置 > 触控板 > 更多手势`，"显示桌面"开关会变为关闭状态，而"应用菜单"（App Expose）状态不变。

3. **直接测试**：在触控板上试试四指向里捏合和向外张开，确认行为符合预期。

---

## 注意事项

- **系统设置 UI 操作会覆盖此设置**：如果后续又在系统设置里拨动了"显示桌面"开关，两个 key 会被同时更新，届时需要重新执行本命令。
- **未来兼容性**：由于这是未文档化的隐藏配置，Apple 在后续 macOS 更新中可能移除或合并这两个 key。届时本方法可能失效，需要改用其他方式。
- **替代的"显示桌面"方式**：如果你还需要偶尔显示桌面，可以考虑以下方案：
  - 快捷键 `Fn + F11`
  - `系统设置 > 桌面与程序坞 > 触发角`，指定一个屏幕角落为"显示桌面"

