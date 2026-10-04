---
title: "Clash TCP 与 UDP 在代理排查中为何要分开"
description: "Clash TCP 与 UDP 在代理排查中为何要分开。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:02:29.348731+00:00
modDatetime: 2026-10-04T21:02:29.348731+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

把 TCP 和 UDP 放在同一次代理结论里，常见做法是：网页或 TCP 端口能通，就宣布代理整条路径可用。全局配置并不支持这种合并。该页既有明确写着 TCP 的字段，也有对收包、模式、进程和出站接口生效的公共字段。分开排查，是为了让判断依据和字段的作用范围一致：TCP 专属项的结果不得迁移到 UDP，公共项即使两边都生效，也要分别验证。

## 适用条件：何时必须拆成两条路径

适用条件是：同一应用或同一目的可能同时使用 TCP 与 UDP，或你只用了 TCP 类检测（网页、TCP 连接、TCP 并发）就准备给 UDP 下结论。只要配置里出现 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`、`tcp-concurrent`，它们的成功或失败就不能写成 UDP 结论。

`mode` 对两类流量都生效，但仍要分开看命中结果。direct 时两者都走全局直连；global 时两者都依赖 GLOBAL 策略组的选择；rule 时各自命中的规则可以不同。判断依据：“模式相同”不等于“命中相同”，更不等于“TCP 探测代表 UDP”。`ipv6` 决定内核是否接受 IPv6 流量。TCP 与 UDP 都可以是 IPv4 或 IPv6，只测试一种协议加一种地址族，不能代表另一种。

## 只能解释 TCP 的字段，以及日志为何不能混读

TCP Keep Alive 三项只服务 TCP：间隔单位为秒，最大空闲时间，以及是否禁用。文档指出修改 Keep Alive 以减少移动设备耗电；Android 上 `disable-keep-alive` 强制为 true。UDP 在该页没有对应保活字段。判断依据：调整保活后若只有 TCP 长连接变化，记录必须写在 TCP 侧；若 UDP 同时变化，应改查模式、IPv6、出站接口或进程匹配等公共项，不能归因于 Keep Alive。

`tcp-concurrent` 的说明是启用 TCP 并发连接，用 DNS 得到的所有 IP 去连接，并使用第一个成功的连接。这是 TCP 连接建立策略。该页没有把 UDP 描述为“并发连接、取第一个成功”。判断依据：打开或关闭该项后，网页或其它 TCP 应用的变化，不能直接写成 UDP 通路已通或已断。

`log-level` 对两类流量都可能输出，但解读必须分开。error 只保留发生错误至无法使用的日志；debug 才会尽可能输出运行中所有信息。TCP 连接失败与 UDP 无连接状态在记录形态上不同。判断依据：条目必须能区分是哪一类流量；无法区分时先升到 debug，而不是合并成一条“代理不可用”。silent 不输出，不能当作两种协议都正常。

`find-process-mode` 决定是否匹配进程。always 强制匹配所有进程；strict 由 Clash 判断是否开启；off 不匹配，路由器上推荐此模式。匹配到进程，只说明识别层工作，不等于该进程的 TCP 与 UDP 都被同一方式接管。判断依据：进程名出现后，仍要在日志里分开看协议，不能把“识别到应用”写成“两种协议都已接管”。

## 公共层如何分别验证，以及失败下一步

`interface-name` 与 Linux 下的 `routing-mark` 是流量离开主机的公共层。TCP 与 UDP 都可能从该接口、带该标记出去，但系统侧仍可能只放行其中一种。判断依据：接口和标记配置相同，仍须分别验证两种协议是否真的从该接口离开，不能只用网页打开代替。

`allow-lan`、`bind-address`、`lan-allowed-ips` 与 `lan-disallowed-ips` 描述其它设备经代理端口访问，黑名单优先。入站若主要是 http(s) / socks / mixed 这类在该页与用户验证一起出现的代理，局域网网页能打开，不能推出局域网 UDP 已进入同一路径。判断依据：先确认流量是否经过文档所述代理端口，再分别谈两种协议。

失败时的下一步应按已排除项选择方向。TCP 正常而 UDP 不明时，不要再把 Keep Alive 和 TCP 并发当作修复 UDP 的手段；改为核对 `mode`、`ipv6`、进程匹配、出站接口，以及 debug 日志中是否出现该流量。UDP 侧可观察到、TCP 异常时，才把 Keep Alive、TCP 并发和 Android 强制禁用保活纳入步骤。global 模式下还要确认 GLOBAL 策略组选择是否对两类流量是同一对象。

若必须写结论，只能写“TCP 相关字段已核对”或“UDP 在该全局页无专用开关，仅能排除 TCP 专属项并核对公共项”，不能把某一种协议写成已经保证可用。

https://wiki.metacubex.one/config/general/
