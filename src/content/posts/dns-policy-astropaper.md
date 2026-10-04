---
title: "Clash DNS policy 与代理分流规则各决定什么"
description: "Clash DNS policy 与代理分流规则各决定什么。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.044424+00:00
modDatetime: 2026-10-04T20:31:18.044424+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash 的 DNS policy 与代理分流规则分别决定两件不同的事：前者决定“这个域名的资源记录向哪一台解析服务器查询”，后者决定“这条连接从哪一条出站转发”。把两套配置当成同一张表来改，会出现解析问了 A 上游、连接却从 B 出站，或者 DNS 查询自己到不了上游的情况。官方在 DNS 配置里用 `nameserver-policy`、`nameserver`、`fallback` 描述解析服务器选择，用 `respect-rules` 把 DNS 查询连接重新交给路由规则，并用 `proxy-server-nameserver` 切断循环依赖。理解边界后，才能判断问题该改 DNS 段还是路由段。

## DNS policy 决定什么

在 `dns.enable` 为 true 时，DNS policy 决定查询发往哪组服务器以及如何筛选结果。`nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，优先于 `nameserver` 与 `fallback`；键支持域名通配，值支持字符串或数组。未命中策略时使用 `nameserver`。配置 `fallback` 后，`fallback-filter` 决定何时采用后备结果或只使用后备解析：`geoip` 与 `geoip-code` 按国家判断结果是否视为污染；`ipcidr` 把特定网段结果视为污染；`domain` 把名单内域名视为已污染，匹配后直接使用 `fallback`、不去使用 `nameserver`。`fallback-filter` 中的 `geosite` 已废弃，官方要求改用 `nameserver-policy`。`default-nameserver` 只用于解析 DNS 服务器的域名，必须为 IP。`proxy-server-nameserver` 仅用于解析代理节点的域名；不填则遵循 `nameserver-policy`、`nameserver` 和 `fallback`。`proxy-server-nameserver-policy` 格式同 `nameserver-policy`，当且仅当 `proxy-server-nameserver` 不为空时生效。`direct-nameserver` 用于 `direct` 出口域名解析；`direct-nameserver-follow-policy` 默认不遵守 `nameserver-policy`，仅当 `direct-nameserver` 非空时生效。`enhanced-mode` 的 fake-ip 或 redir-host、以及 `fake-ip-filter` 等，影响返回给客户端的地址形态，仍属于 DNS 处理，不等于选定出站代理。

## 代理分流规则决定什么

代理分流规则决定流量的出站，对象是已经形成的连接，包括应用访问目标站点的连接，以及在开启 `respect-rules` 之后 Clash 访问 DNS 上游的连接。`respect-rules` 表示 DNS 连接遵守路由规则，此时需配置 `proxy-server-nameserver`。文档强烈不建议其与 `prefer-h3` 一起使用。向公网 DNS 使用附加参数时，`#RULES` 为遵守路由规则进行连接，等同于 `respect-rules`；也可指定已有代理名，不存在该名称则指定接口连接。如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题：查询上游要先连代理，解析代理域名又要先查询上游。分流规则不负责从 `nameserver` 列表里挑选哪一台服务器，也不替代 `nameserver-policy` 的键匹配。即使路由把某域名定为 `direct` 或某代理组，解析仍按 DNS 字段进行，除非直连路径启用了独立的 `direct-nameserver` 逻辑。

## 适用边界、判断依据与失败下一步

适用条件是需要同时解释“解析向谁问”和“连接从哪走”的配置，尤其是同一域名先解析再连接的路径。判断依据：只改路由规则不会改变 `nameserver-policy` 是否命中；只改 DNS 上游也不会改变应用连接的出站，除非 DNS 查询连接本身因 `respect-rules` 或 `#proxy` 进入路由。直连出站的域名解析是否跟随 `nameserver-policy`，取决于 `direct-nameserver` 是否非空以及 follow-policy。节点域名是否走专用上游，取决于 `proxy-server-nameserver` 是否填写。`fallback-filter.domain` 改变的是用不用 `fallback`，不是分流出站。

失败时下一步：解析结果来源不对，先查 `enable`、`nameserver-policy` 与 `fallback-filter`，不要在路由里重复实现选上游。连接出站不对，查路由规则，不要继续追加 nameserver。DNS 上游连不上，检查是否缺少 `proxy-server-nameserver`，以及 `respect-rules` 是否与 `prefer-h3` 同时开启。需要按域名固定上游时使用 `nameserver-policy`，不要继续堆积已废弃的 `fallback-filter.geosite`。两套规则只有在 DNS 查询连接这一环通过 `respect-rules` 或附加参数耦合，其余阶段应分开维护。

资料：https://wiki.metacubex.one/config/dns/
