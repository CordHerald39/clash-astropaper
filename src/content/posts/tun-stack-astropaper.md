---
title: "Clash TUN stack 设置为什么不能当加速按钮"
description: "Clash TUN stack 设置为什么不能当加速按钮。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.196490+00:00
modDatetime: 2026-10-04T19:22:51.196490+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash（mihomo）配置里的 TUN `stack` 是协议栈实现的选择，不是用来一键加快访问的开关。官方入站文档把它写成 tun 模式堆栈，列出 `system`、`gvisor`、`mixed`、`mips` 四种实现，并说明默认 `mips`、如无使用问题建议使用 mips 栈。把该字段当成加速按钮，会把「实现位置、隔离方式和生效条件」误当成速率旋钮。

## 文档写的是实现差异，不是加速档位

`system` 使用系统协议栈，表述为更稳定、更全面的 tun 体验，占用相对其他堆栈更低。`gvisor` 在用户空间实现网络协议栈，表述为更高安全性和隔离性，并减少内核与用户空间切换，从而在特定情况下具有更好的网络处理性能。`mixed` 把 TCP 放在 system、UDP 放在 gvisor，表述为使用体验可能相对更好。`mips` 是自研 IP 协议栈。

这些句子都带有适用边界：「相对其他堆栈」「特定情况下」「可能相对更好」。它们用来区分实现路径，不能推导成「改成某一值就会全面变快」。判断依据是：若改栈的动机只是想加速，而没有对应的稳定、隔离、TCP/UDP 拆分或自研栈需求，则该改动超出文档给该字段规定的用途。

## 防火墙和平台会先决定栈能不能用

资料写明打开防火墙则无法使用 `system` 和 `mixed`，需要按系统放行。Windows：设置 → Windows 安全中心 → 允许应用通过防火墙 → 选中内核。MacOS 一般无需配置，默认放行签名软件；遇阻时可尝试系统设置 → 网络 → 防火墙 → 选项 → 添加 mihomo app。Linux 一般无需配置；必要时对 TUN 网卡出站放行，文档示例为 `sudo iptables -A OUTPUT -o Mihomo -j ACCEPT`。

适用条件是：只有在对应栈能够建立的前提下，讨论体验或处理能力才有意义。防火墙未放行时，`system`/`mixed` 可能直接不可用，这时改栈表现为「通或不通」，而不是快或慢。协议栈网络回环测试也写明仅供参考，linux 与 Windows、MacOS 可能有差异，不能把某一平台示意图理解成通用加速证据。

## 真正影响传输行为的往往是其他字段，且有各自限制

文档对 `mtu` 的说明是：最大传输单元，会影响极限状态下的速率，一般用户默认即可。这已经把「极限状态」和「一般用户保持默认」分开，不能把改 `stack` 与改 `mtu` 混成同一个加速动作。`gso` 启用通用分段卸载，仅支持 Linux。`congestion-controller` 仅在 mips 协议栈时生效。`endpoint-independent-nat` 写明性能可能会略有下降，所以不建议在不需要的时候开启。

操作上应把 `stack` 只用于匹配实现需求：需要系统栈与相对更低占用时考虑 `system`；需要用户态隔离时考虑 `gvisor`；需要 TCP/UDP 分栈时考虑 `mixed`；无使用问题时按文档使用默认 `mips`。失败时下一步：先确认防火墙是否排除了 `system`/`mixed`；再确认拥塞控制、GSO 是否写在不适用的栈或系统上；若目标其实是极限吞吐或 NAT 行为，应回到 `mtu`、`gso`、`endpoint-independent-nat` 的文档条件，而不是反复把 `stack` 当加速按钮切换。

资料：https://wiki.metacubex.one/config/inbound/tun/
