---
title: "Clash AAAA 记录与是否走代理有什么关系"
description: "Clash AAAA 记录与是否走代理有什么关系。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.049818+00:00
modDatetime: 2026-10-04T20:31:18.049818+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 适用条件：先分清“有没有 AAAA”和“流量是否走代理”

讨论 Clash（mihomo）里 AAAA 记录与是否走代理的关系，适用条件是：内核 DNS 已启用（`enable` 为 true），并且问题焦点是“解析出的 IPv6 地址会不会进入后续连接”，而不是代理协议本身。官方 DNS 文档管的是如何得到 A 或 AAAA、是否把结果丢掉或改写为 fake-ip，并不在 DNS 段里直接决定最终出站；但 AAAA 是否存在、是否为空、是否为 fake-ip，会决定后续有没有 IPv6 目标可走。

若 `enable` 为 false，解析改由系统 DNS 完成，下文关于空 AAAA、`disable-ipv6` 与 `fake-ip-range6` 的关系不再按内核行为解释。若只关心节点域名能不能解析，应单独看 `proxy-server-nameserver`，不要和业务域名的 AAAA 混为一谈。

## AAAA 能否出现，决定有没有 IPv6 目标

官方对 `ipv6` 的说明是：是否解析 IPv6；为 false 时回应 AAAA 的空解析。判断依据：空 AAAA 意味着客户端不会得到 IPv6 地址，后续连接只能落在 A 记录对应的 IPv4 上。此时“是否走代理”对 IPv6 路径没有可操作对象，并不是代理组拒绝了 IPv6，而是 DNS 层没有提供 AAAA。

另一条平行机制是 nameserver 附加参数 `disable-ipv6`：丢弃 AAAA 回应。它与全局 `ipv6: false` 效果都是看不到 AAAA，但作用范围不同——前者可只绑在某一上游，后者对内核 DNS 的 AAAA 一律空解析。对应的 `disable-ipv4` 丢弃 A 回应，可用来对照：若只丢 AAAA，则 IPv4 仍可按原策略连接，IPv6 因没有地址而无法进入同一条代理路径。

`enhanced-mode` 为 fake-ip 时，IPv4 映射落在 `fake-ip-range`；IPv6 映射依赖 `fake-ip-range6`。判断依据：AAAA 若被改写成该 IPv6 段内的假地址，后续连接的是映射后的目标，而不是权威 DNS 返回的真实 AAAA。未配置 `fake-ip-range6` 时，不能假定 AAAA 会像 A 记录一样得到 fake-ip。`fake-ip-filter` 与 `fake-ip-filter-mode`（blacklist / whitelist / rule）决定哪些域名不下发 fakeip 映射；规则模式下语法与路由 rules 一致，可对域名给出 fake-ip 或 real-ip。real-ip 的 AAAA 仍是真实 IPv6，是否走代理要等路由阶段根据该地址判断。

## 解析通道是否走代理，不等于业务流量是否走代理

DNS 查询自身也可以“走代理”，这与业务连接是否走代理是两件事。`respect-rules` 表示 dns 连接遵守路由规则，需配置 `proxy-server-nameserver`。官方强调：如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。`proxy-server-nameserver` 仅用于解析代理节点的域名；不填则遵循 `nameserver-policy`、`nameserver` 和 `fallback`。`proxy-server-nameserver-policy` 仅当 `proxy-server-nameserver` 不为空时生效。

对公网 DNS 还可在 URL 后用 `#` 指定代理或接口，优先使用已有代理；`#RULES` 表示遵守路由规则进行连接，等同于 `respect-rules`。判断依据：这些参数只改变“用哪条通道去问 AAAA”，不改变“问到的 AAAA 在业务连接时是否出站代理”。`direct-nameserver` 用于 direct 出口域名解析；不填则同样遵循 policy 与 nameserver/fallback。因此，即使 AAAA 是经代理问来的，业务域名仍可能被路由到 direct，反之亦然。

`fallback` 与 `fallback-filter` 会改变采用哪一份结果：geoip 开启时，非 `geoip-code` 国家的 IP 视为污染并改用 fallback；`ipcidr`、`domain` 也可强制走 fallback。AAAA 若被判污而改用另一组上游，得到的 IPv6 地址集合会变，从而间接改变后续可匹配的路由对象。`nameserver-policy` 优先于 nameserver/fallback，可按域名指定解析服务器。

失败时下一步：先用配置原文确认 AAAA 是空解析、被 `disable-ipv6` 丢弃、还是已变成 fake-ip，再去看路由；不要把“DNS 查询走了代理”写成“该域名 IPv6 业务一定走代理”。若 `respect-rules` 与 `prefer-h3` 同时出现，文档强烈不建议一起使用，应先拆开，排除解析通道自身异常后再判断 AAAA 与出站的关系。

https://wiki.metacubex.one/config/dns/
