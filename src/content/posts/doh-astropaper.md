---
title: "Clash DoH 加密的是哪一段 DNS 传输"
description: "Clash DoH 加密的是哪一段 DNS 传输。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.041465+00:00
modDatetime: 2026-10-04T20:31:18.041465+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

DoH 加密的是 Clash（手册对应 mihomo 的 DNS 配置）作为客户端，把 DNS 查询发向“写成 HTTPS 的上游服务器”的那一跳，而不是本机应用进监听端口的整段路径，也不是所有名为 DNS 的字段。下面按传输分段说明适用边界、如何判断以及理解错位时的下一步。

## 本机监听段并不因填写 DoH 而变成 HTTPS

适用条件：关心应用程序如何把查询交给进程。`listen` 是 DNS 服务监听，支持 udp、tcp。判断依据：应用把查询打到监听地址时，这一段是本地 DNS 服务，手册没有把它写成 DOH。`enable` 为 `false` 时使用系统 DNS 解析，此时甚至不会进入文档中的 nameserver 上游逻辑。

`use-hosts` 是否回应配置中的 hosts，`use-system-hosts` 是否查询系统 hosts，都会在上游查询前给出答案。这些回答发生在本地，不经过你填写的 HTTPS DNS 服务器，因此不属于 DoH 加密范围。步骤：区分“谁在问 Clash”和“Clash 去问谁”；只有后者且上游为 HTTPS 时，才讨论 DoH。失败时下一步：本机查询异常应检查 `enable` 与 `listen`，不要假设填写 DoH 后局域网查询也会自动变成 HTTPS。

## 加密发生在指向 HTTPS 上游的查询跳

适用条件：`nameserver`、`fallback`、`nameserver-policy` 的值、`proxy-server-nameserver` 或 `direct-nameserver` 中出现 HTTPS 形态服务器。手册将 `prefer-h3` 表述为 DOH 优先使用 HTTP/3，将 `h3` 表述为强制 HTTP/3 建立 DOH 连接。判断依据：协议写成 HTTPS 时，查询内容在到达该 DNS 服务器的传输上按 DOH（HTTP 上的 DNS）处理；同一列表里的 `tls://` 是另一类加密 DNS 写法，不是 DoH。

附加参数加在发向公网地址的 DNS 服务器上，使用 `#` 与 `&`。指定代理或接口时，DoH 这一跳可以“经过某代理/接口去连上游”，但被加密的仍是到 DNS 服务器的 HTTPS 查询，不是把整网流量都变成 DNS 加密。`#RULES` 或 `respect-rules` 只决定这条 DNS 连接是否遵守路由规则，不扩大加密范围。步骤：对每一条上游标出协议；仅把 HTTPS 条目计入 DoH 段；若条目带代理名，单独注明“DoH 建连所走的出站”，不要写成“全部 DNS 都在隧道里加密”。失败时下一步：看到 `tls://` 仍按 TLS DNS 理解；需要 HTTP/3 时确认服务器支持，因为那只改变 DOH 的 HTTP 版本，不改变“加密哪一跳”。

## 引导解析、假 IP 与未采用的上游不在同一加密段

适用条件：DoH 主机名是域名，或开启了 fake-ip、fallback 过滤。`default-nameserver` 用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。判断依据：引导解析解决的是“DoH 服务器这个名字本身”，它可能是 IP 上的加密 DNS，但在主机名尚未解析完成前，业务 DoH 那一跳还没建立。不能把引导段与业务 DoH 段混成一次加密。

`enhanced-mode` 为 fake-ip 时，进程先下发映射地址，真实查询与过滤由 `fake-ip-filter` 等规则约束；映射本身在本地。`fallback-filter` 会在 nameserver 结果被视为污染时改用 fallback 结果，或让名单内域名只使用 fallback 解析。此时真正走 DoH 加密的，是最终被选中的那条 HTTPS 上游，而不是列表里每一条都同时加密成功。`proxy-server-nameserver` 只覆盖代理节点域名解析，避免鸡蛋问题，也不等于给所有应用查询都套上同一段 DoH。

步骤：画三条线——本地监听、引导解析、业务/节点/direct 上游；只在“已选中的 HTTPS 上游”上标注 DoH。失败时下一步：主机名解析失败先处理 `default-nameserver`；答案来自 fallback 则去看过滤条件（`geosite` 已废弃，请使用 `nameserver-policy`）；本地 hosts 命中则承认这一次没有 DoH 传输。

资料：https://wiki.metacubex.one/config/dns/
