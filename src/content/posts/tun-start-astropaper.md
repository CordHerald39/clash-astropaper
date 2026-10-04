---
title: "Clash TUN 与系统代理的流量入口有什么不同"
description: "Clash TUN 与系统代理的流量入口有什么不同。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.194687+00:00
modDatetime: 2026-10-04T19:22:51.194687+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Tun 与系统代理同属入站，但流量进入 Clash/mihomo 的位置不同。Tun 依赖虚网卡和路由（在 Linux 上还可叠加 iptables/nftables 重定向），在 IP 层接管；系统代理则要求应用自己连接 HTTP/SOCKS 等入站端口。适用条件是：需要判断某类流量会不会在未设置代理的情况下进入内核。判断依据是手册中的 `auto-route`、`auto-redirect`、`dns-hijack` 以及按网卡、UID、包名、MAC 过滤的字段，而不是应用是否填写了代理地址。

## 入口层级：虚网卡路由与应用主动连接

Tun 通过 `device` 创建虚网卡（MacOS 仅允许 `utun` 前缀）。打开 `auto-route` 后，程序自动设置全局路由，把流量导向该网卡，因此未支持系统代理的进程也可能被导入。`auto-detect-interface` 用于自动选择流量出口网卡；多出口设备手册建议手动指定，否则回程出口与入站接管不是同一层问题。

系统代理路径下，流量通常在应用层出现：只有按代理设置发起的连接才会进入对应 inbound。Tun 不依赖这一步。`auto-redirect` 仅 Linux，且必须先启用 `auto-route`，它自动配置 iptables/nftables 重定向 TCP。Android 上该重定向仅转发本地 IPv4；要通过热点或中继共享 VPN 连接，手册说明使用 VPNHotspot。Linux 路由器上，带 `auto-route` 的 `auto-redirect` 可按预期工作。这些都说明 Tun 的入口是“系统把包送进虚网卡/重定向”，不是“应用连本地代理端口”。

## 哪些流量会被送进 Tun

未配置过滤时，`auto-route` 按默认全局网段导入。也可用 `route-address` 指定要路由的网段，或用 `route-exclude-address` 排除网段；旧字段 `inet4-route-address` 等即将废弃，新配置应使用现行字段。Linux 在 nftables 且 `auto-route`、`auto-redirect` 均启用时，还可用 `route-address-set`/`route-exclude-address-set` 按规则集中的目标 CIDR 决定绕过或接管，这两项与任意配置里的 `routing-mark` 冲突。

过滤入口也与系统代理不同：`include-interface`/`exclude-interface` 限制或排除被路由的接口，二者冲突不可同时写；Linux 上 `include-uid` 等按用户决定是否被 Tun 路由，且需要 `auto-route`；Android 上 `include-android-user`、`include-package`/`exclude-package` 按用户和应用包名决定，同样需要 `auto-route`；Linux 上还可按源 MAC 限制局域网设备，且需要 `auto-route` 与 `auto-redirect`。系统代理一般按“谁连接了代理端口”生效，不会在内核按 UID、包名或 MAC 直接改路由。

## DNS 入口差异与失败时下一步

`dns-hijack` 把匹配到的连接导入内部 DNS 模块，未写协议时按 UDP 处理。这是 Tun 路径上的 DNS 入口，不是应用把 DNS 设成系统代理。限制同样来自手册：MacOS/Windows 无法自动劫持发往局域网的 DNS；Android 开启私人 DNS 时无法自动劫持。`strict-route` 在启用 `auto-route` 时执行更严格的路由：Linux 上不支持的网络无法到达，连接被导入 tun，用于防止地址泄漏并使 Android 上 DNS 劫持可工作；Windows 上会加防火墙规则，阻止普通多宿主 DNS 解析造成的泄露，但可能使部分应用无法正常工作。

若现象是“系统代理有连接、Tun 无流量”，下一步核对 `enable`、`auto-route` 是否打开，过滤项是否把该网卡、UID 或包名排除，以及防火墙是否阻止了 `system`/`mixed` 栈。若“Tun 有包但 DNS 未进内部模块”，按平台检查局域网 DNS 与私人 DNS 限制，而不是去改系统代理端口。若 Linux 重定向未生效，确认 `auto-redirect` 未在非 Linux 使用，且未与 `routing-mark`、冲突的 interface 过滤同时出现。需要回退时先关 `enable`，再查路由与防火墙是否仍指向已不存在的 tun 设备。

资料：https://wiki.metacubex.one/config/inbound/tun/
