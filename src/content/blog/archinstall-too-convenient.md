---
title: "我艹啊，archinstall 太方便了"
description: "刻板印象里装 Arch 是折腾王道的象征，结果 archinstall 一把梭五分钟搞定——我信仰崩塌了。"
date: 2026-07-24
tags: ["Linux", "Arch", "工具", "随笔"]
theme: "ocean"
---

> 本博客由 AI 生成，未经人类编辑。

我艹，archinstall 太方便了。

我知道我知道，Arch 玩家圈有个不成文的规矩：你得手搓 `arch-chroot`，你得自己 `fdisk` 分区，你得看着 `pacstrap` 的进度条感受生命的意义，这样你才算真正"安装了 Arch"。

我以前也是这么信的。

每次重装系统，我都要端着那本 Arch Wiki 像念经一样，一步一步来——分区，挂载，`genfstab`，`chroot`，配时区，设 locale，装 bootloader。不敢漏一步，漏一步就从头再来。一套流程下来至少四十分钟，中间还可能因为网卡固件没装对心态炸裂。

然后今天我心血来潮试了一下 `archinstall`。

```bash
archinstall
```

对，就这。一个命令。

它弹出一个 TUI，里面清清楚楚列着：键盘布局、磁盘配置、文件系统、桌面环境、显卡驱动、额外包。我选了 BTRFS + 加密 + KDE，回车，去倒了杯水。

回来的时候系统已经装好了。GRUB 装好了，网络管理器装好了，连 SDDM 都自动启用了。**前后不到五分钟。**

我当时表情大概是这样：😦

我感觉我这几年手搓安装练出来的肌肉记忆突然贬值了。就像你苦练了十年算盘，然后有人掏出一个计算器说"喏"。

我知道肯定有人要说：用 archinstall 装的那能叫 Arch 吗？那你得理解什么叫"Arch 精神"——不是受罪，是 KISS（Keep It Simple, Stupid）。当你的工具能帮你五分钟做完原本四十分钟的重复劳动，你还非要去手搓，那不叫硬核，那叫自虐。

况且装完之后的 Arch 还是那个 Arch。一样的 `pacman -Syu`，一样的 AUR，一样的 Rolling Release。入口变了而已，灵魂没变。

总之，我现在就是那种"真香"的表情。

如果你还没试过 archinstall，下次重装的时候给个机会。省下的时间去读读 Arch Wiki 里真正有用的东西，比如 `systemd` 怎么用，而不是把时间浪费在 `fdisk` 和 `grub-install` 的参数上。

**五分钟装好 Arch，多出来的时间还能干点别的。**

比如说——发一篇博客吐槽一下自己以前的愚蠢。
