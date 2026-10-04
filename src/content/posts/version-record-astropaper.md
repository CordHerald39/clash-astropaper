---
title: "Clash 客户端版本与 Mihomo 内核版本有什么区别"
description: "Clash 客户端版本与 Mihomo 内核版本有什么区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:33:17.926184+00:00
modDatetime: 2026-10-04T18:33:17.926184+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash 相关讨论里常把“客户端版本”和“Mihomo 内核版本”写成同一个数字。就公开的全局配置说明而言，二者不是同一层：该手册描述的是 mihomo 内核如何读取运行参数，并不定义某一图形客户端的发行编号。分清这两层，才能解释为何界面已经升级、部分键仍无效，或配置已经符合手册、窗口看起来仍像旧版。

## 手册实际覆盖的是内核层

MetaCubeX/mihomo 手册的全局配置列出的是内核进程使用的项：是否允许局域网（`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips`）、入站验证、`mode`、`log-level`、IPv6、TCP Keep Alive、进程匹配、外部控制 API、外部用户界面、GEO 数据、出站接口等。这些键由内核解释。适用条件是：你正在阅读或编写这份 YAML，并需要判断“改的是内核行为还是外壳展示”。

客户端版本若存在，通常表示安装包、启动器或封装界面的世代，本页资料没有给出其编号规则，也没有把某个窗口标题规定为版本来源。因此，不能从该手册推出“客户端 x.y 等于内核 x.y”。

## 内核版本改变的是能力边界，不是菜单外观

手册用明确的版本门槛说明内核世代差异：当 `certificate`、`private-key` 或 `ech-key` 为本地文件时，自 v1.19.18 开始支持自动重载。这是内核行为变更。未达到该版本的内核，即使外壳界面看起来很新，也不应假定改证书文件会自动生效。反之，内核已达门槛但外壳从未提供“证书”相关页面，也不等于内核没有该能力——能力在配置，不在菜单。

其他项同样属于内核语义，与客户端版本号无对应表：`geodata-mode` 在 mmdb 与 dat 之间切换；`geodata-loader` 可选 standard 或面向小内存的 memconservative（并写明默认值）；`geo-auto-update` 与按小时计的 `geo-update-interval`；`global-ua` 默认 clash.meta；`etag-support` 默认 true。这些只随内核实现变化。把它们的有效与否当成“客户端新不新”的证据，判断依据就错了。

已弃用项也说明分层：全局 TLS 指纹已弃用，需在 proxy 内设置 `client-fingerprint`。外壳若仍展示全局指纹开关，只说明界面模型偏旧或未同步手册，不能单独证明内核版本。

## 客户端层在本页资料中对应什么

手册能直接对应到“界面”的，是内核托管的外部用户界面，而不是商店里的 Clash 应用本身：`external-ui` 指向静态网页目录，访问路径为 API 地址 `/ui`；可用 `external-ui-name` 指定子目录，用 `external-ui-url` 指定压缩包下载地址。更新该目录只更新 API 上的网页资源，不改变内核二进制世代。把仪表板的更新日期写成 Mihomo 内核版本，属于层错误。

外部控制本身也是内核能力：`external-controller`、Unix socket、Windows namedpipe、TLS 监听、Linux 上的 `external-controller-routing-mark`、以及可不校验 secret 的 DoH 路径。客户端可以去连接这些接口，但监听与鉴权规则由内核配置决定。Unix socket 与 namedpipe 不验证 secret，这是内核访问模型，与客户端是否“新版本更安全”无直接等式。

## 混淆时如何判断与纠正

判断依据可以固定为三问：第一，该差异是否能在全局配置键上找到？能，则优先记为内核问题。第二，是否属于文档写明的平台强制行为（Android 强制 `disable-keep-alive`、Linux 才有 routing-mark、路由器推荐 `find-process-mode: off`）？是，则记运行环境，而不是改客户端版本结论。第三，是否只出现在未写入该手册的菜单文案上？是，则记外壳差异，停止用它反推内核。

失败时的下一步：把当前 YAML 中与手册一致的字段单独存档，作为内核侧证据；把安装包或窗口上的数字标为未在该页验证的外壳版本。需要证书热重载却无法确认 v1.19.18 时，按未具备该能力处理，而不是按客户端“看起来已更新”处理。日志只在控制台和控制页面、且受 `log-level` 约束，不要因为某客户端没有把日志画出来，就断定内核过旧。

https://wiki.metacubex.one/config/general/
