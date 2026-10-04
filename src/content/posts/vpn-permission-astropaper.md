---
title: "Clash Meta 手机端（Android）：VPN 授权给应用的是哪类网络能力"
description: "Clash Meta 手机端（Android）：VPN 授权给应用的是哪类网络能力。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T19:22:51.201372+00:00
modDatetime: 2026-10-04T19:22:51.201372+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

## 授权对应哪一种系统能力

Clash Meta for Android 把 Clash.Meta 做成可安装应用。Android 从 4.0 起允许开发者提供自有 VPN 方案，与系统内置 PPTP、L2TP/IPSec（文档所称 legacy VPN）分开。使用者在连接请求对话框里同意后，授予的不是任意修改系统设置的能力，而是让该应用的服务成为当前 VpnService：系统把该用户或工作资料的网络栈接到应用创建的本地 TUN 接口。

能力边界由 VpnService 与 Builder 决定。服务必须在清单中使用 BIND_VPN_SERVICE 保护，并声明 android.net.VpnService 意图过滤器，这样只有系统能绑定该服务。应用从接口文件描述符读出站 IP 包，加密后发到网关；把从网关收到并解密的包写回接口。文档警告必须使用强加密。授权不包含系统替你选择协议或节点，也不会把内置传统 VPN 的账号界面交给 Clash Meta。

同一用户或资料只能有一个活动服务，新服务会停掉旧服务。这解释了为何同意 Clash Meta 之后，其他 VpnService 客户端通常不能同时保持系统级接管。仓库给出的包名为 com.github.metacubex.clash.meta，外部 START、STOP、TOGGLE 意图只能驱动已声明服务的启停，不能扩大上述权限范围。

## 接口建立后实际拿到的转发范围

prepare() 成功只表示可以建立接口。真正转发发生在 Builder.establish() 之后。建立前必须至少 addAddress，写入一个 IPv4 或 IPv6 地址及掩码，作为本地 TUN 地址。若希望系统把流量送进该接口，还要 addRoute，目的地址匹配的包才会进来。要接管全部流量时，文档示例使用 0.0.0.0/0 或 ::/0。还可以添加 DNS。establish() 返回 ParcelFileDescriptor 供读写；未准备或权限被收回则返回 null。

在此之上还有三类可选项。按应用 VPN：必须在连接建立前设置允许名单或禁止名单，二者不能同时使用；都不设置则全部应用走 VPN。允许名单非空时，只有名单内应用走隧道，其余走系统网络；禁止名单内应用绕过隧道。允许旁路时调用 allowBypass()，其他应用可以把进程或套接字绑定到指定网络；一旦选择阻止非 VPN 连接，绑到其他网络的应用可能完全无连接。always-on 从 Android 7.0 起可用，由系统在开机后拉起服务，并可配合阻止非 VPN 流量。这些选项都建立在该应用已是当前 VPN 服务之上，首次仍然要过连接请求对话框。

## 能力边界、自检方法和失败时下一步

授权不包括：绕过 BIND_VPN_SERVICE 的任意绑定；在未调用 VpnService.protect() 的情况下把隧道套接字放进 VPN（会形成环路）；给尚未安装的包名写按应用名单；在接口建立之后再改旁路标志。它也不等于设备管理权限。

自检可以从系统界面看。同意后应用应出现在设置里的网络和互联网 VPN 列表；连接活动时状态栏有钥匙图标，快捷设置可看到信息面板。应用须提供手动启停方式，并在服务活动时显示不可消除通知。只有授权记录、没有钥匙图标，说明尚未 establish 或服务已被停止。有图标但部分应用不走隧道，检查是否写了允许名单或禁止名单。全部应用断网，检查是否打开了阻止非 VPN 连接，而隧道尚未就绪。

失败时：establish() 为 null 就回到准备状态，重新走 prepare()。系统调用 onRevoke() 时，应关闭受保护套接字和 ParcelFileDescriptor，因为此时已经有替代接口在路由。Android 8.1 及以上若清单把 SUPPORTS_ALWAYS_ON 设为 false，设置里的 always-on 控件会被关掉，这不削弱首次授权，只是放弃由系统保活。设备低于文档最低版本时，接口行为可能不完整，应先核对本机是否满足 Android 5.0，以及是否达到建议的 7.0。

https://developer.android.com/develop/connectivity/vpn
https://github.com/MetaCubeX/ClashMetaForAndroid
