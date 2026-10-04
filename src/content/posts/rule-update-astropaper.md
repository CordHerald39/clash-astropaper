---
title: "Clash 远程规则更新为什么会改变本地分流"
description: "Clash 远程规则更新为什么会改变本地分流。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:02:29.336776+00:00
modDatetime: 2026-10-04T21:02:29.336776+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 适用条件：远程规则与本地分流的关系

本地 `rules` 列表看起来没改几行，但远程规则集合更新后，部分请求改走了不同策略，这种情形适用本节。官方对 `RULE-SET` 的定义是引用规则集合，需配置 rule-providers。引用关系意味着：本地行只固定用哪一个集合、命中后去哪个策略；集合当时提供的内容来自 rule-providers。远程内容一变，同一行 `RULE-SET,providername,proxy` 比较的范围就变了，本地分流结果随之变。这不是 `MATCH` 自己改了条件，`MATCH` 仍匹配所有请求、无需条件。

不要把原因理解成本地 `DOMAIN` 行的 payload 被远程改写了。`DOMAIN`、`DOMAIN-SUFFIX` 写在 `rules` 里时，匹配对象就是本行给出的域名。`GEOSITE` 匹配 Geosite 内的域名，本页把它列为独立规则类型，与 `RULE-SET` 引用规则集合不是同一写法。解释远程更新为何改变本地分流时，应先看列表里有没有 `RULE-SET`。进程路径、进程名以及 `UID` 都不是这条引用机制。

## 引用集合如何在不改本地行字面量的情况下改变命中

规则将按照从上到下的顺序匹配，列表顶部的规则优先级更高。远程集合扩大后，若 `RULE-SET` 位于列表较上位置，许多原先要落到后面 `DOMAIN-SUFFIX`、`GEOIP` 或 `MATCH` 的请求，会提前被该行的策略接走。集合缩小后则相反：原先被该引用命中的请求会继续往下，可能命中更靠后的 `GEOSITE,youtube,PROXY`、`GEOIP,CN,DIRECT` 或最终 `MATCH,auto`。本地分流变了，是因为第一条命中规则变了，不是因为优先级算法变了。

逻辑规则会放大这种影响。官方形式为 `LOGIC_TYPE,((payload1),(payload2)),Proxy`，示例为 `AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT`，需要注意括号。若逻辑条件与集合引用写在一起，远程变更会改变整组是否成立。`SUB-RULE` 把匹配转到子规则，子规则里的 `RULE-SET` 同样是引用。如请求为 UDP，而代理节点没有 UDP 支持，会继续向下匹配：远程更新后若该集合改指向无 UDP 的节点，请求会跳过该策略继续往下，表现为分流又变了一次。

`no-resolve` 与 `src` 仅支持关于目标 IP 的规则，不能解释远程集合更新为何改变以域名为主的分流。`DOMAIN-WILDCARD` 与进程通配符都只支持 `*` 和 `?`，且与配置文件其他地方的 Clash 格式通配符不相同，它们也不是 `RULE-SET` 的引用关系。

## 判断依据与失败时下一步

判断依据：本地存在 `RULE-SET,providername,策略`；变化发生在该行可能命中的那些请求上；列表顺序未改而命中面改变，符合引用的集合内容变了。

若本地没有任何 `RULE-SET`，不要把原因归到远程规则集合；下一步改检查是否改动了 `GEOSITE`、`GEOIP` 分类名或域名行本身。若有多条 `RULE-SET`，指出是哪一个 `providername` 导致第一条命中前移或后移。失败时不要在本页发明定时拉取字段来关闭远程影响；能做的是调整该 `RULE-SET` 与更精确 `DOMAIN` 的上下关系，或暂时不引用该 `providername`。解释原因时用整段 `rules` 对照，避免只改策略名、不看引用名。

https://wiki.metacubex.one/config/rules/
