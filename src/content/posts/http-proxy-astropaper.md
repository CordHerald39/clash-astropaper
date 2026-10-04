---
title: "Clash HTTP 代理监听端口提供什么服务"
description: "Clash HTTP 代理监听端口提供什么服务。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.220640+00:00
modDatetime: 2026-10-04T18:58:12.220640+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash 的 HTTP 代理监听端口提供的是入站代理服务：客户端把该地址和端口当作 HTTP 代理服务器，把请求交给内核，再按运行模式转发。它不提供网页控制台，也不提供 RESTful API。理解这一点，才能正确填写浏览器或应用，并避免把 API 端口当成“代理服务”。

## 服务范围与适用条件

官方全局配置在允许局域网一节写明：可以允许其他设备经过 Clash 的代理端口访问互联网。同页用户验证一节指出，验证作用对象是 http(s) / socks / mixed 代理。因此，HTTP 监听端口（以及 mixed 入站里兼容 HTTP 代理的部分）面向的是使用 HTTP 代理协议的程序，包括常见的 CONNECT 隧道。

适用前提是配置里确实启用了 HTTP 或 mixed 入站，并且客户端按 HTTP 代理方式连接。下列能力不由该端口提供：外部控制 API（`external-controller` 示例为 `127.0.0.1:9090`）、Unix socket 或 Windows named pipe 上的 API、`external-controller-tls`、挂在 API 上的外部用户界面（路径为 API 地址 `/ui`）、以及在 RESTful API 端口上开启的 DOH。`secret` 保护的是 API，不是 HTTP 代理；HTTP 代理是否要账号密码，只看 `authentication` 与 `skip-auth-prefixes`。

## 该端口会处理什么、不会处理什么

会处理的是到达该入站的 HTTP 代理请求。之后如何出站，由 `mode` 决定：`rule` 按规则匹配，`global` 走 GLOBAL 策略组（需在该组选择代理或策略），`direct` 全局直连。谁能连上该端口，由 `bind-address`、`allow-lan`、`lan-allowed-ips`（默认 `0.0.0.0/0` 与 `::/0`）和优先生效的 `lan-disallowed-ips` 共同约束。`ipv6` 决定内核是否接受 IPv6 流量。本机回环默认可按 `skip-auth-prefixes` 中的 `127.0.0.1/8`、`::1/128` 跳过验证。

不会处理的是：把该端口当网站在地址栏直接打开并期望看到面板；用 SOCKS 客户端去连纯 HTTP 入站（除非实际是 mixed 且客户端协议受支持）；用 API 的 CORS、`external-ui`、DOH 路径来代替代理协议。流量隧道、NTP、GEO 数据、进程匹配等全局项也不在这个端口上对外提供服务。

## 如何判断服务是否按预期提供

判断服务已提供的依据：客户端已将该主机和端口设为 HTTP 代理；来源地址符合绑定与局域网策略；需要验证时凭据正确，或来源属于跳过前缀；在 `log-level` 为 `info` 或 `debug` 时能看到入站，而不是绑定失败。

若端口能被 TCP 连上但客户端协议不是 HTTP 代理，内核不会按浏览器期望的方式工作。若只启动了外部控制而没有 HTTP/mixed 入站，则不存在这项服务。失败时不要先改 `geo-auto-update` 或 `unified-delay`：应确认入站仍在监听，且没有把 `external-controller` 或 `external-controller-tls` 填进代理设置。`mode` 为 `direct` 时，HTTP 代理入站仍然存在，只是出站直连，不能据此认为“该端口没有提供代理服务”。

https://wiki.metacubex.one/config/general/
