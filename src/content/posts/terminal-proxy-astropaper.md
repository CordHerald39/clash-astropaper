---
title: "Clash 电脑端：环境变量代理与系统代理有什么区别"
description: "Clash 电脑端：环境变量代理与系统代理有什么区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:36:45.694867+00:00
modDatetime: 2026-10-04T21:36:45.694867+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 概念边界：内核提供入站，不提供两条开关

比较环境变量代理与系统代理时，先看全局配置实际写了什么。该页描述的是内核如何监听入站、如何被外部 API 控制、如何匹配进程，并没有把这两种客户端通道定义成可以互相替换的配置项。内核侧与“谁能连上代理端口”直接相关的字段是 allow-lan、bind-address、authentication、skip-auth-prefixes、lan-allowed-ips、lan-disallowed-ips，以及 http(s)/socks/mixed 入站。文档另外提到环境变量 SAFE_PATHS，只用于外部用户界面路径是否落在安全范围内，语法同 PATH：Windows 用分号，其他系统用冒号。SAFE_PATHS 与流量是否走代理无关。因此二者的区别应理解成：谁把连接送到同一入站，而不是配置里有没有同名开关。

## 作用范围与判断依据

环境变量代理的作用域是单个进程及其子进程。终端里出现的变量不会自动改写浏览器，也不会改写 allow-lan。若变量指向的主机不在 bind-address 的监听范围内，或未携带 authentication 要求的 user:pass，且源地址不在 skip-auth-prefixes 的 127.0.0.1/8、::1/128 之列，该进程连入站会失败。系统代理的作用域是操作系统为图形程序或部分库提供的代理设置；浏览器可能读取系统代理，也可能只读取扩展里的静态地址。两条通道都只是客户端如何找到入站的不同办法，真正监听仍由 bind-address 决定，是否对其他设备开放由 allow-lan 决定。find-process-mode 为 always、strict、off 时，改变的是内核是否按进程做规则匹配：always 强制匹配所有进程，off 推荐在路由器上关闭匹配。它既不能开启系统代理，也不能写入环境变量。mode 为 rule、global、direct 决定连上入站之后如何选路：direct 会使两条通道都表现为已经连接却按直连处理；global 还要求 GLOBAL 策略组选出代理。把 127.0.0.1:9090 或 namedpipe、Unix socket 配进任一通道，都只是在访问 external-controller，需要 secret，不是在使用 mixed 入站。

判断当前走的是哪一条通道，依据是发起连接的进程环境或系统设置是否指向当前绑定，以及日志里是否出现对应入站，而不是依据策略组名称是否被选中。

## 选错通道时的处理顺序

某一通道失败时，先把 log-level 设为 info 或 debug，确认内核是否收到该进程的入站。没有记录说明客户端没找到当前绑定地址，应检查变量或系统代理里的主机是否过期，而不是改 geodata-mode。有记录但认证失败，应对照 authentication 与 skip-auth-prefixes，而不是切换 find-process-mode。有记录且已入站但结果像直连，应读 mode 是否为 direct。allow-lan 为 false 时，系统代理若把其他设备指过来必然失败，这与本机环境变量指向回环的成败不能互相证明。lan-disallowed-ips 优先于白名单，两条通道只要落到禁止段就会被拒。ipv6 为 false 时，通道中只应保留 IPv4 入站地址。处理时一次只改一个通道，保留另一个作为对照。SAFE_PATHS 报错只与外部 UI 路径有关，不要当成代理通道故障。external-doh-server 在 API 上提供 DOH 且不验证 secret，同样不是系统代理或环境变量代理的替代项。

https://wiki.metacubex.one/config/general/
