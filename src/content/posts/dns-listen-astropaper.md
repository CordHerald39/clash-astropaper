---
title: "Clash DNS 监听入口与上游 DNS 服务器有何区别"
description: "Clash DNS 监听入口与上游 DNS 服务器有何区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.203657+00:00
modDatetime: 2026-10-04T19:22:51.203657+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

Clash（mihomo）配置里，DNS「监听入口」和「上游 DNS 服务器」处在查询路径的两端。手册把入口写成 `listen`：DNS 服务监听，支持 UDP 与 TCP。上游则是 Clash 在收到查询之后，向外部或指定服务器再去解析时使用的一组字段，包括 `nameserver`、`fallback`、`default-nameserver`、`nameserver-policy`、`proxy-server-nameserver`、`direct-nameserver` 等。前者回答「谁可以把查询打进 Clash、打到哪个地址端口」；后者回答「Clash 作为解析转发者时问谁、按什么策略问」。

## 适用条件：什么时候必须把两者分开

当你要让本机或局域网把 DNS 指向 Clash 时，关心的是 `listen` 是否启用、绑在哪。手册对 `enable` 的说明是：如为 `false`，则使用系统 DNS 解析。此时没有「Clash 提供的监听入口」这一层，系统解析也不会因为填写了 `nameserver` 就自动出现一个本地端口。

当你要控制解析结果来自哪家服务器、是否走加密 DNS、节点域名由谁解析、直连域名由谁解析时，关心的是上游字段。`nameserver` 是默认的域名解析服务器；`fallback` 是后备域名解析服务器，手册写明一般情况下使用境外 DNS，保证结果可信，并在配置 fallback 后默认启用 `fallback-filter`。这些改动不改变 `listen` 上的套接字。

两者同时存在才构成完整链路：客户端 → `listen` → Clash 内部策略 → 某一类 nameserver。只配上游、不启用监听，外部客户端没有入口；只开监听、上游不可用，入口能接通但得不到预期记录。`enhanced-mode` 的 `fake-ip` / `redir-host` 作用在应答生成，既不是监听地址，也不是上游 URL。

## 字段对照与判断依据

`listen` 的值是本机绑定，例如 `0.0.0.0:1053`。判断它是否为入口的依据：该地址端口应出现在客户端的 DNS 设置中，查询报文的目的地址是运行 Clash 的主机。它不需要是公网 DNS IP，也不用来「解析 DNS 服务器的域名」。

`default-nameserver` 手册定义为默认 DNS，用于解析 DNS 服务器的域名，必须为 IP，可为加密 DNS。它解决的是上游主机名怎么变成 IP，例如 DoH 域名本身要先被解析。判断依据：它不接收终端用户的查询，终端也不应把系统 DNS 写成 `default-nameserver` 里的地址来「代替 listen」。

`nameserver` 与 `fallback` 面向普通域名查询。`nameserver-policy` 指定域名查询的解析服务器，可使用 geosite，优先于 `nameserver`/`fallback`。`proxy-server-nameserver` 仅用于解析代理节点的域名，不填则遵循 policy、nameserver 和 fallback；手册强调如需经过代理查询应配置该项，以防鸡蛋问题。`direct-nameserver` 用于 direct 出口域名解析，不填同样回退到上述配置；`direct-nameserver-follow-policy` 控制是否遵循 `nameserver-policy`，且仅当 `direct-nameserver` 不为空时生效。

判断「当前问题在入口还是上游」的依据：客户端连不上配置中的 IP 与端口，或 `enable` 为 false——入口侧；客户端已打到监听，但记录来源、污染过滤、节点域名失败——上游侧。`fallback-filter` 的 geoip、ipcidr、domain 等只筛选采用哪次上游结果，不会在本机多开一个监听端口。手册还提到 `geosite` 字段已废弃，请使用 `nameserver-policy`，这同样属于上游策略而非入口。

附加参数用 `#` 加在发向公网的 DNS 服务器上，例如指定代理或接口、`ecs`、`h3`。这些修饰的是上游连接怎么建立，不是 `listen` 的绑定参数。`respect-rules` 表示 dns 连接遵守路由规则，需配置 `proxy-server-nameserver`，手册强烈不建议和 `prefer-h3` 一起使用。这也是上游出站行为。

## 操作建议与失败时下一步

需要提供本地 DNS 服务时：设置 `enable` 为 true，把 `listen` 写成客户端能够访问的地址与端口，并把客户端 DNS 指向该入口。需要改解析来源时：保持 `listen` 不动，改 `nameserver`、`fallback` 或 `nameserver-policy`。需要解析节点域名且可能走代理时：单独配置 `proxy-server-nameserver`，不要把节点域名解析寄托在「监听端口是否打开」上。

若改了 `nameserver` 却没有任何程序能连上 Clash DNS，下一步检查 `enable` 与 `listen`，确认客户端指向的是监听地址而不是上游 IP。若监听正常但结果不可信，下一步按手册检查是否应配置 `fallback` 及其 `fallback-filter`，而不是更换 `listen` 端口。若仅节点连不上、普通域名正常，下一步核对该节点是否应走 `proxy-server-nameserver` 或 `proxy-server-nameserver-policy`。若 direct 出口解析不符合预期，检查 `direct-nameserver` 是否为空（空则遵循 nameserver 那一套）以及 `direct-nameserver-follow-policy`。入口与上游改错对象时，停止在同一字段上反复加减服务器列表，先用「报文目的地是不是 listen」把问题分侧。

https://wiki.metacubex.one/config/dns/
