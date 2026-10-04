---
title: "Clash QUIC、UDP 与代理入口有什么关系"
description: "Clash QUIC、UDP 与代理入口有什么关系。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:02:29.347735+00:00
modDatetime: 2026-10-04T21:02:29.347735+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

QUIC 跑在 UDP 上，浏览器可能用它访问网站；Clash 官方全局配置描述的则是谁能进入代理端口、内核接受何种地址族、以及出站从哪块网卡离开。二者不是同一层。本页没有单独的 QUIC 字段，讨论关系时只能使用已记载的入站、模式、IPv6 与出站接口，不能把未写出的 UDP 开关当成依据。

## 代理入口在资料里指什么

入口相关项包括：是否允许局域网设备经代理端口访问互联网（`allow-lan`）、绑定地址（`bind-address`）、允许与禁止的局域网网段、以及 http(s)/socks/mixed 的用户验证。`bind-address` 为 `"*"` 绑定所有 IP，也可绑定单个 IPv4 或单个 IPv6。`lan-allowed-ips` 仅在 `allow-lan` 为 true 时生效，默认 `0.0.0.0/0` 与 `::/0`；`lan-disallowed-ips` 为黑名单，优先级高于白名单。

`authentication` 为代理用户验证，`skip-auth-prefixes` 指定可跳过验证的 IP 段。也就是说，资料中的「入口」回答的是：哪些地址能连上 http(s)/socks/mixed 端口、要不要账号。它并不按 QUIC 另行定义一套入口。

判断依据：客户端连的是上述代理端口且通过认证（或命中跳过前缀），才谈得上流量进入内核；连不上端口或认证失败时，讨论 QUIC 与 UDP 没有意义。

## UDP/QUIC 与这些入口如何相交

相交点有三，都来自已记载字段，而不是额外协议开关。

第一，地址族。`ipv6` 控制内核是否接受 IPv6 流量，默认 true。QUIC 可能走 IPv4 或 IPv6；关闭 IPv6 后，只剩 IPv4 可被内核接受，这会改变 UDP 路径是否存在，但不是「关闭 QUIC」的专用选项。

第二，运行模式。`mode` 为 `rule` 时按规则匹配，为 `global` 时走 GLOBAL 策略组，为 `direct` 时全局直连。浏览器的 QUIC 会话若被直连，则根本不经过出站代理；若被规则或全局代理抓住，则取决于后续节点，而不是入口字段本身。

第三，出站。`interface-name` 指定流量出站网卡，`routing-mark` 为 Linux 出站提供默认流量标记。入口决定谁进来，这两项决定从哪出去。对照 QUIC 故障时若同时改入口和出站接口，无法判断是 UDP 在入口被拒，还是出网路径变了。

TCP 相关项容易造成误读：`tcp-concurrent` 明确写的是 TCP 并发连接；Keep Alive 各项也针对 TCP。它们不能代表 UDP/QUIC 已由同一机制处理。`unified-delay` 只用于计算 RTT、消除握手带来的节点延迟差异，同样不是 UDP 开关。

进程匹配会改变「哪类程序的流量被识别」。`find-process-mode` 为 `always` 时强制匹配所有进程，`strict` 由内核判断，`off` 不匹配（路由器上推荐 off）。浏览器 QUIC 若依赖进程规则，该项从 `off` 改到 `always` 等于改变匹配面，而不是改变入口端口定义。

## 失败时下一步

若已确认 `allow-lan`、绑定地址与认证无误，现象仍随浏览器协议变化：先不要改 GEO 下载、全局 UA、ETag 或外部 UI。把 `log-level` 设为 `debug`，确认不是 `mode: direct`。检查 `ipv6` 在两次观察中是否一致。

若设备在局域网，核对源 IP 是否落在允许网段且不在禁止网段。本机对照则核对其是否属于 `skip-auth-prefixes`。仍无法对应时，回到入口三项（允许局域网、绑定、认证）与模式、IPv6 逐项记录当前值，避免用 TCP 并发或 Keep Alive 去解释 UDP。资料未给出的 QUIC 专用项不要自行补写进配置。

https://wiki.metacubex.one/config/general/
