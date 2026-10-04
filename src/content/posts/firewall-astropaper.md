---
title: "Clash 防火墙放行与允许局域网分别负责什么"
description: "Clash 防火墙放行与允许局域网分别负责什么。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.224654+00:00
modDatetime: 2026-10-04T18:58:12.224654+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

在官方全局配置里，“允许局域网”是一项有明确语义的开关，而“防火墙放行”并不是同一页上的配置键。手册写明：`allow-lan` 表示是否允许其他设备经过 Clash 的代理端口访问互联网，取值为 `true` 或 `false`。配套项是 `bind-address`（绑定全部地址或单个 IPv4/IPv6）、`lan-allowed-ips`（允许连接的 IP 地址段，仅当 `allow-lan` 为 `true` 时生效，默认 `0.0.0.0/0` 与 `::/0`）、`lan-disallowed-ips`（禁止连接的地址段，黑名单优先级高于白名单，默认空）。把二者当成同一个开关，会把系统层拦截和内核入站策略混在一次修改里，无法判断到底是谁拒绝了连接。

## 允许局域网负责的是代理端口入站，而不是出站策略

适用条件是：需要决定“非本机设备能不能使用 http(s)/socks/mixed 代理端口”。判断依据只看 `allow-lan` 及其绑定、名单，不看 `mode`。`mode` 默认为 `rule`，也可为 `global` 或 `direct`，描述的是规则匹配、全局代理或全局直连，并不打开局域网入站。即使策略组工作正常，`allow-lan` 为 `false` 时，其他设备仍不能经代理端口访问互联网。

操作上应把“允许局域网”理解成内核是否接受来自其他设备的代理入站：`bind-address: "*"` 表示绑定所有 IP；写成单一地址则只有该地址可被访问。白名单限制哪些来源在 `allow-lan` 为 `true` 时被接受，黑名单可单独剔除。失败时下一步：若目标是“仅本机使用代理”，应保持 `allow-lan` 为 `false`，而不是去改 `interface-name`；若目标是“局域网其他设备可用”，必须先使 `allow-lan` 为 `true`，再检查绑定与名单。`interface-name` 与 `routing-mark` 描述出站接口和 Linux 出站标记，职责不在入站放行。

## 与允许局域网相邻、但仍属 Clash 自身的访问控制

适用条件是：`allow-lan` 已打开，仍要限制谁能用代理端口。官方还给出用户验证：`authentication` 为 http(s)/socks/mixed 代理配置用户；`skip-auth-prefixes` 设置允许跳过验证的 IP 段。这是代理协议层的口令控制，不是操作系统防火墙规则，也不是 GEO 或规则集合。判断依据是：名单拒绝发生在来源地址匹配 `lan-disallowed-ips` 或不在 `lan-allowed-ips` 时；认证拒绝发生在未提供用户口令且来源不在跳过前缀中时。两者可以同时存在，需要分别核对。

还须与外部控制分开。`external-controller` 是 RESTful API 监听地址，文档说明可把 `127.0.0.1` 改成 `0.0.0.0` 以监听所有 IP；另有 Unix socket、Windows named pipe、TLS API 等。API 是否对局域网开放，与代理端口的 `allow-lan` 不是同一职责。`secret` 是 API 访问密钥。失败时下一步：不要用开放 API 来“代替”允许局域网，也不要把仪表板路径 `external-ui` 当成防火墙放行。若只有控制页面能打开而代理端口不能用，应回到 `allow-lan` 与绑定地址，而不是增加 `external-controller-cors`。

## 官方页未定义的系统防火墙放行应单独看待

适用条件是：Clash 配置里已经允许该来源使用代理端口，但操作系统仍可能拦截进程入站或特定端口。该全局配置页没有给出系统防火墙的放行清单、方向或配置键，因此不能把 `allow-lan: true` 解释成“系统防火墙已放行”。判断依据是分层：Clash 负责是否在绑定地址上接受代理连接、是否用白名单/黑名单/认证过滤来源；系统防火墙负责主机是否允许该进程收包。缺一层都会表现为“连不上”，但修改对象不同。

`ipv6` 只说明是否允许内核接受 IPv6 流量，默认 `true`，不是防火墙策略名。`find-process-mode` 控制是否匹配进程，默认 `strict`，路由器上推荐 `off`，用于规则侧进程识别，不是系统防火墙例外。`log-level` 只影响控制台和控制页面输出，不能把日志级别当成放行开关。失败时下一步：先用文档中的 `allow-lan`、`bind-address`、两份 IP 名单和 `authentication` 确认内核侧应当接受该来源；若配置已允许而连接仍被拒，再去核对该页未涵盖的系统层过滤。不要把 TCP Keep Alive、统一延迟、TCP 并发、GEO 加载模式等全局项解释成防火墙放行或允许局域网的替代实现。

资料：https://wiki.metacubex.one/config/general/
