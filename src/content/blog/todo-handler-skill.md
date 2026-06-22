---
title: "TODO-Handler-Skill: 给 Codex CLI 装上长期待办清单"
description: "一套文件驱动的 TODO 管理规范，让 AI 助手跨越会话边界，在本地磁盘维护你的个人待办清单。支持查询、添加、标记完成、编辑删除与同步导出。"
date: 2026-06-22
tags: ["Codex", "Skill", "TODO", "效率", "自动化"]
---

> 本博文由 Codex 生成。

## 背景

Codex CLI 内置了对话级 `todo_list` 工具，但每次会话结束就消失。没有一个"打开同一个文件、按日期分类、可长期累积"的待办清单。

TODO-Handler-Skill 就是解决这个问题的。它是一份操作规范，告诉 AI 助手如何在本地 `~/Documents/TODO.md` 文件上执行全部 TODO 操作——查询、添加、勾选、编辑、删除、跨目录同步。

## 设计原则

- **文件驱动** 所有 TODO 存在本地 Markdown 文件，不依赖任何数据库或云服务。
- **永不覆盖** 新增条目始终追加，不破坏已有内容。
- **显式勾选** `- [ ]` 未完成、`- [x]` 已完成、`- [?]` 状态未知，一目了然。
- **去重合并** 同步功能会对比任务正文，避免重复插入。
- **macOS 原生** 所有命令适配 BSD sed / BSD date / Zsh 环境。

## 技能规范全文

以下为完整的 `SKILL.md` 源文件：

````markdown
---
name: todo-handler
description: 处理用户 TODO/Todo 相关查询与操作的强制流程。触发关键词："今天有什么工作"、"TODO"、"待办"、"我要做什么"、"今天有什么事"、以及"加一条 TODO""完成 XX""导出到桌面""同步到桌面"等写入类请求；或任何对桌面 TODO.md 的查询请求。
---

# TODO 处理规范

## 两种 TODO 系统的区分

本 skill 管理的是 **文件 TODO**（磁盘上的 `TODO.md`），与内置的 **线程 TODO**（`todo_list` / `todo_write` GUI 工具）是两套独立的系统，**互不干扰**：

| 系统 | 存储位置 | 用途 | 命令 |
|------|----------|------|------|
| **文件 TODO** | `TODO.md` 文件（磁盘持久） | 用户的个人长期待办清单 | 本 skill 的流程 A~E |
| **线程 TODO** | 内存/会话级别 | 当前 AI 对话的任务跟踪 | `todo_list` / `todo_write` |

**禁止混淆**：
- 收到用户 TODO 相关请求时，不要用内置 `todo_list`/`todo_write` 去替代操作 `TODO.md` 文件
- 也不要反过来把 `todo_list` 的线程内容写入文件（除非用户明确要求"同步到 TODO.md"）
- 用户说「看看我的 TODO」「加一条待办」→ 走本 skill 操作 `TODO.md`
- 用户说「当前任务进度」「这个步骤完成了」→ 使用内置 `todo_list`/`todo_write`

---

## 触发条件

用户发出以下任一类请求时**必须**触发本 skill：

**查询类**
- "今天有什么工作/任务/作业"
- "看看我的 TODO"
- "我该做什么"
- 任何涉及 `TODO.md` 的查询

**操作类**
- "添加 TODO""加个待办""把 XX 加进 TODO""创建 TODO"
- "完成 XX""勾掉 XX""XX 完成了""标记 XX"
- "改一下 XX""删除 XX""移走 XX"
- "导出到桌面""同步到桌面""备份到桌面""推到桌面"

**绝对不要**依赖记忆/上下文推断 TODO 内容，每次都重新读文件。

---

## 标准文件结构

**位置**：`工作区中的 TODO.md`（当前工作区为 `~/Documents/TODO.md`，可在 `TODO_FILE_PATH` 变量中配置）

**顶部元信息**（每次写操作后必须更新日期）：
```
# TODO List
> 最后更新：YYYY-MM-DD
```

**章节约定**（`## ` 标题划分）：
- `## 日常` —— 例行事项
- `## 学业 / 课程` —— 课业
- `## 长期备忘` —— 无明确截止
- 其它自定义分类（如 `## 随手`）原样保留

**行格式**：
```
- [ ] 任务名 — 截止日期       ← 未完成
- [x] 任务名 — 截止日期       ← 已完成
- [?] 任务名                  ← 状态未知，视为未完成
- [ ] 子任务说明（缩进 2/4 空格）   ← 仅作注释，无勾选
```

---

## 强制执行流程

### 流程 A：查询 / 阅读

#### A1. 确认 TODO 文件位置

```bash
# 默认路径（macOS）
TODO_FILE="$HOME/Documents/TODO.md"

# 若桌面也有 TODO.md，一并读取
if [ -f "$HOME/Desktop/TODO.md" ]; then
  DESKTOP_TODO="$HOME/Desktop/TODO.md"
fi

# 没有则报错
if [ ! -f "$TODO_FILE" ]; then
  echo "未找到 TODO.md，请先创建：touch \"$TODO_FILE\""
  exit 1
fi
```

#### A2. 搜索 TODO 文件（替代 fd）

```bash
# macOS 上用 find 替代 fd
find "$HOME/Documents" -maxdepth 2 -name "TODO.md" -o -name "todo.md" 2>/dev/null

# 若安装了 fd（可选），也可用：
# which fd 2>/dev/null && fd -e md -e txt "TODO|todo" "$HOME" || echo "fd 未安装，已用 find 替代"
```

若找到多个文件，**全部读取**；若只找到一个，读取该文件。

#### A3. 解析勾选状态（核心）

逐行扫描每一项：

| 标记 | 含义 | 处理方式 |
|------|------|----------|
| `- [x]` | 已完成 | **绝对不要**列入待办列表 |
| `- [ ]` | 未完成 | 列入对应类别 |
| `- [?]` 或无勾选框 | 视为未完成 | 列入对应类别 |

**红线**：把任何 `- [x]` 项当作待办呈现 = 严重错误。

#### A4. 按时间紧迫度分类呈现

1. **今天必做** —— 明确出现今天日期
2. **本周内** —— 截止 7 天内
3. **下周 / 较近** —— 截止 8-30 天
4. **长期备忘** —— 无明确截止或 >30 天

每项附上截止日期。

#### A5. 输出格式

- 直接列出，**不写前言/寒暄/评价**
- 分类用二级标题或粗体
- 已完成项**只在用户明确问起时**才展示

---

### 流程 B：创建 / 添加 TODO

#### B1. 定位文件

优先复用 A2 的搜索结果；若 `TODO.md` 不存在，**先创建骨架**：

```bash
TODO_FILE="$HOME/Documents/TODO.md"

if [ ! -f "$TODO_FILE" ]; then
  cat > "$TODO_FILE" << EOF
# TODO List
> 最后更新：$(date '+%Y-%m-%d')

---

## 日常

- [ ]

---

## 学业 / 课程

- [ ]

---

## 长期备忘

- [ ]
EOF
  echo "已创建 $TODO_FILE"
fi
```

#### B2. 解析用户输入

从用户消息里提取三要素：
- **任务名**（必填）
- **截止日期**（可选）："今天""明天""下周三""6 月 15 日""无截止" 等
- **分类归属**（可选）：日常 / 学业 / 随手 / 长期备忘 / 用户自定义

未指定的字段：**先口头确认再写入**，绝不要凭空脑补。

日期规范化（macOS BSD date）：
- "今天" → `date '+%m-%d'`
- "明天" → `date -v+1d '+%m-%d'`
- "后天" → `date -v+2d '+%m-%d'`
- "X 月 X 日" / "X/X" → 补齐为 `MM-dd`（跨年加年份前缀）
- 无截止 → 归入"长期备忘"或加 `(无截止)` 标记

#### B3. 写入文件（追加，绝不覆盖）

```bash
TODO_FILE="$HOME/Documents/TODO.md"
TASK_NAME="$1"        # 任务名
DUE_DATE="$2"         # 截止日期（可选）
CATEGORY="$3"         # 分类标题（可选，默认"日常"）

# 默认值
CATEGORY="${CATEGORY:-日常}"
LINE="- [ ] $TASK_NAME${DUE_DATE:+ — $DUE_DATE}"

# 找到目标分类标题的行号（BSD grep）
CAT_LINE=$(grep -n "^## $CATEGORY$" "$TODO_FILE" | head -1 | cut -d: -f1)

if [ -n "$CAT_LINE" ]; then
  # 在该分类下的最后一个任务行后插入
  TAIL_LINE=$(tail -n +$((CAT_LINE + 1)) "$TODO_FILE" | \
    grep -n -m1 "^## " | head -1 | cut -d: -f1)
  
  if [ -n "$TAIL_LINE" ]; then
    INSERT_AT=$((CAT_LINE + TAIL_LINE - 1))
  else
    INSERT_AT=$(wc -l < "$TODO_FILE")
  fi
  
  # 用 sed 插入（BSD sed 兼容）
  sed -i '' "$INSERT_AT a\\
$LINE
" "$TODO_FILE"
else
  # 找不到分类，追加到文件末尾
  echo "$LINE" >> "$TODO_FILE"
  echo "未找到「$CATEGORY」分类，已追加到末尾，请手动整理。"
fi
```

**简化兜底**：如果不确定插入位置，**直接追加到文件末尾**，告知用户手动整理。

#### B4. 更新"最后更新"日期

```bash
TODO_FILE="$HOME/Documents/TODO.md"
TODAY=$(date '+%Y-%m-%d')
sed -i '' "s/^> 最后更新：.*/> 最后更新：$TODAY/" "$TODO_FILE"
```

#### B5. 回执

**一句话**告知：已添加哪一条、归到哪个分类。不输出完整文件。

---

### 流程 C：标记完成 / 勾选

#### C1. 定位行

用 `grep -n` 模糊匹配任务关键词；命中多条时**列出候选让用户确认**。

```bash
TODO_FILE="$HOME/Documents/TODO.md"
PATTERN="$1"   # 搜索关键词

grep -n "^\- \[ \]" "$TODO_FILE" | grep -i "$PATTERN"
# 输出示例：15: - [ ] 写周报 — 6-15
```

#### C2. 替换勾选

```bash
TODO_FILE="$HOME/Documents/TODO.md"
PATTERN="$1"

# BSD sed：将匹配行的 `- [ ]` 替换为 `- [x]`
sed -i '' "/$PATTERN/ s/^- \[ \]/- [x]/" "$TODO_FILE"
```

#### C3. 更新"最后更新"日期（同 B4）

```bash
TODAY=$(date '+%Y-%m-%d')
sed -i '' "s/^> 最后更新：.*/> 最后更新：$TODAY/" "$TODO_FILE"
```

---

### 流程 D：编辑 / 删除

#### D1. 删除

```bash
TODO_FILE="$HOME/Documents/TODO.md"
PATTERN="$1"

# 用 grep -v 反向过滤掉匹配行，写回临时文件后替换
grep -v "$PATTERN" "$TODO_FILE" > "${TODO_FILE}.tmp" && mv "${TODO_FILE}.tmp" "$TODO_FILE"
```

#### D2. 编辑

定位行 → 整行替换 → 写回。**不要做局部字符串替换**以免破坏 Markdown 结构。

```bash
TODO_FILE="$HOME/Documents/TODO.md"
LINE_NUM="$1"
NEW_LINE="$2"

sed -i '' "${LINE_NUM}s/.*/$NEW_LINE/" "$TODO_FILE"
```

#### D3. 更新日期（同 B4）

---

### 流程 E：导出 / 同步到桌面

**触发场景**：
- 当前在项目子目录（如 `项目A/子任务/`），该目录里有 `TODO.md`，要推送到桌面主文件
- 用户要求"导出桌面""同步桌面""备份到桌面"
- 工作目录下临时 TODO 要落到桌面

#### E1. 判定方向

| 来源 | 目标 | 操作 |
|------|------|------|
| 项目子目录 `TODO.md` | 桌面 `~/Documents/TODO.md` | **合并追加**（不覆盖） |
| 桌面 `~/Documents/TODO.md` | 项目子目录 | 复制（**先确认**） |
| 内存草稿 / 单条 TODO | 桌面 | 走流程 B 追加 |

#### E2. 合并追加（最常用）

```bash
SRC="$1"                         # 来源文件
DST="$HOME/Documents/TODO.md"    # 目标文件（macOS）
TODAY=$(date '+%Y-%m-%d')

# 1. 抽取源文件的勾选项
SRC_ITEMS=$(grep "^- " "$SRC" 2>/dev/null)

# 2. 抽取桌面文件已有的"任务正文"（去掉勾选标记）
DST_BODIES=$(grep "^- " "$DST" 2>/dev/null | sed 's/^- \[[ x?]\] //')

# 3. 找出未在桌面出现的项
while IFS= read -r item; do
  BODY=$(echo "$item" | sed 's/^- \[[ x?]\] //')
  if ! echo "$DST_BODIES" | grep -Fxq "$BODY"; then
    echo "$item" >> "$DST"
    COUNT=$((COUNT + 1))
  fi
done <<< "$SRC_ITEMS"

# 4. 更新"最后更新"
sed -i '' "s/^> 最后更新：.*/> 最后更新：$TODAY/" "$DST"

echo "已同步 ${COUNT:-0} 条到 $DST"
```

#### E3. 仅复制（覆盖）

```bash
cp "$SRC" "$DST"
```

**仅在用户明确说"覆盖"时**才用（不带确认）。

#### E4. 回执

告知用户：已同步 N 条到 `~/Documents/TODO.md`，日期已更新为 YYYY-MM-DD。

---

## 文件路径

- **标准位置（macOS）**：`~/Documents/TODO.md`
- **备选位置**：`~/Desktop/TODO.md`（若有，一并读取）
- **子目录**：`项目目录/xxx.md` 等按 `find` 搜索结果为准

---

## 禁止行为

- 凭记忆/上下文推断 TODO 内容，每次先读文件
- 把 `- [x]` 误判为 `- [ ]`
- 用 `>` / `cat >` 整文件覆盖 TODO.md（丢失其它章节）
- 在用户没问"已完成什么"时主动展示已完成清单
- 内置 `todo_list`/`todo_write` 与文件 TODO 混用
- 未经用户确认就覆盖桌面主文件
- 凭空补全用户没说的任务名、截止日期、分类
- 写入失败时闷头继续下一项（必须停下来报告）

---

## 操作速查

| 场景 | 命令摘要 |
|------|----------|
| 查今天待办 | 流程 A：读文件 → 分类呈现 |
| 加一条 TODO | 流程 B：解析 → 追加 → 更新日期 |
| 勾掉一项 | 流程 C：`grep -n` → `sed 's/- [ ]/- [x]/'` |
| 删一项 | 流程 D1：`grep -v` → 写回 |
| 改一项 | 流程 D2：定位行 → `sed` 整行替换 |
| 同步到桌面 | 流程 E2：去重合并追加 |
| 覆盖桌面 | 流程 E3：`cp`（需确认） |

---

## macOS 环境说明

- **Shell**：Bash / Zsh（macOS 默认 Zsh）
- **路径**：`~/Documents/TODO.md`（工作区）
- **date 命令**：macOS BSD date（`date '+%Y-%m-%d'`，`date -v+1d` 表示明天）
- **sed**：macOS BSD sed（`-i ''` 需加空字符串参数）
- **fd 替代**：macOS 未预装 fd，用 `find` 替代；若需安装：`brew install fd`
````

## 安装方式

将以上内容保存为 `SKILL.md`，放置到 Codex 的 skills 目录：

```
~/.agents/skills/TODO-Handler/SKILL.md
```

之后在 Codex CLI 中直接说出触发词（如「看看我的 TODO」「加一条待办」），AI 助手即按本规范执行操作。

## 许可

MIT License

Copyright (c) 2026 Shiorangerin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
