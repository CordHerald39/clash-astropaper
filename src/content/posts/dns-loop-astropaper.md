---
title: "Clash DNS 转发环路怎样由相互引用产生"
description: "Clash DNS 转发环路怎样由相互引用产生。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.049000+00:00
modDatetime: 2026-10-04T20:31:18.049000+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

转发环路不是单独开关，而是多组服务器字段互相把“名字解析”和“连接出站”指来指去时产生的。手册用鸡蛋问题概括这一结构：经过代理做 DNS 时，必须先有不依赖这次 DNS 的节点解析手段。相互引用一旦闭合，fallback 过滤或 fake-ip 映射都不能自动拆开。

## 适用条件

讨论对象是 `nameserver`、`fallback`、`nameserver-policy`、`default-nameserver`、`proxy-server-nameserver`、`direct-nameserver` 以及 `#` 附加参数之间的引用关系。仅当 `enable` 为 true、查询由 `listen` 受理时，这些引用才会在同一进程内闭合。系统 DNS 不在本环路模型里。`respect-rules` 为 true 或上游写了 `#RULES` 时，DNS 连接遵守路由规则，引用链会把出站也算进去。手册强烈不建议将该项与 `prefer-h3` 一起使用。

## 相互引用如何闭合

第一种闭合：加密上游写成 `https://doh.pub/dns-query` 或 `https://dns.alidns.com/dns-query` 这类主机名，解析该主机名依赖 default-nameserver；若 default 未写成 IP，或 default 又指向仍需名字解析的服务器，则“上游名字”和“解析上游的上游”互相等待。第二种闭合：上游带 `#proxy` 或 `#RULES`，DNS 连接要先有可用代理；代理节点若是域名，只能由 proxy-server-nameserver 解析；该字段如果不填，则遵循 nameserver-policy、nameserver 和 fallback，而这正是正在等待代理的同一批上游。第三种闭合：proxy-server-nameserver-policy 格式同 nameserver-policy，但仅当 proxy-server-nameserver 不为空时生效，空值时政策不会单独打断引用。第四种闭合：direct-nameserver 为空则 direct 域名同样遵循上述三组；若这些组的连接又被路由到 direct，就会和出口解析互相引用。direct-nameserver-follow-policy 默认不遵守 nameserver-policy，仅当 direct-nameserver 不为空时生效，误当成默认遵守也会画错引用。第五种闭合：nameserver-policy 把某域名指向另一域名服务器，而该服务器主机名又命中同一条政策。fallback-filter 的 domain、ipcidr、geoip 只改变用哪一组结果，不提供无域名依赖的入口；其中 geosite 已废弃，不能当作断环条件。

## 判断环路是否成立与失败下一步

判断依据：从任意一条带主机名的上游出发，沿着谁解析它的名字、该解析走哪条出站、出站名字又由谁解析走一圈，若能回到起点，即由相互引用产生环路。`#` 后用 `&` 连接的 ecs、skip-cert-verify、disable-ipv4 等只改变查询内容或校验，不断开名字与出站之间的引用。失败下一步：把解析 DNS 服务器域名的 default 固定为 IP；把解析节点域名的职责单独交给 proxy-server-nameserver；不要让政策值再次写成需要同一套 DNS 才能连通的名字。不要修改 fake-ip-ttl 来打断环路，手册写明非必要勿改。未拆开引用之前，增加 fallback 条目只会复制同一闭合。

资料：https://wiki.metacubex.one/config/dns/
