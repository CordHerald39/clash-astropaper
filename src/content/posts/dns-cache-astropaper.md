---
title: "Clash DNS 缓存为什么会影响短时间对照"
description: "Clash DNS 缓存为什么会影响短时间对照。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.046625+00:00
modDatetime: 2026-10-04T20:31:18.046625+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 短时间对照依赖每次都重新解析

要把两次查询当成对照，必须假设第二次仍然访问了 `nameserver` 或 `fallback`。Clash DNS 配置里明确有 `cache-algorithm`，可选 `lru`（默认，Least Recently Used）和 `arc`（Adaptive Replacement Cache）。只要 `dns.enable` 为 `true`，解析结果就存在被算法保留的路径。短间隔内第二次查询完全可能直接命中缓存，于是改了上游、结果却一样，比较的是缓存副本，不是两次独立解析。

`enhanced-mode` 为 `fake-ip` 时还有返回寿命：`fake-ip-ttl` 配置 fake-ip 查询返回的 TTL。文档写明非必要不要修改。TTL 会让客户端在寿命内继续使用已有映射，短时间差异被抹平。默认 `redir-host` 没有这项 TTL，但缓存算法仍然存在，短时间对照同样不能当成干净实验。`enable` 为 `false` 时使用系统 DNS，讨论的是系统侧缓存，不再是 Clash 的 `cache-algorithm`。

## 哪些机制会和缓存一起造成马上对照没差异

必须把时间因素和其他结果不变原因拆开，否则会误把策略当成缓存。

hosts 短路：`use-hosts`、`use-system-hosts` 默认 `true`，命中即回应，与淘汰算法无关，但短时间对照同样不变。判断依据是该域名是否存在静态 hosts 记录。

策略优先：`nameserver-policy` 先于 `nameserver`/`fallback`。对照默认上游、域名却一直走 policy，两次一致是分流结果。

过滤选择：启用 `fallback` 后默认启用 `fallback-filter`。`geoip`、`geoip-code`（默认 `CN`）、`ipcidr`、`domain` 决定采用哪边结果；`geosite` 已废弃。过滤是条件分支，不是按时间过期。

独立通道：`proxy-server-nameserver` 只解析节点域名，`direct-nameserver` 只解析 direct 出口。混用两类域名做短时间对照，结论无效。

懒查询：`fallback-lazy-query` 默认 `false`；为 `true` 时先看 nameserver 是否满足过滤再决定是否查 fallback。它改变查询次数，不是缓存寿命，但会让两次对照的网络行为不一致。

判断依据：同一域名、同一通道、hosts 未命中、policy 未改写，并且间隔短于可预期的缓存保留期时，才把结果相同归因为缓存影响了对照。

## 原理对实验设计的约束

文档没有给出 lru 或 arc 的固定清空秒数，也没有要求把 `fake-ip-ttl` 改成最小值。因此不能从官方资料推出等若干秒必定未命中。正确约束是：承认缓存会占用一段时间窗口，把对照改成配置冻结后再拉开时间；不要把改 TTL 或改算法当作实验手段。

`ipv6` 为 `false` 时 AAAA 为空解析，拿 IPv6 地址做短时间对照没有内容可比较。`fake-ip-filter-mode` 为 `blacklist`、`whitelist` 或 `rule` 时，是否下发 fake-ip 由过滤决定，变的是映射策略。这些都会在数秒内造成没差异或有差异，但原因不是缓存。

若实验必须在极短时间内完成，解析结果就不适合作为唯一对照指标。应改为直接核对：测试域名是否被 policy 覆盖、`default-nameserver` 是否为 IP、`enable` 是否为 `true`。存在 `cache-algorithm` 的前提下，短时间结果相同不能单独证明新配置未工作，结果不同也不能单独证明缓存已失效，因为过滤和独立 DNS 通道同样能在瞬时改变应答。

## 按原理排除失败解释

当短时间对照无法解释现象时，下一步不是继续加密集查询，而是把假设分成三类分别证伪：时间类（算法缓存、fake-ip TTL）、优先级类（policy、hosts、节点或 direct 通道）、过滤类（fallback-filter、fake-ip-filter、附加参数丢弃记录）。只有时间类成立时，才需要把对照改成长间隔；优先级类和过滤类应改配置字段，等待不能修复。`respect-rules` 会让 DNS 连接遵守路由，且需配置 `proxy-server-nameserver`，强烈不建议与 `prefer-h3` 同用，这属于路径问题，也不属于缓存寿命。

资料来源：https://wiki.metacubex.one/config/dns/
