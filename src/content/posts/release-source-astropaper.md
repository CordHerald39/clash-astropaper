---
title: "Clash 电脑端：源码仓库、发行页和软件下载站分别提供什么"
description: "Clash 电脑端：源码仓库、发行页和软件下载站分别提供什么。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-03T18:19:57.267543+00:00
modDatetime: 2026-10-03T18:19:57.267543+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 三类入口分别提供什么

电脑端 Clash 图形客户端常见三类入口。源码仓库放源代码、许可证、贡献说明、开发命令和功能介绍，并把“去哪里拿安装包”指向发布页。发行页按版本号提供各系统可安装文件、校验信息、签名、源码归档和更新说明。软件下载站或项目文档中的下载页按操作系统整理架构、包格式、系统要求和安装命令，有的还给出包管理器命令和备用下载。

Clash Verge Rev 仓库写明请到发布页面下载对应安装包；其文档写明目前仅通过 GitHub Release 发布，并提醒辨别来源。Clash Mi 在独立下载页按 Windows、macOS、Linux 列出稳定版与测试版，Windows 还区分安装包与压缩包，并提供 GitHub 备用下载。内核手册把 clash-verge-rev、ClashMi 等列为带 mihomo 内核的三方客户端，并不直接控制这些界面的开发，非内核问题应向对应项目反馈。

适用条件：只要能安装的客户端，走发行页或官方下载说明；要读代码、提 Issue 或自行编译，走仓库；不确定 x64 还是 ARM、deb 还是 rpm、安装包还是压缩包，走文档或下载站。

## 源码仓库能查到什么

Clash Verge Rev 仓库说明这是基于 Tauri 的 Clash Meta 图形界面，支持 Windows（x64/x86）、Linux（x64/arm64）和 macOS 11 及以上（Intel 与 Apple 芯片）。页面可切换简体中文等语言，并给出功能概要、隐私说明（配置与日志保存在本地）和 GPL-3.0 许可。目录含文档、前端、Tauri 后端、贡献指南和更新日志。满足 Tauri 前置条件后，可用 pnpm i、pnpm run prebuild、pnpm dev 启动开发流程；仓库还说明开发通道如何保留已有服务状态，以及显式安装开发服务或强制 Sidecar 的用法。

版本选择写在仓库里：Stable 为正式版，适合日常使用；Alpha 已废弃；AutoBuild 为滚动更新，适合测试反馈，可能存在缺陷。仓库不承担按系统分列安装包的职责。在仓库根目录找不到 exe、dmg、deb，属于正常情况，应改开 Release。

失败时下一步：若目标只是安装，停止在仓库里翻资源目录，转到发行页。若目标是编译，先读 CONTRIBUTING 和文档中的构建说明，确认工具链后再构建。

## 发行页提供哪些安装文件

发行页以版本标签组织。Latest 表示当前正式版，Pre-release 表示候选或测试流程中的版本。每个版本附更新说明和多份资源：Windows 的 setup 安装包（另有内置 WebView2、体积更大的变体，仅在系统缺少且无法安装 WebView2，或面板无法打开时使用）、macOS 的 dmg 与 app 归档（区分 Apple M 与 Intel）、Linux 的 deb 与 rpm（含 64 位、ARM64、ARMv7），以及 Source code 的 zip、tar.gz 和部分 sig。资源旁列出 sha256，下载后可用于核对。现版本 Windows 不再支持 Windows 7。

判断依据：日常使用选 Latest，并让文件名中的 amd64/x86_64、arm64/aarch64、armhfp 与本机架构一致。文档建议：不清楚 Windows 架构时优先 x64。不要把 Source code 压缩包当成安装程序。

失败时下一步：仍在 Windows 7 上安装时，需先升级到 Windows 10/11，或改用 Linux 桌面。缺 WebView2 时改用带 fix_webview2 字样的包。macOS 11 可按文档用带 go124 标签的 mihomo 替换应用内 verge-mihomo，仍建议升级到 macOS 12 及以上。安装或启动问题转到文档中的常见问题。

## 软件下载站怎样对照着选

Clash Verge Rev 文档下载页按 Windows、Linux、macOS 汇总，并给出 WinGet：winget install ClashVergeRev.ClashVergeRev。Scoop 被标明为社区维护分发，项目不为下游渠道产生的问题提供支持，适用于有修改配置目录或便携需求的用户。Linux 侧：Debian 系下载 deb 后用 apt 安装本地包；CentOS/Fedora/SUSE 用 dnf 或 yum 安装 rpm；Arch/Manjaro 可用 yay 安装正式版或测试版包。文档还列出 Windows 安装后的文件角色，例如主程序、服务安装与卸载程序、系统代理组件和 mihomo 内核，用来区分“客户端安装结果”和“源码归档”。

Clash Mi 下载页先选平台。Windows 提供稳定版、测试版的安装包与压缩包；macOS 提供稳定版与测试版；Linux 提供稳定/测试的 deb、rpm，测试版另有 GitHub 备用。电脑端系统要求为 Windows 10 及以上、macOS 12 及以上、Linux kernel 6 及以上。新版本会在其电报群通知。该页还会分流：Windows 可考虑同样使用 mihomo 内核的 Mihomo Party；Linux 发行版可考虑命令行部署；内核本身指向 MetaCubeX/mihomo。

失败时下一步：Clash Verge Rev 若来自不明镜像，回到文档中的 GitHub Release 正式版或测试版入口核对。Scoop 或其它下游渠道异常时，改用 GitHub Release。架构或 deb/rpm 选错则按发行页文件名重下。Clash Mi 主链失败时改用其标注的 GitHub 备用。把图形客户端安装包和内核二进制分开处理，避免把仓库里的源码 zip 当成可安装程序。

https://github.com/clash-verge-rev/clash-verge-rev
https://github.com/clash-verge-rev/clash-verge-rev/releases
https://www.clashverge.dev/install.html
https://clashmi.app/download
https://wiki.metacubex.one/startup/client/client/
