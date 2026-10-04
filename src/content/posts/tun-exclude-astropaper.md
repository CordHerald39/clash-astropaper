---
title: "Clash TUN 排除与代理规则 DIRECT 有何不同"
description: "Clash TUN 排除与代理规则 DIRECT 有何不同。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.198676+00:00
modDatetime: 2026-10-04T19:22:51.198676+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 作用位置不同：绕过路由还是进内核后再直连

Clash（mihomo）里 TUN 排除和代理规则 DIRECT 不是同一层开关。官方 TUN 文档把 `route-exclude-address`、`route-exclude-address-set`、`exclude-interface`、`exclude-uid`、`exclude-package` 等写在入站 `tun` 下。它们的语义是：在自动路由/防火墙层面，让匹配流量绕过路由、不按 TUN 接管来处理。例如 `route-exclude-address-set` 明确写的是“匹配的流量将绕过路由”；`route-address-set` 则是不匹配的流量绕过路由。这发生在流量是否进入 TUN 路径之前或同时的系统路由决策上。

代理规则 DIRECT 属于路由规则/出站选择：流量通常已经进入 Clash 内核，再被判为直连出站。文档中与 DIRECT 同层的是规则、代理组、出站，而不是 `tun` 的 `route-exclude-address`。因此“局域网写 DIRECT”并不能替代“启用 `auto-route` 时排除自定义网段”；后者影响的是系统把哪些前缀送进 TUN 网卡。

判断依据：若目标是让某些网段、网卡、UID、MAC 或 Android 包根本不要走 TUN 设备，应看 TUN 排除字段；若目标是流量已进 Clash 后选择直连出口，才是规则侧 DIRECT。两者可以同时存在，但不能互相证明对方已生效。

## 配置字段、平台条件和依赖不同

TUN 排除高度依赖平台。`auto-route` 自动将全局流量路由进入 TUN。`auto-redirect` 仅 Linux，自动配 iptables/nftables 重定向 TCP，且需要 `auto-route`。`route-exclude-address-set` 仅 Linux，还需要 nftables，并与任意配置中的 `routing-mark` 冲突。UID 排除仅 Linux 且需要 `auto-route`。MAC 排除仅 Linux 且需要 `auto-route` 与 `auto-redirect`。Android 包名/用户仅 Android 且需要 `auto-route`。`include-interface` 与 `exclude-interface` 互斥。这些约束对代理规则 DIRECT 并不成立：DIRECT 不要求 nftables，也不按 UID/MAC 写入 `tun` 段。

`route-exclude-address` 的适用条件是已启用 `auto-route`，排除的是自定义网段。`route-address` 相反，是改“要路由的网段”而不是默认路由，一般无需配置。旧的 `inet4-route-exclude-address` / `inet6-route-exclude-address` 即将废弃，对应的是同一类“进 TUN 前的网段排除”，仍不是规则 DIRECT。`strict-route` 在 Linux 上让不支持的网络无法到达、将连接路由到 TUN，并用于防止地址泄漏、使 DNS 劫持在 Android 上工作；在 Windows 上则加防火墙规则阻止多宿主 DNS 泄露。这些是 TUN 路径的严格化，不是把匹配规则改成 DIRECT。

## 怎样选择以及混用失败时的下一步

具体场景可以按目的选择。需要本机访问 `192.168.0.0/16` 一类地址时不进 TUN：在已启用 `auto-route` 的前提下使用 `route-exclude-address`（文档示例即该网段与 `fc00::/7`）。需要按规则集 CIDR 在 Linux 防火墙层绕过：在 nftables + `auto-route` + `auto-redirect` 具备时用 `route-exclude-address-set`。需要某块物理网卡上的流量不进 TUN：用 `exclude-interface`，且不要同时写 `include-interface`。需要某 Linux 用户或某 Android 包不进 TUN：分别用 UID 或 `exclude-package`。需要 Clash 已接管后对某域名/IP 直连：用规则 DIRECT，而不是继续加 TUN 排除。

若排除后应用仍进代理，先核对流量是否仍被 `auto-route` 送入 TUN：平台不支持的字段会被忽略，看起来像“DIRECT 也没生效”，实际是排除未发生。若 DIRECT 已命中但系统路由仍指向 TUN，说明规则层直连无法抵消未排除的默认路由，应回到 `route-exclude-address` 或接口/UID/包名排除。若 Linux 上写了规则集排除却与 `routing-mark` 共存，文档视为冲突，应去掉一方再判断。防火墙未放行导致 system/mixed 不可用时，先处理栈与防火墙，再比较排除与 DIRECT。IPv6 排除还受系统是否存在 IPv6 以及顶层 `ipv6` 限制。不要用效果对比代替字段语义：文档没有把二者等同，失败时按所在层的适用条件逐项收口。

资料来源：https://wiki.metacubex.one/config/inbound/tun/
