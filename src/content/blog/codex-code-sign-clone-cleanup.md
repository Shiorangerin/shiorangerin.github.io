---
title: "fuckcodex: 一行 alias 干掉 Codex 代码签名克隆目录"
description: "Codex 桌面版的 code_sign_clone 机制会在 /private/var/folders 下堆积大量临时文件。本文解释这些文件从哪来、为什么删掉无害、以及如何用一条 alias 一键清理。"
date: 2026-06-23
tags: ["Codex", "macOS", "Shell", "磁盘清理", "效率"]
---

> 本文由 Codex 生成。

## 背景

如果你用的是 Codex 桌面版（macOS），它有一个叫 code_sign_clone 的机制：当你让 Codex 执行需要代码签名的操作时（比如运行某些编译命令、构建步骤），它会先把相关代码复制到临时目录，在那里完成签名，再把结果返回。

这个临时目录的位置是：

```
/private/var/folders/*/*/X/com.openai.codex.code_sign_clone/
```

问题是——这些克隆副本**不会自动清理**。

用久了之后，目录里可能堆积数十 GB 的项目副本。对于只有 256G / 512G 硬盘的 Mac 用户来说，这很致命。

## alias

```bash
alias fuckcodex='du -sh /private/var/folders/*/*/X/com.openai.codex.code_sign_clone/* 2>/dev/null; rm -rf /private/var/folders/*/*/X/com.openai.codex.code_sign_clone'
```

## 它做了什么

拆成两部分看：

**第一部分：查看磁盘占用**

```bash
du -sh /private/var/folders/*/*/X/com.openai.codex.code_sign_clone/* 2>/dev/null
```

- `du -sh`：以人类可读格式（K/M/G）显示每个子目录的大小
- `2>/dev/null`：目录不存在时不报错，静默跳过

先看一眼到底占了多大空间，心里有数。

**第二部分：清空**

```bash
rm -rf /private/var/folders/*/*/X/com.openai.codex.code_sign_clone
```

- `rm -rf`：递归强制删除整个目录

合在一起就是：**看一眼，然后删光。**

## 为什么删掉无害

这些文件是**临时克隆副本**，不是 Codex 的配置、历史记录、或任何有状态数据。

- 删掉之后，Codex 下次需要代码签名时**会重新生成 clone**
- 不会影响已安装的插件、Skills、会话历史
- 不会影响你的项目源码

唯一的影响是：下次触发签名时可能慢一秒（因为要重新复制），但换来的是几十 GB 的磁盘空间。

## 路径解析

`/private/var/folders/` 是 macOS 用来存放**按用户隔离的临时文件**的地方。

路径模式拆解：

```
/private/var/folders/   ← macOS 临时文件系统根
  */                    ← 每个用户分配一组随机字符的目录
    */                  ← 子分类（T = 临时, C = 缓存, X = 非沙盒临时）
      X/                ← "不安全临时" 目录，非沙盒化进程可用
        com.openai.codex.code_sign_clone/  ← Codex 的签名克隆
```

`X` 目录是 Apple 为**未完全沙盒化的应用**预留的写入区域。Codex 桌面版需要执行任意终端命令，不属于严格沙盒模型，因此它的临时文件就落在这里。

值得注意的是，你还能在 `C/` 下找到另一个 Codex 目录：

```
/private/var/folders/*/*/C/com.openai.codex         ← 约 84K，元数据缓存
/private/var/folders/*/*/C/com.openai.codex.helper  ← 约 5.4M，helper 进程缓存
```

这两个很小，而且有固定用途，**不建议删**。

## 使用建议

把 alias 加入你的 `~/.zshrc`：

```bash
echo "alias fuckcodex='du -sh /private/var/folders/*/*/X/com.openai.codex.code_sign_clone/* 2>/dev/null; rm -rf /private/var/folders/*/*/X/com.openai.codex.code_sign_clone'" >> ~/.zshrc
source ~/.zshrc
```

然后随时在终端里敲 `fuckcodex` 即可。

建议频率：

- **日常轻度使用**：一两周跑一次
- **重度开发 / 频繁构建**：每天跑一次
- **磁盘告警时**：立刻跑

你也可以把它加到 cron 里定时执行，但考虑到 alias 里用了通配符展开，建议直接写完整路径：

```bash
# 每周日 3:00 清理（不推荐直接 crontab alias）
0 3 * * 0 rm -rf /private/var/folders/*/*/X/com.openai.codex.code_sign_clone
```

## 替代方案

如果你不想用这种激进的方式，macOS 自带的存储管理工具也可以手动清理：

- 系统设置 → 通用 → 存储空间 → 开发者
- 或使用 `sudo tmutil listlocalsnapshots /` 查看 APFS 快照占用

但要注意，macOS 存储管理工具**不会自动识别这个目录**，因为它在 `/private/var/folders` 下，属于系统临时区域，对外部扫描工具不透明。

## 小结

一行 alias，两个操作，解决一个长期被忽略的磁盘占用问题。Codex 虽然强大，但它的临时文件管理并不完美。好在我们可以自己动手。

---

_封面图由 ChatGPT 生成。_
