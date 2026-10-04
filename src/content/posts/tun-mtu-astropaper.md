---
title: "Clash MTU 是什么，为什么不能盲目调大"
description: "Clash MTU 是什么，为什么不能盲目调大。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.198676+00:00
modDatetime: 2026-10-04T19:22:51.198676+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

根据 mihomo TUN 配置说明，mtu 就是最大传输单元，写在 tun 段里，示例中出现过 9000 这一数值。文档用一句话限定它的作用：会影响极限状态下的速率，同时给出一般用户默认即可的指引。因此理解 mtu 是什么，核心是认清它并非普遍加速开关，也不能在未确认极限场景、未排除其他字段的情况下盲目调大。

## mtu 在 TUN 中的位置与真正适用的边界
mtu 只是 TUN 入站诸多可选键之一，适用前提是 enable 已为 true 并选定了 stack。文档没有列出必须增大 mtu 的清单，也没有把日常速度与该值绑定。判断是否需要理会它，首先看配置里是否已经写了 mtu 行；未写即走默认。操作上若要改，仅在 YAML 的 tun 映射中增减或改写该键。与它并列、同样作用于传输路径的还有仅 Linux 可用的 gso 以及 gso-max-size，文档同样没有鼓励把它们一起随意加大。协议栈选择（system/gvisor/mixed/mips）和防火墙能否放行，会先于 mtu 决定 TUN 能否工作。

## 为什么文档不支持盲目调大
“一般用户默认即可”是官方直接表述，盲目调大等于主动离开这一建议。判断依据是文档把影响范围明确写成极限状态下的速率，而不是所有流量。若当前并不是极限场景，增大数值缺乏文档支持。更常见的限制来自其他项：防火墙开启时 system 与 mixed 不可用；strict-route 在 Linux 会阻断不支持的网络、在 Windows 会加防火墙规则并可能影响 VirtualBox；dns-hijack 在 MacOS/Windows 对局域网 DNS、在 Android 对私人 DNS 均有失效情况；auto-redirect 在 Android 只转发本地 IPv4。这些条件不满足时，调大 mtu 并不能使 TUN 按预期工作。route-address-set 还要求 Linux nftables 且不能与 routing-mark 同时使用，同样优先于 mtu 大小。

## 面对该值时应采取的态度与调整失败后的选择
若经过前面各项核对后仍认为处于极限状态，才考虑改 mtu 数字并重载。即便如此，官方态度仍是默认优先。一旦改完没有对应极限速率变化，或无法确认是否极限，下一步是把 mtu 恢复为未写或原来的值，转去检查栈是否该换、auto-detect-interface 是否该改成手动指定出口、inet6-address 是否因系统 IPv6 检查被关掉（可配合 SKIP_SYSTEM_IPV6_CHECK 与顶层 ipv6）、以及 include/exclude 接口、uid、包名等过滤是否把流量绕开了 TUN。始终以文档已写明的平台差异为判断基准，而不是假设更大数值必然有利。

资料来源：https://wiki.metacubex.one/config/inbound/tun/
