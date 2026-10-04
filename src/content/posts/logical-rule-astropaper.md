---
title: "Clash 与、或、非在规则组合中分别表示什么"
description: "Clash 与、或、非在规则组合中分别表示什么。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:02:29.339766+00:00
modDatetime: 2026-10-04T21:02:29.339766+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 适用条件：只解释规则组合里的三种逻辑类型

在路由规则中，与、或、非分别对应 `AND`、`OR`、`NOT` 三种 `LOGIC_TYPE`。适用条件是：你在 `rules` 里书写逻辑规则，并采用手册形态 `LOGIC_TYPE,((payload1),(payload2)),Proxy`。payload1、payload2 为规则类型和其他 payload，例如 `DOMAIN,google.com`。它们只决定**当前这一条**是否命中，并不改写整份列表从上到下匹配、顶部优先级更高的总原则。手册强调逻辑规则需要注意括号。`MATCH` 匹配所有请求且无需条件，因此它不是与、或、非中的任何一种。`SUB-RULE` 匹配至子规则，`RULE-SET` 引用规则集合，二者也不是这三种逻辑类型的别名。

## 与、或、非分别表示什么

与对应 `AND`：括号内列出的条件必须同时成立，本条才采用后面的出站。官方例子 `AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT` 表示完整域名为 `baidu.com`，并且 `NETWORK` 为 UDP，才直连。缺任意一个子条件，本条不命中，匹配继续向下。因此它用来收紧命中面。

或对应 `OR`：括号内条件有一个成立即可采用本条出站。官方例子 `OR,((NETWORK,UDP),(DOMAIN,baidu.com)),REJECT` 表示网络为 UDP，或者完整域名为 `baidu.com`，就拒绝。两个子条件都成立时，仍然只命中这一次，不会拆成两条规则执行。`OR` 用来放宽命中面，但不会因此获得比它更靠上的规则更高的优先级；优先级仍由它在列表中的位置决定。

非对应 `NOT`：对括号内条件取反后再决定是否命中。官方例子 `NOT,((DOMAIN,baidu.com)),PROXY` 表示当“完整域名是 baidu.com”不成立时，本条命中并走 `PROXY`；该域名成立时，本条不命中。`NOT` 并不等于改成拒绝，行末写什么出站就用什么出站。括号不能省略，也不能把 `NOT` 直接接在没有规则类型的字符串前面。

子条件可以使用手册中的其他类型，如 `DOMAIN-SUFFIX`、`DOMAIN-KEYWORD`、`IP-CIDR`、`GEOIP`、`DST-PORT`、`PROCESS-NAME`、`IN-TYPE` 等，但每个子条件必须自身合法。通配限制属于子条件层：`DOMAIN-WILDCARD` 等仅支持 `*` 和 `?`，且与配置文件其他地方的 Clash 格式通配符不相同。外层是 `AND` 还是 `OR`，都不会取消这些限制。

## 判断依据与失败时下一步

判断使用是否正确，看关键字是否恰好为三种之一、括号是否把每个 payload 成组包裹、每个 payload 能否还原成独立规则、出站是否写在逻辑结构之后。把多个域名只用逗号罗列却不写类型，不符合手册。把 `AND` 理解成“两条规则都执行一遍”也不符合：命中后采用的是本行出站，随后不再继续匹配。

失败时下一步：命中过多，检查是否误用 `OR` 或过宽的 `NOT`。命中过少，检查是否误用 `AND`，或子条件用了过严的 `DOMAIN` 而实际情况更接近 `DOMAIN-SUFFIX`。括号与示例不一致时，用上述三行官方写法逐字符对齐。逻辑本身成立但流量落到 `MATCH,auto` 时，按优先级把该条上移。子条件若是目标 IP 类，再核对手册：`no-resolve` 仅用于目标 IP 规则；更早触发的 DNS 解析仍可能让其后带 `no-resolve` 的规则匹配。需要引用集合或进入子规则时，分别改用 `RULE-SET`（需配置 `rule-providers`）和 `SUB-RULE`，不要继续堆与或非。

资料来源：https://wiki.metacubex.one/config/rules/
