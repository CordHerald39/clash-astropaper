---
title: "Clash 连接记录与网页是否成功加载有什么关系"
description: "Clash 连接记录与网页是否成功加载有什么关系。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.193694+00:00
modDatetime: 2026-10-04T19:22:51.193694+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash 的连接记录表示内核接住并处理过一次入站会话，网页是否成功加载还取决于出站是否真正完成、DNS 与 Fake-IP 映射是否一致、以及浏览器是否在代理端口之外另走开连接。官方全局配置没有把“页面渲染成功”写成连接列表的判定条件。二者相关，但不能互相替代：有记录可以说明请求进入了 Clash，无记录不能证明页面失败一定发生在策略上；记录成功也不等于浏览器已经拿到完整文档和子资源。

## 适用条件：记录只覆盖进入内核的那一段

只有走代理端口、且通过局域网与验证约束的流量，才会成为可观察的连接。`allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 决定其他设备能否进入；`authentication` 与 `skip-auth-prefixes` 决定 http(s)/socks/mixed 是否在验证阶段结束。未进入内核的直连、或浏览器扩展绕过代理的请求，页面可能失败或成功，连接记录都不会出现。

`mode` 改变记录与页面结果的对应关系。`rule` 下页面成败取决于规则把主机名或 IP 送到哪一个出站；`global` 下取决于 GLOBAL 策略组当前选择；`direct` 下内核按全局直连处理，页面成败更多反映本机路由与 `interface-name`、`routing-mark`（Linux 出站标记）。把三种模式的记录拿来对比同一网址，没有意义。

判断依据：先问这条记录的来源地址是否本机、是否应走代理。来源不对或验证失败，记录与网页加载无关。来源正确且模式符合预期，再看出站侧配置。

## 出站尝试成功不等于页面加载完成

`tcp-concurrent` 为 true 时，内核使用 DNS 解析出的所有 IP 发起连接，并采用第一个成功的连接。连接记录上可能出现对多个地址的尝试；其中一次成功只说明某个 IP 的 TCP 打通，不保证 HTTP 状态、证书校验或页面所需的其余主机名都成功。`unified-delay` 开启时会计算 RTT，用来消除握手造成的延迟差异，它影响延迟展示，不是“页面已打开”的判据。

`ipv6` 为 false 时内核不接受 IPv6 流量。若页面走 IPv6 而该项关闭，连接记录可能没有对应条目，浏览器侧却显示加载失败。`interface-name` 指错网卡，或 Linux 上 `routing-mark` 与系统策略冲突时，记录可显示已出站，数据包却出不了预期接口，页面仍失败。`keep-alive-interval`、`keep-alive-idle`、`disable-keep-alive`（Android 上后者强制为 true）影响连接保活，超时断开可能让后续子资源失败，而首条记录仍显示曾经建立。

`profile.store-fake-ip` 为 true 时会储存 Fake-IP 映射，域名再次连接使用原有映射地址。映射仍在但实际解析或站点 IP 已变时，连接记录看起来“打到了老地址”，页面则可能证书不符或内容不对。这是记录与加载脱节的典型配置原因，不是列表刷新故障。

## 日志级别如何辅助判断以及失败后的下一步

`log-level` 只在控制台和控制页面输出。要判断“有连接记录但页面空白”时，`silent`/`error` 往往不够；`info` 提供一般运行内容，`debug` 尽可能给出全部信息。日志里若只有入站、没有出站错误，应检查模式与接口；若有验证或局域网拒绝，页面失败发生在进入规则之前。`find-process-mode` 为 `off` 时不匹配进程，不能用“哪个应用打开的页面”去对齐记录。`external-controller` 未监听或 `secret`、TLS、CORS 不正确，控制页面上的记录会缺失，此时更不能用空记录推断页面未加载。

失败时下一步：固定 `mode` 后只打开该页面，确认请求进入代理端口；对照记录中的目标与 `tcp-concurrent` 可能产生的多地址尝试；IPv6 站点检查 `ipv6`；核对 `interface-name`/`routing-mark`；若使用 Fake-IP，考虑 `store-fake-ip` 中的旧映射。将 `log-level` 提到 `info` 或 `debug`，区分入站拒绝、出站接口错误和握手失败。页面成功但记录没有，优先查是否绕过代理，而不是增加规则数量。

资料：https://wiki.metacubex.one/config/general/
