---
title: "Clash DoT 与 DoH 的传输方式有何不同"
description: "Clash DoT 与 DoH 的传输方式有何不同。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.043795+00:00
modDatetime: 2026-10-04T20:31:18.043795+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 适用条件

比较 Clash 配置里 DoT 与 DoH 时，只依据手册给出的 URI 方案和与传输相关的开关。DoH 在示例中以 HTTPS 查询路径出现在 `nameserver`、`nameserver-policy` 等位置；DoT 在示例中以 `tls://` 出现在 `fallback` 等位置。`prefer-h3` 的说明是 DoH 优先使用 HTTP/3；附加参数 `h3` 的说明是强制 HTTP/3 建立 DoH 连接，使用前需确保 DoH 服务器支持 HTTP/3。这两项不能用来描述 DoT。

比较前确认 `dns.enable` 为 true，否则实际使用系统 DNS，讨论两种加密传输没有配置对象。`default-nameserver` 用于解析 DNS 服务器域名，必须为 IP，可为加密 DNS，它对两种方案在“先解析服务器主机名”这一点上是共用前提，并不等于把 DoT 改成了 DoH。

## 传输方式上的差别

DoH 走 HTTPS 查询路径：条目以 HTTPS 方案书写，可选让 DoH 优先或强制 HTTP/3。`prefer-h3` 是全局优先；`h3` 写在具体条目的 `#` 参数里，与 `prefer-h3` 不冲突，填写后强制启用 HTTP/3。判断当前 DoH 是否在抢 HTTP/3，依据就是这两处是否开启。

DoT 走 TLS 封装的查询：条目以 `tls://` 开头。手册没有为 DoT 提供与 `h3` 对等的 HTTP 版本开关。证书方面，两种发向公网的加密 DNS 都可以追加 `skip-cert-verify`（跳过 TLS 证书验证）和 `name-cert-verify`（只改证书 DNSName 校验目标，不改 SNI）。因此“有 TLS 证书参数”不能单独用来区分 DoT 还是 DoH，必须先看方案前缀。

连接编排可以相同：用 `#` 指定代理或接口，不存在该代理则用接口；`#RULES` 等同 `respect-rules`。经代理查询都应配置 `proxy-server-nameserver` 以防鸡蛋问题。这些是查询如何出门，不是 DoT 与 DoH 的传输封装本身。`fallback-filter`、`nameserver-policy` 决定用哪一组服务器的结果；`listen` 只作用于本机 DNS 服务（udp、tcp），也不改变上游封装。

## 判断依据与配错时下一步

区分依据：HTTPS 方案为 DoH，并可叠加 HTTP/3 相关项；`tls://` 为 DoT，不应填写 `h3` 来“升级”。同一列表可以混写不同方案，例如默认 `nameserver` 用 DoH、`fallback` 用 DoT，这只说明职责分工，不意味着传输变成同一种。

若把 DoT 写成 HTTPS 方案或把 DoH 写成 `tls://`，下一步是按目标协议改方案前缀，而不是只改未被手册记载的端口文字。若 DoH 强制 `h3` 后无法建立连接，先确认服务器是否支持 HTTP/3，再决定去掉强制项或关闭不合适的 `prefer-h3`；文档强烈不建议 `respect-rules` 与 `prefer-h3` 一起使用。证书报错时，按条目记录 DNSName 与 SNI 是否被 `name-cert-verify` 分离处理，不要把跳过校验当成传输协议切换。`disable-ipv4`、`disable-ipv6`、`disable-qtype-<int>` 只丢弃特定回应，不改变 DoT/DoH 封装。`fallback-lazy-query` 只改变何时发起后备查询，同样不改变传输方式。

参考资料：https://wiki.metacubex.one/config/dns/
