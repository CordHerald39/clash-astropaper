---
title: "Clash 上游 DNS 列表为什么不是节点列表"
description: "Clash 上游 DNS 列表为什么不是节点列表。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.035453+00:00
modDatetime: 2026-10-04T20:31:18.035453+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash（mihomo）里的上游 DNS 列表回答向哪台解析器查询域名记录，出站节点列表回答流量从哪条代理离开。二者在官方配置中分属不同段落与字段。把节点名填进 `nameserver`，或把 DNS 地址当成节点，都会弄错职责。

## 适用条件

当阅读 `dns` 段并疑问这些条目是不是节点时适用。前提是 `enable` 为 `true`；为 `false` 则使用系统 DNS，DNS 列表不工作，更不能代替节点。`listen` 只是 DNS 服务监听，支持 udp、tcp，不是把节点列表映射成解析器的开关。

`default-nameserver` 必须为 IP，用于解析 DNS 服务器的域名，不能填写节点标识来带解析器上线。讨论列表性质时，还应把 `nameserver-policy` 的键（域名通配或 geosite）和值（解析服务器）分开，键从来不是出站节点集合。

## 官方如何分开两类对象

`nameserver` 是默认的域名解析服务器。`fallback` 是后备域名解析服务器，一般情况下使用境外 DNS，保证结果可信。条目是 DNS 地址，并可对公网 DNS 使用 `#` 附加参数、`&` 连接参数。这些字段描述的是查询记录时问谁，而不是流量出口选哪条代理。

节点域名被单独处理：`proxy-server-nameserver` 为代理节点域名解析服务器，仅用于解析代理节点的域名，如果不填则遵循 `nameserver-policy`、`nameserver` 和 `fallback`。`proxy-server-nameserver-policy` 格式同 `nameserver-policy`，仅用于节点域名解析，当且仅当 `proxy-server-nameserver` 不为空时生效。可见节点是被解析的名字，不是 `nameserver` 数组里的解析器。

`direct-nameserver` 用于 direct 出口域名解析，同样不是 direct 节点清单。`direct-nameserver-follow-policy` 控制是否遵循 `nameserver-policy`，默认为不遵守，仅当 `direct-nameserver` 不为空时生效。

附加参数可以指定代理或接口进行 DNS 连接：优先使用已有代理，如果不存在该名称的代理则指定接口连接。`#RULES` 等同于 `respect-rules`。代理名出现在 `#` 之后，只表示这条 DNS 查询怎么出站，并不把该代理变成 DNS 服务器。如需经过代理查询，应配置 `proxy-server-nameserver`，以防出现鸡蛋问题。也就是必须先能解析节点域名，DNS 查询才能走代理，不能把节点列表与上游列表合成一份。`respect-rules` 让 dns 连接遵守路由规则，同样要求单独配置 `proxy-server-nameserver`，并强烈不建议和 `prefer-h3` 一起使用。

## 混用时的判断依据与下一步

场景：配置里把某个代理名称写进 `nameserver`，或把加密 DNS 写进节点字段，导致解析或出站异常。

步骤一，看该字符串出现的段落。若在 dns 下的 `nameserver`、`fallback`、`default-nameserver`、政策的值、`proxy-server-nameserver`、`direct-nameserver` 中，它应是 DNS 服务器地址。步骤二，节点应出现在出站代理等配置中，而不是靠 `nameserver` 数组表达。步骤三，若只是希望 DNS 查询走某代理，应使用附加参数引用已有代理名，并保证 `proxy-server-nameserver` 能解析该节点域名。

判断依据：DNS 列表的值应能作为解析服务器（含加密 DNS）；`default-nameserver` 必须是 IP；政策的键是域名匹配而不是节点匹配；`#` 后的代理名只改变 DNS 连接路径。失败时下一步把业务域名解析留在 `nameserver`、`fallback` 或政策，把节点域名解析放到 `proxy-server-nameserver` 体系，把出站路径留给代理配置。不要在 `nameserver` 里堆节点名称。说明见官方 DNS 配置。

参考资料：https://wiki.metacubex.one/config/dns/
