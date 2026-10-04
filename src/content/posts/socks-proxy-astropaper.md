---
title: "Clash SOCKS 与 HTTP 代理入口有什么不同"
description: "Clash SOCKS 与 HTTP 代理入口有什么不同。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.221669+00:00
modDatetime: 2026-10-04T18:58:12.221669+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 适用条件：比较的是入口访问层，而不是出站协议名

讨论 Clash 的 SOCKS 与 HTTP 代理入口有何不同，应限制在官方全局配置实际写到的范围：二者都是可供其他应用连接的代理端口类型，并且与 mixed 一起共用同一套局域网访问、绑定地址和用户验证。文档在「用户验证」中明确写的是 http(s) / socks / mixed 代理，而不是为 SOCKS 单独列一套 allow-lan。运行模式、日志、IPv6、进程匹配等则作用于内核整体，不会因为应用选了 SOCKS 或 HTTP 就自动切换。

适用场景是：在应用里选择「HTTP 代理」或「SOCKS 代理」去对接 Clash、以及看到配置里同时出现多种入口时，判断哪些项必须成对修改、哪些项其实是共用的。若问题出在规则命中或 GLOBAL 策略组，那是 `mode` 的范畴，不能当成两种入口语法不同。

## 文档中二者相同的部分与判断依据

`allow-lan` 控制是否允许其他设备经过 Clash 的代理端口访问互联网，对入口类型没有写成「仅 HTTP」或「仅 SOCKS」。判断依据：局域网设备连不上时，应先看该项与 `bind-address`，而不是先猜测 HTTP 与 SOCKS 哪一个没开放局域网。

`bind-address` 决定其他设备通过哪个地址访问，`"*"` 绑定全部地址，也可绑定单个 IPv4 或 IPv6。`lan-allowed-ips` 仅在允许局域网为 true 时生效，默认包含 `0.0.0.0/0` 与 `::/0`；`lan-disallowed-ips` 黑名单优先。判断依据：源 IP 被拒，对 HTTP 与 SOCKS 是同一套地址策略。

`authentication` 与 `skip-auth-prefixes` 同样作用于 http(s)/socks/mixed。验证列表为 `user:pass`；跳过验证前缀文档示例为 `127.0.0.1/8` 与 `::1/128`。判断依据：不能认为「HTTP 要账号、SOCKS 一定不要」，也不能认为 mixed 使用另一套口令。应用源地址是否落在跳过前缀，才决定要不要在应用里填写用户名。

`ipv6` 控制内核是否接受 IPv6 流量，默认 true，并不按入口协议拆分。`mode` 为 rule、global 或 direct，默认规则模式；global 还需要在 GLOBAL 策略组选择代理。判断依据：应用已连上入口后仍全部直连或全部走代理，应查运行模式，而不是比较 SOCKS 与 HTTP 谁「更全局」。

## 文档中能区分的点、操作建议与失败下一步

能区分的第一点是入口种类本身：全局配置把验证对象写成 http(s)、socks 与 mixed 三类并列，说明 mixed 是单独一类入口，而不是「SOCKS 的别名」。操作上，应用若只支持其中一种协议，应连接到对应种类的代理端口；种类选错时，即使用对了绑定地址和账号，握手仍会失败。第二点是外部控制端口不是上述任一种代理入口：`external-controller` 等用于 RESTful API，文档示例地址与代理端口不是同一概念。判断依据：能打开 API 或外部用户界面，只能证明控制端口可达，不能证明 HTTP 或 SOCKS 代理入口可用。

填写应用时的步骤可以固定为：先确认 `allow-lan` 与 `bind-address` 是否覆盖该应用所在主机 → 再确认该应用源 IP 是否需要 `authentication` → 再在应用里选择与入口种类一致的协议（HTTP 或 SOCKS，而不是把 mixed 理解成某一种协议的自动检测说明）→ 最后确认 `mode` 符合预期。失败时，用 `log-level` 的 error/info/debug 在控制台或控制页面区分：地址/名单拒绝、验证失败、连到 API 端口，还是运行模式导致「能连上入口但出站不符合预期」。不要把 API 的 `secret` 当成 SOCKS 用户名，也不要为两种入口分别发明两套 bind-address。

https://wiki.metacubex.one/config/general/
