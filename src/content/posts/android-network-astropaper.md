---
title: "Clash Meta 手机端（Android）：网络切换为什么可能改变 DNS 与路由环境"
description: "Clash Meta 手机端（Android）：网络切换为什么可能改变 DNS 与路由环境。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.201372+00:00
modDatetime: 2026-10-04T19:22:51.201372+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 适用条件

本文只解释：在 Android 上使用 Clash Meta 手机端时，为什么从一种承载网络换到另一种（典型是 Wi-Fi 与蜂窝）可能改变 DNS 与路由环境。讨论范围限于系统 `VpnService` 如何接管接口、DNS 与路由，以及服务停止后流量回到哪一套网络。适用条件包括 Clash Meta for Android 可运行（最低 Android 5.0，文档建议 7.0 及以上），用户已授权该应用成为当前 VPN，并且发生了系统级网络切换。不把原因写成某一节点“失效”，也不把系统内置 PPTP、L2TP/IPSec 客户端算进 Clash Meta 路径。

## 两套并行的解析与转发平面

没有 VPN 时，应用走当前默认网络。Wi-Fi 与蜂窝由系统分别管理，各自可有不同的接口地址、默认路由和 DNS。VPN 应用通过 `VpnService.Builder` 再创建一块本地 TUN：`addAddress()` 写入接口地址，`addRoute()` 按目的地址决定哪些包进入该接口，`addDnsServer()` 写入 VPN 侧 DNS。`establish()` 成功后，系统开始把匹配路由的流量送进 TUN，应用从文件描述符读出报文发往网关，并把返回包写回。因此设备上同时存在“运营商/WLAN 提供的系统网络”和“VPN 应用声明的 TUN 网络”。切换承载网络，改变的是前一套平面；若 VPN 服务随之停止或重建，后一套平面的 DNS 与路由也会被丢掉或按新的 Builder 重写。

路由是过滤条件而不是装饰项。文档写明至少添加一条路由，系统才会把对应流量送进 VPN 接口；要承接全部流量需使用 `0.0.0.0/0` 或 `::/0` 这类开放路由。DNS 则取决于是否调用了 `addDnsServer()` 以及握手阶段网关给出的值。换网络后如果服务重新 `establish()`，这两类参数都可能与上一张网络上的会话不同。若服务被撤销，文档明确指出调用 `onRevoke()` 时替代网络接口已经在转发流量，解析与路由会回到当时的 Wi-Fi 或蜂窝默认环境。

## 授权、分应用与旁路如何放大差异

每个用户或工作资料只能有一个活动 VPN 服务，新服务会停掉旧服务。`prepare()` 必须在每次需要成为当前 VPN 时调用，因为用户可能已改选其他应用。未准备或权限被收回时 `establish()` 返回 null，TUN 不会出现，所有解析与转发都留在系统网络上——此时看到的 DNS 就是蜂窝或 Wi-Fi 的 DNS，而不是 Builder 里那一组。

分应用 VPN 会把“谁走 TUN、谁走系统网络”再切一刀。允许列表非空时，仅列表内应用走 VPN，其余应用像 VPN 未运行一样使用系统网络；拒绝列表则相反。列表必须在连接建立前设定，更改只能靠新连接。`allowBypass()` 允许应用绑定到特定网络以绕过 VPN；应用可通过 `ConnectivityManager.bindProcessToNetwork()` 或 `Network.bindSocket()` 把套接字绑到指定网络。换网络后，被绑定的那张 `Network` 可能消失或更换，绕过路径上的 DNS 与路由会跟着变。若同时打开“阻止不使用 VPN 的连接”，未走 VPN 的流量会被系统拦截，表现上就像解析与连通一起消失，而不是“还在用旧的 Wi-Fi DNS”。

通往网关的套接字必须 `VpnService.protect()`，否则封装流量会再次进入 TUN 形成环路。保护失败或网关改走新接口后不可达时，TUN 仍可能占用默认路由与 DNS，应用侧则读不到有效回包，这种“DNS 已指向 VPN、路由已指向 TUN、但网关路径已随承载网络改变”的组合，是切换后环境变化的典型来源。

## 如何判断当前生效的是哪一套环境，以及失败时下一步

判断依据应看系统是否仍显示活动 VPN：状态栏钥匙图标、快捷设置信息面板、「设置 > 网络和互联网 > VPN」中的应用状态，以及服务活动时不可清除的通知。上述都在，才有依据认为 `addDnsServer()`/`addRoute()` 仍可能生效；上述消失，应认为已回到替代接口的 DNS 与路由。Always-on 在 Android 8.0 及以上断开时会另给不可清除通知，可用来区分“系统认为 VPN 应在但连不上”和“服务已停、流量已回系统网络”。

若无法判断：先确认授权与 `prepare()` 结果，再确认新的 `establish()` 是否写入了地址、路由、DNS；核对本应用是否落在允许/拒绝列表之外，以及是否绑定了已失效的 `Network`。需要重新接管时，仓库记载可向 `com.github.kr328.clash.ExternalControlActivity` 发送 `START_CLASH`、`STOP_CLASH` 或 `TOGGLE_CLASH`。不要在系统 UI 已表明 VPN 撤销后，仍用上一张网络的 DNS 假设来解释当前失败。

资料：
https://developer.android.com/develop/connectivity/vpn
https://github.com/MetaCubeX/ClashMetaForAndroid
