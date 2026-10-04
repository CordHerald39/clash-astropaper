---
title: "Clash fake-ip 过滤与域名直连规则有什么区别"
description: "Clash fake-ip 过滤与域名直连规则有什么区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.046625+00:00
modDatetime: 2026-10-04T20:31:18.046625+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

fake-ip 过滤与域名直连规则作用于 DNS 解析阶段和流量路由阶段，二者不可互相替代。本节仅根据官方 DNS 配置文档说明它们的适用条件、判断依据、具体差异以及混淆时的处理步骤，不涉及规则集编写以外的内容。

## 作用层级与生效前提不同
fake-ip-filter 属于 dns 节点，仅在 enhanced-mode 为 fake-ip 且 enable 为 true 时生效。它决定某个域名是否被分配来自 fake-ip-range 的虚假地址用于连接。文档原句为“以下地址不会下发 fakeip 映射用于连接”。域名直连则属于路由规则（rules）范畴，通过 DOMAIN、DOMAIN-SUFFIX 等匹配后选择 DIRECT 出站。即使规则让连接直连，若 DNS 已返回 fake-ip，后续流量仍可能基于虚假地址进行。适用条件是同时启用了 fake-ip 模式和路由规则的场景。判断二者是否被混淆的依据是：连接已经匹配 DIRECT 但目标仍使用 198.18.0.0/16 一类地址，说明过滤未排除该域名。

respect-rules 为 true 时 DNS 查询会遵守路由规则，此时两层会耦合，必须配置 proxy-server-nameserver 避免循环。未开启 respect-rules 时两层完全独立，过滤只影响返回的 IP 类型，直连规则只影响出站选择。

## 匹配语法与默认行为的差异
fake-ip-filter 在 blacklist 模式（默认）下匹配即不下发 fake-ip；whitelist 模式则相反，只有匹配才下发 fake-ip。rule 模式改用与路由完全相同的语法，支持 RULE-SET（behavior 须为 domain 或 classical）、GEOSITE、DOMAIN*、MATCH，并自上而下执行。路由规则同样自上而下，但动作是选择代理组或 DIRECT/REJECT，而不是选择 fake-ip 或 real-ip。因此同一条 DOMAIN-SUFFIX 写在过滤里和写在 rules 里意义不同：前者改变 DNS 应答内容，后者改变数据包出口。

nameserver-policy、fallback-filter 的 domain 列表只影响用哪组 DNS 服务器，不决定是否 fake-ip。direct-nameserver 只为 DIRECT 出口提供解析服务器，也不等同于过滤。use-hosts 与 use-system-hosts 会在 DNS 阶段直接回应，可能让某些名称既不走过滤也不走规则。判断时若名称已在 hosts 中却仍出现 fake-ip，说明过滤范围未覆盖。

## 混淆后的核对步骤与失败处理
操作上先完整读取 dns 块，确认 enhanced-mode、fake-ip-filter-mode 以及 filter 列表，再读取 rules 中所有 DOMAIN 类条目。若目标在规则中为 DIRECT 但 DNS 日志或连接显示虚假地址，即可判定过滤未包含该名称。rule 模式下过滤列表最后一项必须明确 fake-ip 或 real-ip，缺省会导致默认行为与直连规则预期冲突。proxy-server-nameserver-policy 仅处理节点域名，与普通域名直连无关。

若两者同时配置后行为仍异常，下一步将 fake-ip-filter-mode 改为 rule，把需要真实 IP 的域名写成 DOMAIN,xxx,real-ip，把其余写成 MATCH,fake-ip，与路由中的 DIRECT 条目逐条对照。也可临时关闭 respect-rules 观察 DNS 是否恢复独立。fake-ip-ttl、prefer-h3 等项与区别无关，不必调整。所有对比均基于官方对 fake-ip-filter 与 DNS 其他字段的定义。

https://wiki.metacubex.one/config/dns/
