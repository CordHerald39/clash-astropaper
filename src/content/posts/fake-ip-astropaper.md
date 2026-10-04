---
title: "Clash fake-ip 地址为什么不是网站真实出口地址"
description: "Clash fake-ip 地址为什么不是网站真实出口地址。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.042998+00:00
modDatetime: 2026-10-04T20:31:18.042998+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash 在 fake-ip 模式下返回的地址不是网站的真实出口地址，也不是服务器公网 IP。它是内核按 fake-ip-range 即时合成的映射，目的是让应用立刻获得一个可连接的目标，真实解析与出站选择在 Clash 内部完成。因此在应用界面、ping 或部分系统工具里看到的 IP 不能用来判断地理位置或真实路径。

## 合成地址的产生条件
enhanced-mode 必须为 fake-ip，dns.enable 为 true。此时 DNS 响应不再等待上游 nameserver 返回真实结果，而是直接从 fake-ip-range（文档示例 198.18.0.1/16）或 fake-ip-range6 中分配。TUN 的默认 IPv4 地址也参考同一前缀。判断依据是：客户端看到的目的 IP 落在该保留网段，而网站实际可能位于完全不同的自治域。redir-host 模式才会把真实解析结果交给应用，两者不可混为一谈。适用场景是需要降低解析等待、并配合透明代理做连接劫持。

## 真实解析仍在内部进行
nameserver、fallback、nameserver-policy 以及 proxy-server-nameserver 仍然负责查询真实记录，结果用于规则匹配和选择出站。fallback-filter 通过 geoip、ipcidr、domain 等条件判断是否采用 fallback 结果，这些真实 IP 默认不会返回给应用，除非该域名命中 fake-ip-filter。filter-mode 为 blacklist、whitelist 或 rule 时，只有被排除的查询才会看到真实地址。因此应用层显示的 IP 与最终出口节点或 DIRECT 目标没有对应关系。

## 验证方法与配置偏差时的处理
若需要确认某站是否被合成，可对比 Clash DNS 的应答与指向公共 DNS 的查询。失败情况包括：应用要求真实 IP 才能工作（证书固定、P2P、部分游戏），或 filter 书写错误导致该站被排除/未排除。下一步将该域名按文档语法加入 fake-ip-filter，或整体改回 redir-host。同时检查 use-hosts、use-system-hosts 是否覆盖了结果。文档提醒不要把 fake-ip 网段挪作他用，也不要随意改 fake-ip-ttl。查看内核连接信息时，应用侧目的是合成地址，实际 remote 才是规则决定的真实目标或节点地址。

参考资料：https://wiki.metacubex.one/config/dns/
