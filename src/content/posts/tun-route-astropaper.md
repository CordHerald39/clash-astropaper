---
title: "Clash 路由决定去向与代理规则决定策略有何区别"
description: "Clash 路由决定去向与代理规则决定策略有何区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.197263+00:00
modDatetime: 2026-10-04T19:22:51.197263+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

在 Clash TUN 场景里，自动路由相关字段决定的是流量会不会被导向 tun 这块虚拟网卡（去向），这与流量进入 Clash 之后由代理规则匹配出站策略不是同一层机制。官方 TUN 文档只描述如何捕获和重定向到 tun，不描述规则集如何选节点；阅读时把两层分开，才能避免改错位置。

## 适用条件

讨论“路由决定去向”仅在 tun.enable 为 true 且 auto-route 为 true 时有意义，因为此时才会自动设置全局路由、把流量导入 tun 网卡。route-address、route-exclude-address、include-interface、exclude-interface、uid/mac/Android 包名过滤，都是在这一层决定哪些包去向 tun、哪些绕过。auto-redirect、route-address-set、strict-route 同样作用于“是否到达 tun”，并且有 Linux、nftables、与 routing-mark 冲突等限制。代理规则决定策略发生在流量已经进入入站之后，不属于本页字段的职责。未启用 auto-route 时，这些去向控制不会按文档描述生效。

## 去向如何被 TUN 字段决定

auto-route 为 true 时，文档的表述是自动将全局流量路由进入 tun 网卡，这就是系统/防火墙层面的去向。route-address 改为只把列出的网段导向 tun，而不是默认全局。route-exclude-address 让列出的网段不去向 tun（示例含 192.168.0.0/16）。include-interface 只让指定接口的流量去向 tun，exclude-interface 则排除接口，二者不可共存。Linux 的 include-uid、include-mac-address 以及 Android 的 include-package 进一步限制来源，未匹配的流量根本不会进入 tun。strict-route 强化去向：Linux 将所有连接路由到 tun。route-address-set 把规则集 CIDR 加入防火墙，不匹配的流量绕过路由，仍是去向问题。这些步骤只回答“包会不会进 tun”，不回答进 tun 以后走哪条代理。

## 判断两层区别的依据

若只改 route-exclude-address、exclude-interface 或对应 include/exclude 列表，改变的是哪些流量被导向 tun，局域网或特定设备可能完全不进入 Clash。若 route-address-set 生效，防火墙在更早阶段就让流量绕过，Clash 内部规则不会见到这些包。auto-detect-interface、device、stack、dns-hijack、mtu 等影响进入 tun 之后的处理或出口网卡，但文档仍把它们放在 TUN 入站下，属于捕获路径的一部分。文档明确 route-address-set 与任意配置中的 routing-mark 冲突，说明这是路由/防火墙标记层面，而不是策略组选择。因此：TUN 自动路由决定去向（进不进 tun），代理规则决定策略（进了以后 DIRECT 还是某个出站）。本页没有给出规则语法，不能把两者当成同一套配置。

## 失败时下一步

如果本意是让局域网或某接口直连、根本不进 tun，应调整 route-exclude-address、exclude-interface、exclude-mac-address 或 exclude-package，而不是指望尚未进入 tun 的流量被代理规则匹配为直连。如果流量该进 tun 却没有，按文档检查 auto-route、strict-route、auto-redirect、防火墙放行（Windows 允许内核、Linux 放行 TUN 出站）以及 address-set 是否把目标绕过。不要在 tun 段寻找代理组或规则字段。Linux 核对 iproute2-table-index 与 rule-index 默认值。确认平台限制（macOS 的 utun、Android 私人 DNS）后，只改 tun 去向相关项做对比，避免与策略层同时修改导致无法判断。

https://wiki.metacubex.one/config/inbound/tun/
