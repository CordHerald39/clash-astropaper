---
title: "Clash hosts 映射为什么不能替代所有 DNS 规则"
description: "Clash hosts 映射为什么不能替代所有 DNS 规则。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.045603+00:00
modDatetime: 2026-10-04T20:31:18.045603+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

静态 hosts 只回答「这个已知主机名直接回应哪个 IP」。Clash DNS 还要选择上游、判断结果是否污染、决定是否下发 fake-ip、单独解析节点域名，以及查询连接是否遵守路由。官方文档用多组字段描述这些能力，对象和触发条件都与 `use-hosts`、`use-system-hosts` 不同，因此不能用一份映射替代所有 DNS 规则。

## hosts 实际能覆盖的范围

`use-hosts` 的含义是是否回应配置中的 hosts，默认 true；`use-system-hosts` 是是否查询系统 hosts，默认 true。二者只决定：DNS 模块处理查询时，要不要用本地已有记录作答。

适合用 hosts 的判断依据：主机名稳定、IP 稳定、不需要按域名选择不同上游、不需要用 geoip 或 ipcidr 判断结果是否污染。超出这个范围，就必须使用文档中的其他字段。

`enable` 为 false 时使用系统 DNS 解析。此时 Clash DNS 规则未启用，讨论「用 hosts 替代这些规则」没有意义。

## 不能替代的规则分别做什么

上游选择无法用 hosts 表达。`nameserver` 是默认的域名解析服务器；`fallback` 是后备服务器，文档写明一般情况下使用境外 DNS，保证结果可信。`nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，优先于 nameserver/fallback，键支持域名通配。hosts 给不出「这一组域名去 DoH、另一组去 tls」这种结构。把名字都写成静态 IP，等于放弃按域名选择上游。

污染与结果筛选也无法替代。配置 fallback 后默认启用 `fallback-filter`，`geoip-code` 为 cn。启用 geoip 时，除 geoip-code 对应国家的 IP 外，其他 IP 结果会被视为污染；匹配 domain 列表的域名会只使用 fallback 解析。`ipcidr` 中的网段结果同样视为污染。geosite 字段已废弃，文档要求改用 nameserver-policy。这些规则处理的是「结果是否可信、采用哪一次应答」，hosts 没有等价判断。

fake-ip 与真实 IP 的分流是另一套匹配。`enhanced-mode` 可选 fake-ip 或 redir-host。`fake-ip-filter` 让部分地址不下发 fakeip；`fake-ip-filter-mode` 可为 blacklist、whitelist 或 rule。rule 模式下与路由 rules 匹配逻辑一致，支持 GEOSITE、RuleSet、DOMAIN*、MATCH，并指定 fake-ip 或 real-ip。hosts 不能承担「哪些域名发假 IP、哪些发真 IP」。

节点与 direct 有专用解析链。`proxy-server-nameserver` 仅用于解析代理节点的域名，不填则遵循 nameserver-policy、nameserver 和 fallback。`proxy-server-nameserver-policy` 当且仅当 proxy-server-nameserver 不为空时生效。`direct-nameserver` 用于 direct 出口域名解析；`direct-nameserver-follow-policy` 控制是否遵循 nameserver-policy。节点 IP 变化或出现鸡蛋问题时，静态表接不住这条策略。文档在为公网 DNS 指定代理时也提示：如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。

查询如何发出同样不属于 hosts。`respect-rules` 表示 dns 连接遵守路由规则，需配置 proxy-server-nameserver。附加参数还可指定代理或接口、ecs、h3、skip-cert-verify、disable-ipv4、disable-ipv6 等。`default-nameserver` 必须为 IP，用于解析 DNS 服务器的域名，这是解析链的前提，不能改成业务 hosts 了事。

`fallback-lazy-query` 默认 false；为 true 时会先判断 nameserver 的结果是否满足 fallback-filter 再发起查询。这是规则层时序，hosts 没有对应项。

## 误把规则写成映射时如何处理

判断依据：大量业务名被写成静态 IP 后，目标一变就要手工改表；或同一名字在不同出口、不同污染条件下需要不同结果，而 hosts 只能给一个地址。节点无法解析、fallback 从未被使用、fake-ip 过滤不再起作用、DoH 服务器域名自己解析不了，都说明被替代的是不该替代的规则。

下一步是把静态映射收回到少数确定不变的主机名，其余交还 `nameserver-policy`、`nameserver`、`fallback`、`fake-ip-filter` 和节点专用 nameserver。需要遵守路由发 DNS 时，按文档配置 `proxy-server-nameserver`，不要指望 hosts 解决鸡蛋问题。`prefer-h3` 与 `respect-rules` 强烈不建议一起使用，这属于 DNS 连接方式，同样超出 hosts 能力。

https://wiki.metacubex.one/config/dns/
