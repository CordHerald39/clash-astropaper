---
title: "Clash DNS 接管与普通流量路由有什么联系"
description: "Clash DNS 接管与普通流量路由有什么联系。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.197263+00:00
modDatetime: 2026-10-04T19:22:51.197263+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

TUN 文档把 dns-hijack 描述为把匹配连接导入内部 DNS 模块，把 auto-route 描述为自动把全局流量导入 TUN 网卡。二者不是独立开关：劫持发生在流量已经被 TUN 捕获之后，因此 DNS 接管与普通流量路由通过同一套入站路径联系在一起。

## 适用条件
联系成立的前提是 tun.enable 为 true。auto-route 负责把包括 53 端口在内的流量送进网卡；dns-hijack 再在网卡上识别 any:53 或 tcp://any:53 并交给内部模块。未写协议时按 UDP 处理。strict-route 在 auto-route 开启时进一步收紧路径：Linux 上让不支持的网络不可达、把全部连接导入 TUN，从而防止泄漏并让 Android 劫持生效；Windows 上增加防火墙规则抑制多宿主 DNS 泄漏。auto-redirect（仅 Linux，且需 auto-route）用于重定向 TCP，因此 TCP DNS 也依赖这条路由链。平台例外同样约束联系：局域网 DNS 在 MacOS/Windows 无法自动劫持，Android 私人 DNS 无法劫持，此时路由即使把包送进 TUN，接管也不会发生。

## 二者如何衔接的判断依据
阅读配置时，先看 auto-route 是否为 true，再看 dns-hijack 列表是否覆盖 53 端口。只有路由把包送到 TUN，劫持列表才有机会匹配。route-address / route-exclude-address 以及 include-interface / exclude-interface 会改变哪些网段或网卡进入 TUN，从而间接决定 DNS 包是否走接管逻辑。include-uid、include-package 等过滤在 Linux/Android 上同样作用于被路由的流量，未包含的进程其 DNS 不会进入内部模块。endpoint-independent-nat、udp-timeout 影响 UDP NAT 行为，与 UDP DNS 的会话保持有关。判断“联系是否建立”的依据，是 53 端口流量是否同时满足“被 auto-route 捕获”和“被 dns-hijack 列出”。

## 配置不当或失败时的下一步
若只开 auto-route 而未写 dns-hijack，普通流量（含 IP）可进 TUN，但域名仍走系统解析，可能被全局路由切断。若只写劫持而未开 auto-route，匹配逻辑没有数据包可处理。下一步应成对检查这两个字段，并按文档启用 strict-route 以补齐 Android/Windows 上的泄漏防护。Linux 再确认 auto-redirect。防火墙未放行时 system/mixed 栈不可用，需按文档在 Windows 允许内核、在 Linux 对 TUN 出站放行。修改 route-exclude-address 或 exclude-interface 后若域名异常，应确认没有把 DNS 服务器网段排除。旧 inet4-route-address 等字段即将废弃，避免与现行 route-address 混用导致路由与劫持范围不一致。可先关 enable 恢复系统路径，再按“先路由、后劫持”的顺序逐项打开以验证联系。

https://wiki.metacubex.one/config/inbound/tun/
