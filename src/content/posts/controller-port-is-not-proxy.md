---
title: "9090 面板端口能当代理吗：区分控制 API 与转发端口"
description: "从端口角色解释面板能开而浏览器不能代理的原因，按运行配置检查 API 与 mixed-port。"
draft: false
pubDatetime: 2026-10-04T06:25:42+08:00
modDatetime: 2026-10-04T06:25:42+08:00
author: "编辑部"
featured: false
tags: ["Clash 9090", "external-controller", "mixed-port"]
---

网页面板能在 9090 打开，但把浏览器代理填成 9090 后却断网，常见原因是混淆了控制端口与代理端口。mihomo 的 `external-controller` 提供控制 API，HTTP、SOCKS 或 mixed 端口才负责接收应用代理请求。具体数字由配置决定，9090、7890 都不是不可修改的固定值。

## 用配置字段判断端口用途

查看客户端当前生效的配置：`external-controller` 是 API 地址，`port` 是 HTTP 代理，`socks-port` 是 SOCKS，`mixed-port` 可接收 HTTP 与 SOCKS5。不要只依据托盘图标或安装教程记忆。把面板 URL 复制到应用代理设置里，协议与用途就可能错位。

例如配置中 API 为 `127.0.0.1:9090`、mixed 为 `7892`，浏览器或支持手动代理的程序应使用实际 mixed 端口。这里的数字仅为字段说明，不能替代你的运行值；跨设备访问还涉及监听范围与访问权限。

## 面板可访问证明了什么

面板加载成功，说明浏览器取得了面板页面。面板还能读到策略组，才进一步说明它与控制 API 的通信可用。这两项仍不能证明节点可连接、路由规则正确，或应用流量已经进入代理端口。

排查时分别记录“面板页面是否加载”“API 是否连上”“代理端口有没有连接”“目标访问是否成功”。一项失败时只检查对应环节。例如代理端口无新记录，先查应用设置；有记录但上游超时，才进入节点或目标连接排查。

## 控制 API 的访问范围也要核对

手册说明，API 绑定 `127.0.0.1` 仅监听回环地址，改为 `0.0.0.0` 会监听所有 IPv4 地址。API 可用 `secret` 设置访问密钥。不要为了让面板“随处能用”直接开放到公网。面板地址和 API 地址也不必相同：一个是静态网页，另一个是它连接的控制服务。

若此前把 API 端口误填为系统代理，先改回实际 HTTP 或 mixed 端口，再重新发起同一请求。若计划给手机共享代理，另看[局域网访问边界](/posts/lan-proxy-boundary/)，不要把控制端口一起当成共享服务开放。

依据：[mihomo API 相关全局字段](https://wiki.metacubex.one/config/general/) · [HTTP、SOCKS 与 mixed 端口定义](https://wiki.metacubex.one/config/inbound/port/)。本文为文档解释，未进行节点测速。
