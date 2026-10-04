---
title: "Clash 重载配置与重启客户端有什么区别"
description: "Clash 重载配置与重启客户端有什么区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.216649+00:00
modDatetime: 2026-10-04T18:58:12.216649+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

本页几乎不把「重载配置」写成与「启动」对等的操作。能从资料里分开的，是三类不同生命周期：进程下次启动时读取的缓存、个别本地文件的自动重载、以及按间隔拉取的外部数据。其余全局项只作为 YAML 字段出现，没有承诺不经启动也能全部生效。把这三类混成一种「重载」，会误判哪些变化应该出现、哪些本来就不会出现。

## 适用条件

适用于需要解释「改了文件却像没改」或「没改 YAML 却像改了」的场合。适用于对照 profile、tls 本地文件、geo-auto-update 与 mode、log-level 等普通字段。不适用于比较未记载的连接是否中断、内存是否清空。全局客户端指纹已弃用，无论你把它理解成重载还是重启，都不应再指望该全局项生效，应在 proxy 内设置 client-fingerprint。

## 下次启动才会用到的部分

profile.store-selected 的对象是 API 对策略组的选择，目的是下次启动时使用。store-fake-ip 的对象是映射表，目的是域名再次发生连接时使用原有映射地址。这两项把运行中的选择和映射从「当前进程」延长到「下一次启动之后」，因此它们不能用来证明当前进程已经按新 YAML 工作，也不能用来证明一次未记载的重载已经完成。若你看到策略组选择在退出再打开后仍在，只说明启动路径读了这份缓存。

## 不经过整进程启动的更新

tls 段目前仅用于 API 的 https。自 v1.19.18 起，当 certificate、private-key 或 ech-key 为本地文件时支持自动重载。这是文件级重载，对象不是整份全局配置，也不等同于重启客户端。external-ui-url 的说明是更新时写入指定文件夹，与内核是否重启无直接对应。geo-auto-update 为 true 时按 geo-update-interval（小时）更新 GEO，这是定时拉取，不是重载 YAML，也不是重启。etag-support 只影响外部资源下载是否使用 ETag，不能据此推断进程被重启过。

SAFE_PATHS 是环境变量，该页用它约束工作目录之外的路径。资料未写重载会重新解析环境变量；把界面目录改到工作目录外却未设置该变量，失败原因在路径策略，不在「重载和重启有何不同」。

## 未给出差异的字段与失败时下一步

mode、log-level、ipv6、find-process-mode、interface-name、routing-mark、tcp-concurrent 等均无「重载生效 / 仅重启生效」的对照表。log-level 的输出位置始终是控制台和控制页面，不能靠日志出现在何处来区分重载与重启。disable-keep-alive 在 Android 强制为 true，平台覆盖与是否重启无关。

若改完 YAML 后行为不变，先查该项是否属于启动缓存、文件自动重载或 GEO 定时更新；都不属于则本页无法证明新值已被加载。此时只能回到上一份可启动配置，并避免用已弃用的全局指纹或未纳入 SAFE_PATHS 的路径做对比试验。

资料来源：
https://wiki.metacubex.one/config/general/
