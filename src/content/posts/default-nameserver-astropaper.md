---
title: "Clash 引导解析与最终目标域名解析有何区别"
description: "Clash 引导解析与最终目标域名解析有何区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.041465+00:00
modDatetime: 2026-10-04T20:31:18.041465+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

引导解析和最终目标域名解析在手册里对应不同字段，不能互相替代。引导解析指：用 `default-nameserver` 去解析 DNS 服务器的域名，让上游主机名变成可建连的 IP。最终目标域名解析指：用 `nameserver`、`fallback`、`nameserver-policy` 去查询业务访问的域名。适用条件是 `dns.enable` 为 true；为 false 时两者都不按内置分层工作，而是系统 DNS。理解差异时，先问「当前要解开的名字是上游服务器，还是访问中的网站」，再选对应字段。

## 引导解析的对象是上游服务器主机名

`default-nameserver` 必须为 IP，可为加密 DNS。它不回答某个访问目标的 A 记录是什么，只回答配置中的 DNS 主机名对应哪一个 IP。判断依据有三条：列表元素是 IP；用途写明为解析 DNS 服务器域名；不把 `fallback-filter` 的污染判断套用到这一步。操作上应单独维护该列表，例如使用 `223.5.5.5` 这类 IP，避免与 `nameserver` 混写。若引导写成域名，会出现无法启动的循环。

节点侧还有 `proxy-server-nameserver`，它解析的是代理节点域名，既不是访问目标，也不是引导字段的替代品；不填则遵循 policy、nameserver 和 fallback。当 DNS 要经代理或开启 `respect-rules` 时，必须配置它以防鸡蛋问题。`proxy-server-nameserver-policy` 仅当节点解析列表非空时生效。引导与节点解析都可能涉及「域名」，但对象分别是 DNS 上游主机名和节点主机名，判断时不可合并。

## 最终目标解析的对象是访问中的域名

`nameserver` 是默认的域名解析服务器。`fallback` 是后备服务器，配置后默认启用 `fallback-filter`，`geoip-code` 默认 CN；除指定国家外的 IP 视为污染，改用 fallback。匹配 `domain` 的域名直接使用 fallback。`ipcidr` 命中的结果视为污染。`nameserver-policy` 按域名指定服务器，优先于 nameserver 与 fallback；键支持域名通配，值可以是字符串或数组。`direct-nameserver` 只服务 direct 出口；`direct-nameserver-follow-policy` 默认不遵守 policy，仅当 direct 列表非空时生效。

针对「一次查询到底走哪一层」的场景，步骤如下。先分清当前查询的是上游主机名还是访问目标；前者只看引导列表，后者先看 policy 是否命中，未命中再看 nameserver 与 fallback 的过滤条件。`geosite` 过滤已废弃，最终解析侧应改用 `nameserver-policy`。`prefer-h3` 影响 DoH 是否优先 HTTP/3，发生在最终上游建连方式上，不改变引导必须为 IP 的规则。

## 混淆两层时的判断和下一步

若访问目标解析异常，却去改 `default-nameserver` 里 IP 以外的「域名优化」，属于改错层。若上游无法建连，却去调 `fake-ip-filter`、`fallback-filter` 或 `fake-ip-ttl`，同样改错层。`enhanced-mode` 的 fake-ip 或 redir-host 决定结果如何映射到连接，发生在最终解析之后。`use-hosts` 与 `use-system-hosts` 决定是否先用 hosts，也不等于引导字段。`cache-algorithm` 只说明缓存淘汰方式。

下一步应画出依赖链：引导 IP 解开上游主机名，上游再查询目标域名；节点域名走 `proxy-server-nameserver`。任一环节写成需要 DNS 才能读懂的域名、且没有合法引导，就应回到必须为 IP 的约束。不要把两组服务器合成一列以求简化，那会抹掉手册中的对象差异。`respect-rules` 与 `prefer-h3` 不要叠用，以免把建连策略问题误判成两层解析定义本身有冲突。

https://wiki.metacubex.one/config/dns/
