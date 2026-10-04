---
title: "Clash 控制接口 secret 与订阅凭据有何不同"
description: "Clash 控制接口 secret 与订阅凭据有何不同。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.192200+00:00
modDatetime: 2026-10-04T19:22:51.192200+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

在 mihomo 全局配置里，控制接口的 `secret` 是 RESTful API 的访问密钥，和订阅链接上常见的令牌、密码不是同一个配置项。官方「外部控制 (API)」只定义 API 如何监听、如何用 `secret` 保护；同一页里的 `authentication` 则是代理端口用户验证。把订阅凭据填进 `secret`，或把 `secret` 当成订阅口令，都会导致鉴权对象完全错位。

## 官方文档中 secret 的含义与适用条件

`secret` 写在外部控制一节，注释为「API 的访问密钥」。它与 `external-controller` 成对出现：后者是 API 监听地址（示例 `127.0.0.1:9090`，可改为 `0.0.0.0` 监听所有 IP），前者决定谁能调用该 API。外部用户界面是把静态资源放在 `API 地址/ui`，界面本身通过同一套 API 工作，因此面板登录材料对应的是 `secret`，而不是订阅文件里的字段。

适用条件很窄：只有访问 REST API、仪表板或其它控制器时才使用 `secret`。文档还列出若干不验证 `secret` 的通道：Unix socket（`external-controller-unix`）、Windows namedpipe（`external-controller-pipe`）、以及在 RESTful API 端口上开启的 DOH（`external-doh-server`）。这些通道与订阅无关，只说明 API 密钥并不能覆盖所有控制面入口。HTTPS-API 使用 `external-controller-tls` 和 `tls` 证书，保护的是传输，也不等于订阅凭据。

本页全局配置没有把「订阅凭据」写成 `secret` 的别名，因此不能从该文档推出两者可以互换。

## 不要和 secret 当成一类的字段

同一页的 `authentication` 明确用于 http(s) / socks / mixed 代理的用户验证，写法是 `user:pass` 列表；`skip-auth-prefixes` 设置允许跳过验证的 IP 段。这是数据面代理端口的账号，不是控制面 API 密钥。局域网相关项 `allow-lan`、`bind-address`、`lan-allowed-ips`、`lan-disallowed-ips` 只约束哪些设备可以走代理端口，同样不是订阅令牌，也不是 `secret`。

`external-ui`、`external-ui-name`、`external-ui-url` 描述面板静态文件的位置、子目录名和下载地址，属于界面资源，不是凭据。`profile` 下的 `store-selected`、`store-fake-ip` 是缓存策略组选择和 fakeip 映射，与订阅鉴权无关。自定义 `global-ua`、`etag-support` 只影响外部资源下载行为，不能当作订阅账号。

若业务上另有订阅 URL 的 token、密码或 HTTP 头，它们不属于本页给出的 `secret` 字段。判断依据是：官方把 `secret` 限定为 API 访问密钥；订阅获取配置文件是另一条资源下载路径，本页未将其映射到 `secret`。

## 遇到问题时如何区分改哪一项

面板或脚本调用 API 被拒，应核对 `external-controller` 地址端口与 `secret` 是否一致，并确认没有误走 unix、pipe、DOH 这些不校验密钥的入口。代理客户端提示代理端口要账号，应核 `authentication` 与 `skip-auth-prefixes`，不要改 `secret`。只能打开界面静态页却无法调用 API，优先查 `secret` 与 CORS（`external-controller-cors`），而不是订阅链接。证书错误只检查 `tls` 的 `certificate`、`private-key`、可选 `ech-key` 以及 `SAFE_PATHS`，与订阅凭据无关。

## 配错之后的纠正方向

已把订阅口令写入 `secret` 的，应改回仅用于 API 的密钥，并让面板改用该值；订阅侧仍使用订阅自己的凭据，两者不要合并成一个字符串。已把 `secret` 填进代理 `authentication` 的，按文档拆回 `user:pass` 列表，否则影响的是代理端口而不是面板。开启 unix/pipe/DOH 后不要指望单靠 `secret` 锁住控制面，文档要求自行保证这些入口的安全。纠正完成后，以配置原文是否分别出现 API 的 `secret` 与代理的 `authentication`、且没有互相覆盖，作为恢复依据。仍不确定字段归属时，只对照官方全局配置中「外部控制 (API)」与「用户验证」两节，不要自行类推到订阅协议细节。

https://wiki.metacubex.one/config/general/
