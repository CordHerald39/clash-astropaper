---
title: "Clash 磁盘配置与运行中配置为什么可能不同"
description: "Clash 磁盘配置与运行中配置为什么可能不同。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T18:58:12.215837+00:00
modDatetime: 2026-10-04T18:58:12.215837+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

磁盘上的全局 YAML 是一份声明。正在运行的 Clash 内核还会接受 RESTful API 控制，并按 profile 缓存、GEO 自动更新、TLS 本地文件重载、外部界面下载以及部分平台强制值改变行为。因此文件里写的和此刻内核正在用的可以合法地不一致。这并不自动等于改错了文件。

## 适用条件

适用于已经把 YAML 与当前日志、监听、出站或策略选择对照过、发现不一致、需要解释来源的场合。适用于开启了外部控制、策略组选择储存、GEO 自动更新、TLS 本地证书，或运行在会强制 Keep Alive 行为的 Android 环境。

## 运行态可以离开 YAML 的来源

1. 外部控制入口。external-controller 提供 RESTful API；还可配置 Unix socket、Windows namedpipe 与 TLS 端口。从 Unix socket 或 namedpipe 访问 API 不会验证 secret。external-doh-server 在 RESTful API 端口上提供的 URL 也不会验证 secret。其它进程或界面可以改内核状态，而不改你正在看的磁盘文件。
2. 启动时读回的缓存。profile.store-selected 储存 API 对策略组的选择，供下次启动使用；store-fake-ip 储存 fakeip 映射表，域名再次连接时使用原有映射地址。下次启动即使 YAML 未写这些内容，运行态也可以回到上次留下的结果。
3. 自动更新与有限的自动重载。geo-auto-update 按小时间隔更新 GEO；geox-url 指定 geoip、geosite、mmdb、asn 的下载地址。etag-support 影响外部资源下载。external-ui-url 会把界面更新到 external-ui，或 external-ui-name 指定的子文件夹。tls 中本地证书文件自 v1.19.18 支持自动重载；本页没有把同样机制写到其它 YAML 全局字段上。
4. 默认值与平台强制。mode 默认为规则模式；ipv6 默认为 true；find-process-mode 默认为 strict；lan-allowed-ips 默认包含 0.0.0.0/0 与 ::/0。文件省略某项时，运行中仍有默认行为。disable-keep-alive 在 Android 上强制为 true，磁盘写成 false 也不会变成运行值。

## 怎样判断是机制差异还是用错文件

把不一致项分类：策略组选择与 fakeip 优先看 profile；GEO 相关变化看自动更新与 geox-url；监听与密钥看是否另有进程在写 API；日志级别只应出现在控制台和控制页面。若 mode、log-level、监听地址这一组都对不上 YAML，更像内核没有用这份文件。若只有策略选择不同而日志级别一致，更像 API 与 store-selected。若仅 Keep Alive 在 Android 上不符，按平台强制解释。

## 失败时下一步

不要假设存在未记载的「把运行态写回 YAML」或「保存即同步」步骤。需要磁盘成为主要来源时，应意识到 API 入口可以改内核，且 store-selected 会在下次启动恢复选择。需要运行态反映 YAML 时，本页只对符合版本条件的 TLS 本地证书文件写出了自动重载；其余项应在内核再次读取该 YAML 之后再比较。

资料来源：
https://wiki.metacubex.one/config/general/
