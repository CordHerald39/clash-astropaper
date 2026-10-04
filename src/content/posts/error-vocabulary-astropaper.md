---
title: "Clash 连接超时、拒绝和重置为什么不能混说"
description: "Clash 连接超时、拒绝和重置为什么不能混说。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T22:12:28.421669+00:00
modDatetime: 2026-10-04T22:12:28.421669+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 三种说法对应官方文档里不同的配置域

连接超时、拒绝和重置不能混说，是因为它们在对照全局配置时会指向不同小节。超时说的是在等待、握手或保活相关的时间尺度内没有完成预期动作；官方为此提供 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`、`unified-delay`、`tcp-concurrent` 等字段，它们描述间隔、空闲、是否禁用保活、是否用 RTT 消除握手差异、是否对解析出的全部 IP 并发并采用第一个成功连接。拒绝说的是访问被明确挡住：`allow-lan` 为否、`bind-address` 不包含来源、命中 `lan-disallowed-ips`（黑名单优先级高于白名单）、未通过 `authentication` 且不在 `skip-auth-prefixes`。重置说的是连接过程被复位，既不是「一直等不到」，也不是「策略上从未允许」。

适用条件是：你准备根据现象去改全局项，或把现象写入排障记录。若只是口头说连不上，可以暂不细分；一旦要动 `allow-lan`、`secret` 或 Keep Alive，就必须拆开。判断依据是官方把允许局域网、用户验证、TCP Keep Alive、外部控制 API、TLS 分成不同段落，而不是提供一个统称网络的开关。

## 混说会把排查带进错误字段

把超时写成拒绝，注意力会从等待与并发被拽到 `authentication` 或 `lan-disallowed-ips`。改这些项只影响谁能使用代理端口、是否要用户验证，并不能解释统一延迟所计算的 RTT，也不能解释 TCP 并发下「第一个成功连接」以外的未完成尝试。把拒绝写成超时，则会去调 `keep-alive-interval` 或打开 `tcp-concurrent`；但拒绝可以发生在绑定到单一地址、禁止段命中、或 http(s)/socks/mixed 验证失败时，这些与保活秒数无关。把重置写成拒绝，可能去增加 `skip-auth-prefixes` 或改 `secret`；而 `secret` 是 RESTful API 的访问密钥，官方还写明从 Unix socket 或 Windows namedpipe 访问 API 不会验证 secret。鉴权模型再怎么改，也不能当成 TCP 复位的说明。

`log-level` 的分层同样禁止混用三个词。`error` 是发生错误至无法使用；`warning` 是发生错误但不影响运行，并包含 error 内容；`info` 才加入一般运行内容。超时在 TCP 并发开启时，可能只是部分地址未完成、另一地址已经成功，它更接近尚未完成，而不是已经判定拒绝。若把三种文字一律当成 error 级的无法使用，会丢掉 warning 级仍在运行的线索。`silent` 不输出任何日志，此时混说三种失败没有任何依据。

运行模式会放大混说的伤害。`mode` 为 `direct` 时是全局直连，为 `global` 时需要在 GLOBAL 策略组选择代理或策略，为 `rule` 时走规则匹配，且此项默认规则模式。同一句连不上，在三种模式下可能分别要看 `interface-name`、`profile.store-selected`（是否储存 API 对策略组的选择）或入站绑定。不拆超时、拒绝、重置，就无法决定先看哪一节。

## 写记录时强制拆成三行

记录用三行互斥描述，禁止用顿号把三个词连成同一原因。第一行只写是否在等待中结束，并列 `keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`、`unified-delay`、`tcp-concurrent` 的当前值。第二行只写是否被访问控制或用户验证挡住，并列 `allow-lan`、`bind-address`、允许段、禁止段、`authentication`、`skip-auth-prefixes`。第三行只写是否在连接过程中被复位，并列保活是否禁用，以及当前这条是否走 `external-controller-tls` 与 `tls` 证书。某一行为空就留空，不准用另外两行的字段去填补。

拆分后仍无法判断时，下一步是把 `log-level` 调到能区分 error 与 warning 的级别，只在控制台和控制页面核对英文原文，而不是改写成笼统的连不上。若原文同时出现多个英文词，按各自配置上下文各记一条，不合并。不要发明第四种统称去覆盖官方已经分开的入站、出站和 API 章节。

资料：
https://wiki.metacubex.one/config/general/
