---
title: "Clash 电脑端：Git 自身代理配置与终端环境有什么关系"
description: "Clash 电脑端：Git 自身代理配置与终端环境有什么关系。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:36:45.698158+00:00
modDatetime: 2026-10-04T21:36:45.698158+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 各自管哪一层

Clash 电脑端提供 http、https、socks 或 mixed 入站，负责接收已经打到代理端口的连接，再按 mode 处理。Git 自身的 `http.proxy`、`https.proxy` 以及终端里的 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY`，负责决定 Git 要不要把 HTTPS 访问送到那个入站。两套配置不在同一层：前者是服务端入站与策略，后者是客户端如何找到入站。

因此，改全局配置里的 allow-lan、bind-address 或 log-level，不会自动给 Git 写上代理。反过来，只在 Git 里填写代理，也不会改变内核的 rule、global、direct。理解关系时，把 Git 是否连入站和连入之后怎么出站分开。SSH 远程不使用 Git 的 HTTP 代理键，与终端 HTTP 环境变量也没有对应关系。终端环境属于进程继承，Git 配置属于文件作用域，Clash 入站属于内核监听；任何一层看起来已开启，都不能推出另外两层已经对接。

## 叠加时怎样判断谁说了算

Git 在配置了 `http.proxy` 或更具体的 `http.<url>.proxy` 时，优先用这些键，而不是再依赖终端变量。未配置时，不少环境会读取 `http_proxy`、`HTTP_PROXY` 等。判断依据：读取 `http.proxy` 有值，则当前 HTTPS 访问按该值走；为空则检查环境变量；环境和 Git 都为空，Git 直连，不会因为 Clash 正在运行就自动进入 mixed 入站。

若入站启用 authentication，客户端必须提供用户信息，除非源地址命中 skip-auth-prefixes。手册默认放行 `127.0.0.1/8` 与 `::1/128`。Git 配置写成回环地址时，常可免账号；写成局域网地址则要看 allow-lan 是否为 true、是否落在 lan-allowed-ips，以及是否被 lan-disallowed-ips 排除。终端变量带账号、Git 配置不带账号时，以 Git 实际采用的那一层为准，不要假设两层会合并凭据。环境变量只传给继承该会话的进程，已经启动的 Git 相关进程不会因为你后来改了 shell 变量就改用新入口。

## 和运行模式、进程匹配的关系

mode 只作用于已经进入内核的流量。Git 因自身代理或环境变量连上入站后，rule 按规则，global 走 GLOBAL，direct 全局直连。终端变量或 Git 代理都不能改 mode。find-process-mode 决定内核是否匹配进程：always 强制匹配，strict 由内核判断，off 不匹配。它影响按进程选路是否生效，并不改写 Git 的 proxy 键，也不会把直连的 Git 强行拉进代理端口。

log-level 用于观察这层关系是否成立。Git 已配置代理但日志全无连接，说明客户端没打到入站，应查 Git 与环境，而不是先改 GEO 或外部界面。silent 时看不到一般运行内容，不能用来证明关系已经接通。ipv6 关闭时，Git 走 IPv6 目标可能失败，这与代理键是否存在仍是两件事。接口的 secret、CORS 或 Unix socket 只约束 API 访问，不参与 Git 客户端如何选择代理。

## 关系判断失败时的下一步

若 Git 配置与环境变量同时存在且指向不同地址，先以带 `--show-origin` 的读取结果为准，再决定删哪一层，避免两套入口互相掩盖。若 Git 显示已用代理但内核日志没有请求，检查地址是否指向当前 Clash 入站、authentication 是否拒绝、bind-address 是否把该地址排除在外。

不要用改 external-controller 或 secret 来同步 Git 代理，接口密钥与 Git 客户端代理无关。也不要用 unified-delay、tcp-concurrent 解释 Git 有没有走代理，它们不负责选择入口。确认分层后再改其中一层，才能判断是客户端没连上，还是入站之后的 mode 不符合预期。若本机前缀本应命中 skip-auth-prefixes 却仍要求账号，应先核对该连接是否真的来自回环，而不是在 Git 和环境两处同时加凭据。

参考资料：
https://wiki.metacubex.one/config/general/
