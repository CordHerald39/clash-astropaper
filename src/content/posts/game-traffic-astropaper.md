---
title: "Clash 游戏加速与通用代理为什么不能直接画等号"
description: "Clash 游戏加速与通用代理为什么不能直接画等号。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:36:45.697162+00:00
modDatetime: 2026-10-04T21:36:45.697162+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

把已经能代理网页直接当成已经在为游戏做加速，会把入站能力、协议栈和路由范围混为一谈。通用代理通常指供支持代理的应用主动连接的端口；游戏加速往往依赖 TUN 把本机或指定来源的 IP 流量导入内核。以下只依据 TUN 文档说明二者不能画等号的条件、判断依据和配错后的下一步。

## 适用条件：入站能力不同

适用条件是：设备上已经存在可用的代理端口或规则匹配，但游戏客户端并未提供同等的代理设置。TUN 需要 `enable` 为 true 才会建立虚拟网卡。`auto-route` 才会自动将全局流量路由进入 tun 网卡。没有这两项时，即使其他入站端口工作正常，游戏流量仍可能走系统默认路由，并不经过所谓加速。

Linux 的 `auto-redirect` 用 iptables 或 nftables 重定向 TCP，且依赖 `auto-route`。它覆盖的是 TCP 重定向，不是把所有游戏协议都变成通用代理。Android 上该组合仅转发本地 IPv4 连接。因此代理端口可用只说明有应用主动来连端口；游戏加速要回答的是流量有没有被路由进 TUN。

`auto-detect-interface` 在多出口时与通用代理只监听端口不同，文档建议多出口网卡同时连接的设备手动指定出口网卡。`device` 在 MacOS 只能使用 utun 开头的名称。这些都是 TUN 接管的前置条件，通用代理端口没有对等项。`route-address` 在启用 `auto-route` 时路由自定义网段而不是默认路由，文档写明一般无需配置；一旦改写，覆盖范围就不再等于「所有应用都走同一代理端口」。

## 协议栈与 DNS 不能互相替代

`stack` 取值为 system、gvisor、mixed、mips。文档描述 system 使用系统协议栈，占用相对其他堆栈更低；gvisor 在用户空间实现网络协议栈；mixed 是 TCP 走 system、UDP 走 gvisor；mips 为自研 IP 协议栈，且如无使用问题建议使用 mips。通用网页流量以 TCP 为主，游戏常同时依赖 UDP。mixed 下 TCP 正常不能等同 UDP 正常。打开防火墙时无法使用 system 和 mixed，这与代理端口是否在听不是同一问题。文档中的协议栈网络回环测试标明仅供参考，平台为 linux，Windows 和 MacOS 可能会有差异，不能拿来证明游戏加速已经成立。

`dns-hijack` 把匹配连接导入内部 dns 模块，未写协议时按 udp:// 理解。MacOS 与 Windows 不能自动劫持发往局域网的 dns；Android 私人 dns 也无法自动劫持。通用代理场景里浏览器可能自行解析或使用系统 DNS，游戏则可能把解析失败表现为连不上服务器。`strict-route` 在 Linux 与 Windows 上的额外防火墙或路由行为，是 TUN 路径上的约束，并不存在于只开代理端口的通用用法里。

`udp-timeout` 默认 300 秒，作用于 UDP NAT，这是通用 TCP 代理没有的生命周期。`endpoint-independent-nat` 改变 NAT 行为，文档说明不建议在不需要时开启。把这些项当成通用代理开关，会误判游戏会话被提前拆除的原因。Linux 上 `gso` 与 `gso-max-size` 只作用于 TUN 数据路径，同样不能从网页代理是否可用反推。

## 范围过滤与失败后下一步

TUN 还可以按接口、UID、MAC、Android 用户和包名限制谁被路由。`include-interface` 与 `exclude-interface` 冲突；UID 规则仅 Linux 且需要 `auto-route`；包名与 Android 用户规则仅 Android 且需要 `auto-route`。通用代理不会因为未列出 `include-package` 就把浏览器排除在外，那是 TUN 路由集合的语义。`route-exclude-address` 会在 `auto-route` 时排除网段；Linux 上基于规则集的 `route-address-set` 与 `route-exclude-address-set` 还要求 nftables，并与 `routing-mark` 冲突。

判断依据：只要游戏未进入 TUN 路由集合，或 UDP、DNS、NAT 与网页路径不一致，就不能把通用代理成功当作游戏加速成功。`include-android-user` 把机主、分身和应用多开分成不同用户 ID，通用代理端口通常看不到这一层差异。

失败后下一步：先单独确认 `enable` 与 `auto-route`（Linux 上的 TCP 再加 `auto-redirect`），再确认游戏是否落在 include 与 exclude 集合内，然后按 TCP 与 UDP 选择并验证 `stack` 及防火墙放行，最后才检查 dns-hijack 与 `udp-timeout`。不要用代理端口通断代替上述任一步。

资料：https://wiki.metacubex.one/config/inbound/tun/
