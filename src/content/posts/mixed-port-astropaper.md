---
title: "Clash 混合端口与独立 HTTP 端口有什么关系"
description: "Clash 混合端口与独立 HTTP 端口有什么关系。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.222660+00:00
modDatetime: 2026-10-04T18:58:12.222660+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

在官方全局配置里，http(s)、socks 与 mixed 被写在同一句用户验证说明中，属于并列的代理入站类型，而不是「一个是代理、另一个是控制器」。混合端口（mixed）与独立 HTTP 端口（http(s) 入站）的关系可以概括为：共享同一套访问控制与验证策略，协议表面上可以重叠，但监听彼此独立；二者都不是 `external-controller` 所代表的 REST 控制面。

## 适用条件：什么时候需要区分二者

需要区分的典型场景有三类。本地应用只能填写 HTTP 代理、不能填 SOCKS 时，独立 HTTP 入站与 mixed 都能提供 HTTP(S) 代理语义，选哪一个取决于你实际启用了哪条入站、端口填哪一个。应用只支持 SOCKS 时，独立 HTTP 端口无法替代，应使用 socks 入站或 mixed。你希望「一个端口同时给两类客户端用」时，才需要 mixed，而不是再假设独立 HTTP 端口会自动接受 SOCKS。

若配置里只启用了其中一种，就不存在「两个端口必须联动修改」的官方要求。`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 作用于代理端口这一类入口；`authentication` 与 `skip-auth-prefixes` 覆盖 http(s)/socks/mixed。运行模式 `mode`、日志级别、IPv6 开关则是全局行为，不会让 HTTP 入站「升级」成 mixed，也不会让 mixed 失去 HTTP 能力。

## 二者共享什么、不共享什么

共享的是控制策略。允许局域网、绑定地址、局域网白名单与黑名单（黑名单优先）、代理用户验证、可跳过验证的 IP 前缀，都按「代理」而不是按「某一种协议名字」来写。因此你在 mixed 上看到的本机免验证（默认 `127.0.0.1/8`、`::1/128`），在独立 HTTP 入站上通常按同一套前缀理解。把独立 HTTP 端口只开放给局域网、却指望 mixed 仍仅本机可用，需要看绑定与 allow-lan 是否真的按入站分别生效；文档在全局项里给的是统一口径，不能从这一页推出「改 HTTP 端口不会影响 mixed 的局域网策略」之类未写明的保证。

不共享的是协议表面与监听身份。mixed 在同一端口上承接 HTTP(S) 与 SOCKS；独立 HTTP 端口只承担 http(s) 这一类。客户端填错协议时，不会因为「都叫代理端口」就自动改走另一种入站。外部控制器的 `secret`、CORS、TLS API、Unix socket、namedpipe、DOH 路径也不共享给这两类入站。文档写明部分 API 路径不验证 secret，那只能说明控制面风险，不能解释成 HTTP 或 mixed 「可以免密当 API 用」。

## 判断依据与失败时下一步

判断关系是否理顺，用三列对照：协议（HTTP 或 SOCKS）、入站类型（http(s) / socks / mixed）、端口数字。应用使用 HTTP 代理且端口指向 mixed，属于混合入站覆盖 HTTP 的正当用法；应用使用 HTTP 代理且端口指向独立 HTTP 入站，属于独立端口用法；应用使用 SOCKS 却指向独立 HTTP 端口，则类型不匹配。若端口数字等于 `external-controller` 示例中的控制面监听，则既不是 mixed 也不是独立 HTTP，应立即排除。

失败时先确认配置是否同时声明了两类入站，避免把「只开了 mixed」误写成「还必须有独立 HTTP」。认证问题统一查 `authentication` 与 `skip-auth-prefixes`，不要用 API `secret` 去试。连得上但出网不符合预期，再查 `mode` 是 `rule`、`global` 还是 `direct`，并把 `log-level` 调到可观察入站的级别。局域网表现不一致时，按代理端口检查 `allow-lan` 与地址段，而不是在 mixed 与独立 HTTP 之间反复改协议名称。

资料来源：https://wiki.metacubex.one/config/general/
