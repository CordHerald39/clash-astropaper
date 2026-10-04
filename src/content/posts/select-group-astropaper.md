---
title: "Clash 策略组选择与规则命中怎样衔接"
description: "Clash 策略组选择与规则命中怎样衔接。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:02:29.338345+00:00
modDatetime: 2026-10-04T21:02:29.338345+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

规则命中的结果是一个策略名，策略组用同样的 name 接住这个名字，再按 type 和成员列表落到具体出站。衔接点是名字，不是客户端菜单。代理组文档给出的是承接这一侧：如何定义组、如何把选择继续传给 proxies 或集合中的节点。下面只说明组一侧怎样与命中结果对齐，以及哪些字段会在中途改写衔接。

## 适用条件：衔接成立的前提是名字对得上

name 必须存在；含特殊符号时应当使用引号包裹。type 必须存在。缺少这两项，规则即使写出一个字符串，也无法对应到组。proxies 可引入出站代理或其他策略组，因此衔接可以是「命中的名字 → 组 → 另一组 → 节点」的链条，而不是单跳。

use 引入代理集合。include-all 引入所有出站代理以及代理集合，顺序按名称排序；include-all-proxies 只引入全部出站代理；include-all-providers 只引入全部代理集合，并会使「引入代理集合」失效。这些引入都不包含策略组，策略组只能出现在 proxies 里。判断依据：命中得到的策略名能否在 proxy-groups 中找到同名项；若该项的当前选择仍是另一个组名，衔接尚未结束。

## 选择如何从组传到节点

对手动选择组而言，当前选中项必须来自组内有效成员。default-selected 给出默认节点，为空或不存在时使用组中第一个节点。这是尚未另行选择时，名字被命中后的落地规则。empty-fallback 在组为空时生效，只能填 proxy 名称，不能填代理组，默认 COMPATIBLE。此时名字已经衔接到组，实际出站却是回退 proxy，衔接在空组成员处被改写。

filter、exclude-filter 作用于引入集合以及引入所有出站代理，可用关键词或正则，多段正则用反引号区分。exclude-type 只作用于引入出站代理，用 | 分割、无视大小写。命中组名之后，真实可选集合可能已被这三项裁剪。阅读衔接关系时，要把裁剪后的名单当成下一跳候选，而不能把配置里曾经出现过的节点名都当成仍可衔接的出口。

## 不参与命名衔接的字段和失败时下一步

url、interval、lazy、timeout、max-failed-times、expected-status 描述健康检查。url 只检查 proxies 中的代理，不检查 use 引入的集合；lazy 默认为 true，未选择到当前策略组时不测试。它们不改变 name 匹配，也不把命中结果改写到别的组。disable-udp 禁用该组 UDP，使 UDP 无法按该组选择衔接到节点能力。hidden 与 icon 只通过 api 影响展示。组上的 interface-name 与 routing-mark 已弃用，出站接口与标记应看节点配置，优先级为代理节点大于代理策略大于全局。

失败时下一步：从命中得到的策略字符串出发，在 proxy-groups 里找 name；核对 type 与引号；沿 proxies 嵌套继续找，直到当前选择不再是组名；用 filter、exclude-filter、exclude-type 核对成员是否被裁掉；组空则核对 empty-fallback 是否为 proxy。不要把健康检查失败解释成没有衔接到该组。若只有 UDP 无效果，先看 disable-udp，再确认被选中的到底是节点还是另一层组。

https://wiki.metacubex.one/config/proxy-groups/
