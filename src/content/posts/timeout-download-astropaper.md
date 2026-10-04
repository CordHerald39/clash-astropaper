---
title: "Clash 连接超时与读取超时有什么区别"
description: "Clash 连接超时与读取超时有什么区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:33:17.932183+00:00
modDatetime: 2026-10-04T18:33:17.932183+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

《代理集合》这一页没有名为「连接超时」或「读取超时」的配置项。和时间内有关、已经写明的字段只有：`interval`（更新 provider，单位秒）、`health-check.interval`（健康检查间隔，单位秒）、`health-check.timeout`（健康检查超时，单位毫秒）。把口语里的连接超时、读取超时直接套到这些字段上，会改错对象。

## 适用条件

适用于在 `proxy-providers` 里看到 timeout、interval，或排查时有人让你区分连接超时和读取超时。本文只说明该页实际存在的时间字段管什么，以及订阅下载和节点检测是不是同一条连接。不把未出现的字段补写成官方选项。

## 页面上真正存在的时间字段

1. `interval`：多久更新一次代理集合，单位秒。示例 3600 表示间隔到期再去拉 `url`，不是「建连最多等 3600 秒」，也不是读响应体的上限。
2. `health-check.interval`：对已加载节点做延迟测试的间隔，单位秒。
3. `health-check.timeout`：一次健康检查等待多久算超时，单位毫秒。示例 5000 表示 5000 毫秒。测的是节点访问 `health-check.url`（文档推荐 Cloudflare 或 Google 的 generate_204），不是读取订阅正文。
4. `health-check.lazy`：默认 true，不使用该集合节点时不进行测试。这会让延迟结果迟迟不出现，和某一个超时数值无关。

订阅下载在本页只写了：经 `proxy` 访问 `url`，可带 `header`，可用 `size-limit` 限制文件大小（字节，0 为不限制）。没有为这一段再拆「连接超时」和「读取超时」。

## 两条连接不要混用超时一词

订阅下载：核心经过 `proxy` 去请求 `url`。这一段在本页没有对应的 timeout 字段。

健康检查：已加载节点去请求 `health-check.url`，受 `health-check.timeout`（毫秒）约束。

判断依据：字段名是 interval、单位是秒，表示「多久做一次」；字段在 health-check 下、单位是毫秒，表示单次延迟测试的等待上限。把 `health-check.timeout` 当成订阅读取超时，调大它不会改变下载 `url` 的方式。把 `interval` 当成连接超时，只会推迟下次更新。口语中的 TCP 建连超时、读 body 超时，本页没有对应项，不能写成两项官方配置。需要区分的是「更新集合的下载连接」和「节点健康检查连接」。

## 仍要对某次超时定性时下一步

先判断现象属于更新 provider 还是延迟测试。前者查 `proxy`、`url`、`header`；后者查 `health-check.enable`、检测用 `url`、`timeout` 和 `lazy`。不要在配置里新增本页不存在的连接超时或读取超时项。`path` 不在 HomeDir、未设 `SAFE_PATHS`、`size-limit` 拒文件、`age-secret-key` 解密失败，都不是上述两类超时，应单独按路径、大小和加密字段处理。

资料来源：
https://wiki.metacubex.one/config/proxy-providers/
