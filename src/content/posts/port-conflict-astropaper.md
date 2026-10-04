---
title: "Clash 端口冲突与网络不通为什么不是同类问题"
description: "Clash 端口冲突与网络不通为什么不是同类问题。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.223790+00:00
modDatetime: 2026-10-04T18:58:12.223790+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

端口冲突和网络不通都会让人觉得「连不上」，但它们对应全局配置里完全不同的阶段，处理顺序也不能互换。适用条件是：已经配置了代理端口、绑定地址、运行模式和出站相关项，需要判断当前故障是监听没有建立，还是监听已建立但流量没有按预期离开本机。

## 端口冲突停在入站绑定阶段

端口冲突发生在内核为代理端口或外部控制创建监听之时。`bind-address` 决定绑在所有 IP 还是单一 IPv4 或 IPv6；`allow-lan` 只说明其他设备能否经过代理端口访问互联网，并不会把 bind 失败翻译成「网页打不开」。`external-controller`（示例 `127.0.0.1:9090`）和可选的 `external-controller-tls`（示例 `127.0.0.1:9443`）也会抢地址；Unix socket 与 named pipe 则是路径或管道冲突。判断依据是：进程无法完成 bind，出现地址已被使用或路径占用，此时规则、节点和 DNS 还没有机会为这条失败的监听服务。

`lan-allowed-ips` 与 `lan-disallowed-ips` 只限制谁能连上已经成功的监听，黑名单优先，默认白名单包含 `0.0.0.0/0` 与 `::/0`。把允许网段写窄，不会单独制造「地址已被使用」，也不能解释「API 已经能打开但业务流量失败」。`authentication` 失败表现为需要用户名密码，同样不是端口冲突。

## 网络不通落在模式、解析和出站阶段

网络不通时，入站往往已经成功：本机或局域网已经连上代理端口，外部控制端口也能访问。资料中的 `mode` 从这里开始生效：`rule` 按规则匹配；`global` 走全局代理，并且需要在 GLOBAL 策略组中选择代理或策略；`direct` 则全局直连。模式为 `direct` 时，表现为「端口在、转发不走代理」，这与套接字占用不是一类问题。`ipv6` 控制内核是否接受 IPv6 流量，默认 true；关闭后仅 IPv6 目标失败，也不是 bind 失败。

`interface-name` 指定出站网卡，`routing-mark` 为 Linux 出站连接提供默认流量标记，二者影响流量如何离开本机。DNS、域名嗅探、GEO 数据在手册中与全局项并列，它们决定域名如何解析、如何匹配，不会占用 `external-controller` 的端口。`unified-delay` 与 `tcp-concurrent` 改变测速和连接方式，`keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive` 只调整 TCP Keep Alive。这些项最多改变连通质量或耗电表现，不会在启动阶段报地址占用。`find-process-mode` 决定是否按进程名匹配，路由器上推荐 `off`；匹配关闭或判断过严时，部分程序的规则不符合预期，表现为「有的通、有的不通」，内核监听本身仍然可以是正常的。

## 用配置项把两类问题分开及失败时下一步

具体操作先看内核有没有因为地址占用而无法稳定运行。若 `external-controller` 都没有起来，应按端口冲突处理：核对 `bind-address`、代理端口和各控制入口，不要先改 `mode`。若 API 可访问、代理端口可连，再看 `mode` 是否为 direct、GLOBAL 组是否未选择节点、`ipv6` 是否关闭、`interface-name` 是否指向错误网卡。区分两类问题的判断依据是：冲突的失败点是套接字 bind；不通的失败点是匹配、解析或出站。

失败时下一步必须分开。绑定失败时，改监听端口或 `bind-address`，处理 Unix/pipe 残留，必要时把 `log-level` 调到 error 或 warning，确认是哪一个地址失败；`silent` 不会输出日志，不适合用来区分这两类故障。连通失败时，不要改已经成功的端口号来试运气，而应核对 `mode`、出站接口、路由标记，并在日志中区分 warning 与 error。`profile` 里的 `store-selected` 只保存策略组选择，既不能消除端口冲突，也不能单独修复解析失败。把两类现象写成不同检查单，才能避免用改端口去修直连模式，或用改规则去修地址已被使用。

资料来源：https://wiki.metacubex.one/config/general/
