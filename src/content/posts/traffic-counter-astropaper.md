---
title: "Clash 客户端流量统计为什么不等于订阅账单"
description: "Clash 客户端流量统计为什么不等于订阅账单。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.195270+00:00
modDatetime: 2026-10-04T19:22:51.195270+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash 客户端里看到的流量统计，与订阅服务商账单不是同一套计量。官方全局配置从未定义套餐用量字段，也没有要求内核计数与远端节点账单一致。客户端数字反映的是本进程按当前配置处理过的数据；账单通常只统计到达其节点、并按其规则认定的转发量。两者起点、边界和采样对象都不同，不相等是预期现象，不必先假设客户端损坏。

## 客户端口径覆盖内核处理范围而不是节点侧结算

适用条件是你使用这份全局配置运行内核，并且账单来自订阅提供方。`mode` 为 `rule` 时，直连或未匹配的连接不会送进订阅节点，但本机网卡或内核入站仍可能被客户端统计看见；`direct` 更不会在节点侧产生账单；`global` 则依赖 GLOBAL 策略组实际选中的出口，选到直连时两端会分叉。`allow-lan` 打开后，其他设备经代理端口产生的转发会计入客户端，这些连接有没有真正打到该服务商节点，才决定账单是否出现对应项。判断依据：先记录当前 `mode` 与局域网开关，再问这笔流量有没有离开本机、进入该订阅的代理。

## 保活、并发、双栈和资料下载会单边推高某一端

`keep-alive-interval` 与 `keep-alive-idle` 产生的 Keep Alive 包在客户端长连接上可见，服务商是否把探测计费取决于其实现，配置并不保证两边一致。`tcp-concurrent` 对 DNS 得到的全部 IP 并发连接，失败的握手可能只出现在客户端统计。`ipv6` 默认允许 IPv6，双栈重复尝试会让本地计数大于远端单一协议账单。`geo-auto-update` 配合 `geox-url` 从外部地址拉取 geoip、geosite、mmdb、asn，下载使用 `global-ua`（默认 `clash.meta`）且受 `etag-support` 影响；这类更新常常走直连或非订阅出口，于是客户端有、账单无。`unified-delay` 只为消除握手造成的延迟差异而计算 RTT，不是对账开关。`profile` 下 `store-selected`、`store-fake-ip` 保存策略选择和 Fake-IP 映射，映射本身不是计费字节。

## 控制面和出站接口只能用来缩小差异

`external-controller`、`external-ui`、CORS、DOH 路径以及 Unix socket、Windows named pipe 的 API 访问会在本机产生流量；文档写明部分入口不验证 `secret`，被轮询时客户端数字会涨，订阅账单通常不会认这笔。`interface-name` 指定出站网卡，`routing-mark` 在 Linux 上标记出站，走错接口时客户端仍有尝试量，节点账单没有对应会话。`find-process-mode` 只影响能否匹配进程，不改变远端是否计费。

具体操作：在同一时间窗口记录 `mode`、`allow-lan`、`ipv6`、`geo-auto-update`、`tcp-concurrent` 和 Keep Alive 相关项，把局域网和其他设备排除后再对比账单周期。判断依据是只有经所选代理组到达该服务商节点的载荷才可能进入账单，其余都应视为客户端单边计数。若缩小范围后仍差距很大，下一步应向订阅方确认其计量起点（是否含握手、是否含 UDP、按节点还是按套餐聚合），并查阅规则与 DNS 等本页未给出的路径，而不是要求内核统计改写成账单格式。

参考资料：https://wiki.metacubex.one/config/general/
