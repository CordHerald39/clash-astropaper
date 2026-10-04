---
title: "Clash 局域网地址与公共网站流量为什么要区分"
description: "Clash 局域网地址与公共网站流量为什么要区分。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:36:45.699154+00:00
modDatetime: 2026-10-04T21:36:45.699154+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

局域网地址与公共网站流量在 Clash 的 Tun 里被分开处理，是因为自动路由的默认动作面向「把流量送进 tun」，而内网服务仍要留在直达路径上。官方用 `route-address` 与 `route-exclude-address` 表达接管哪些前缀、放行哪些前缀，并用严格路由和 DNS 劫持范围说明：若不区分，会出现地址泄漏或内网不可达。区分是路由归属问题，不是访问体验承诺。

## 适用条件

适用：计划打开 `tun.enable` 与 `auto-route`；同一台主机既要访问私网服务，也要访问互联网；需要解释为何不能把所有目的地址同等送入代理路径。`auto-route` 会自动将全局流量路由进入 tun 网卡。不加排除时，局域网目的地址也会进入这条全局路径。

`route-address` 在启用 auto-route 时路由自定义网段而不是默认路由，一般无需配置。`route-exclude-address` 排除自定义网段。文档把 `0.0.0.0/1`、`128.0.0.0/1` 以及对应 IPv6 前缀作为接管示例，把 `192.168.0.0/16`、`fc00::/7` 作为排除示例。这组对照就是公共范围与本地范围的划分方法。

## 区分的操作含义与判断依据

1. 先按目的地址决定是否应进 tun。判断依据：公共网站、需要随规则或代理组处理的流量，应落在被 `auto-route` 或 `route-address` 覆盖的前缀内；局域网服务应落在 `route-exclude-address` 中。只配其中一侧，就会出现外网正常而内网中断，或内网正常但接管范围不完整。
2. 严格路由会放大「不区分」的后果。Linux 下 `strict-route` 让不支持的网络无法到达，将所有连接路由到 tun，目的包括防止地址泄漏，并使 DNS 劫持在 Android 上工作。局域网若未被排除，可能被当成不可达一侧。Windows 下严格路由通过防火墙规则阻止普通多宿主 DNS 解析行为造成的 DNS 泄露，同时可能使部分应用程序无法正常工作。判断依据：泄漏防护与内网可达是同一开关的两侧，必须用排除网段显式保留局域网。
3. DNS 也要按目的地理解。`dns-hijack` 把匹配到的连接导入内部 dns 模块，不书写协议则为 udp。官方写明在 MacOS / Windows 无法自动劫持发往局域网的 dns 请求。因此公共网站的域名解析可以被导入内部模块，发往局域网的 DNS 在这些系统上不能按同样方式假设已被劫持。Android 如开启私人 DNS 则无法自动劫持 dns 请求。把两类流量写进同一套「解析一定经过 Clash」的假设，会得到错误判断。
4. Linux 上还可用 `route-address-set`、`route-exclude-address-set` 把指定规则集中的目标 IP CIDR 添加到防火墙：不匹配的流量将绕过路由，或匹配的流量将绕过路由。仅支持 Linux，需要 nftables 以及 auto-route、auto-redirect 已启用，并与任意配置中的 routing-mark 冲突。这是用 CIDR 集合区分公网与内网的方式，不是把规则集名称当成效果保证。
5. 接口级、设备级限制不能替代地址级区分。`include-interface`、`exclude-interface` 限制被路由的接口，二者冲突。`include-mac-address`、`exclude-mac-address` 按来源 MAC 限制局域网设备，仅 Linux 且需要 auto-route 和 auto-redirect。它们回答「谁发起」，地址字段回答「去哪里」，两类结论不应写在同一句话里互相替代。

## 失败时下一步

若未区分导致内网中断：把实际私网 CIDR 写入 `route-exclude-address`，确认不是只复制了示例中的 `192.168.0.0/16` 而漏掉其他私网。若未区分引发泄漏方面的担忧：再评估是否启用 `strict-route`，并接受 Windows 上可能影响部分应用、Linux 上不支持的网络将不可达。若仅域名访问内网失败：按官方限制改用 IP，或不再假设局域网 DNS 已被劫持。若规则集下发不生效：检查 nftables、auto-redirect 与 routing-mark。区分是否完成，看每一类目的地址能否在接管前缀、排除前缀、DNS 劫持范围中找到对应说明。

资料：https://wiki.metacubex.one/config/inbound/tun/
