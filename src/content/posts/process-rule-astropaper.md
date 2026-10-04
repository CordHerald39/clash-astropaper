---
title: "Clash 电脑端：进程名称和域名规则针对的是不同对象吗"
description: "Clash 电脑端：进程名称和域名规则针对的是不同对象吗。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.053510+00:00
modDatetime: 2026-10-04T20:31:18.053510+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 进程名称规则与域名规则各自匹配什么

Clash（mihomo）里，`PROCESS-NAME`、`PROCESS-NAME-WILDCARD`、`PROCESS-NAME-REGEX` 的官方定义是使用进程或进程名称的通配、正则来匹配；与之并列的 `PROCESS-PATH` 匹配的是完整进程路径，属于进程侧的另一类对象。域名一侧则完全不同：`DOMAIN` 匹配完整域名，`DOMAIN-SUFFIX` 匹配域名后缀，`DOMAIN-KEYWORD` 是域名关键字匹配，`DOMAIN-WILDCARD` 是域名通配符匹配，`DOMAIN-REGEX` 是域名正则，`GEOSITE` 匹配 Geosite 内的域名。

因此，进程名称规则与域名规则针对的不是同一类匹配对象。前者比较发起请求的进程名，后者比较请求中的域名。`PROCESS-NAME,chrome.exe,PROXY` 不会因为访问了某个主机名而自动成立；`DOMAIN-SUFFIX,google.com,auto` 也不会因为进程叫 `chrome.exe` 而成立。官方示例里进程名是 `curl`、`chrome.exe`，域名示例是 `ad.com`、`google.com` 等，两类 payload 不能互换。电脑端讨论进程名时，不要把 Android 平台可以匹配包名的说明套到域名对象上。

适用条件：需要判断为什么写了进程名仍然按域名走，或为什么写了域名却想用进程名拦住时，应先承认它们是不同维度，而不是同一条件的两种写法。

## 同一请求上两者如何同时存在

一次请求可以同时带有域名和发起进程。规则按从上到下的顺序匹配，列表顶部优先级更高。若域名规则写在进程名称规则前面且已经命中，进程名称不会再被看到；反过来也一样。这不能证明两类规则匹配了同一对象，只证明先命中的那一类对象满足了条件。`MATCH` 匹配所有请求、无需条件，既不区分进程也不区分域名。

逻辑规则可以把不同类型的 payload 组合在同一行，官方形式为 `LOGIC_TYPE,((payload1),(payload2)),Proxy`，示例为 `AND,((DOMAIN,baidu.com),(NETWORK,UDP)),DIRECT`。因此，若既要限制进程名又要限制域名，应使用带括号的逻辑规则把两类对象写在一起，而不是指望 `PROCESS-NAME` 去读域名，或指望 `DOMAIN` 去读进程名。`RULE-SET` 引用规则集合，集合内容仍按各自类型比较，不会把进程名变成域名。

通配符形态相似也不等于对象相同：`DOMAIN-WILDCARD` 与 `PROCESS-NAME-WILDCARD` 都只支持 `*` 和 `?`，且都注明与配置文件其他地方的 Clash 格式通配符不相同；即便通配符写法接近，匹配对象仍然分别是域名和进程名。目标 IP 类规则以及 `no-resolve`、`src` 也不参与进程名或域名对象的定义。

## 判断依据与失败时下一步

判断依据：能指出该行 payload 属于进程名还是域名；能解释同一请求上这两个对象可以同时存在，但单条非逻辑规则只比较其中一类；从顶部起第一条命中规则的类型与预期维度一致。

若进程名称规则从未生效，下一步先看上方是否已有 `DOMAIN`、`DOMAIN-SUFFIX` 或 `GEOSITE` 命中，而不是把进程名改成域名后缀。若域名规则从未生效，不要改成 `PROCESS-NAME`。需要两个条件同时成立时，改写成带括号的 `AND`，分别填入进程名称类型与域名类型。类型写对但仍不命中时，再检查进程名是否应为 `chrome.exe` 这种进程对象、域名是否应为完整名或后缀，以及 `MATCH` 是否过早出现。回答「是不是同一对象」时，也不要把 `PROCESS-PATH` 与 `PROCESS-NAME` 混为一谈：完整进程路径是进程侧的另一类对象，同样不是域名。

https://wiki.metacubex.one/config/rules/
