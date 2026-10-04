---
title: "Clash 配置文件与客户端偏好为什么不能混为一份"
description: "Clash 配置文件与客户端偏好为什么不能混为一份。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T21:36:45.703141+00:00
modDatetime: 2026-10-04T21:36:45.703141+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

配置文件声明内核应如何监听、匹配与出站；控制面通过 API 产生的选择和映射是另一类状态。把二者粘成一份、一次覆盖，会互相打掉。下面只说明全局配置里为何必须分开，以及已经混用时如何拆开。依据为全局配置说明。

## 适用条件

当同时存在 YAML 全局段、RESTful API（`external-controller` 及相关监听）以及 `profile` 持久化开关时，就有“文件声明”和“运行偏好”两套来源。`mode` 可在文件里写成 rule、global 或 direct；策略组里具体选择则由 API 写入，并由 `profile.store-selected` 决定下次启动是否沿用。二者层级不同，不能当成同一个键保存。

## 文件职责与偏好职责如何划分

YAML 全局段规定长期有效的内核参数，例如 `allow-lan`、`bind-address`、`authentication`、`secret`、`log-level`、`ipv6`、`find-process-mode`、`interface-name`、`routing-mark`、GEO 相关键以及 TLS 材料。这些是启动时读取的声明，适合纳入主机配置，但它们并不保存“上次通过控制面选过哪个策略”。

`profile.store-selected` 的含义是储存 API 对策略组的选择，以供下次启动时使用。`profile.store-fake-ip` 储存 fakeip 映射表，域名再次发生连接时使用原有映射地址。这两项明确把运行期结果放到配置正文之外。若把控制面当前选择手工粘进 YAML，同时又开着 `store-selected`，下次启动会出现文件与缓存争用：选择被缓存覆盖，或误以为改文件即可永久钉死偏好。

`external-ui` 只是把静态网页资源运行在 API 的 `/ui` 路径，路径可为绝对路径或工作目录相对路径；不在工作目录时需要 `SAFE_PATHS`。`external-ui-name` 与 `external-ui-url` 只影响目录和下载，不会把界面状态写回 YAML。界面调用 API 去改选择或模式，结果并不自动成为配置正文。因此“界面上看到的状态”不是配置文件的副本。`secret` 保护的是 API；Unix socket、Windows namedpipe 以及 `external-doh-server` 访问不会验证 secret。把界面偏好、密钥与 YAML 混在同一份可转发文件里，会同时扩大泄露面，并让“谁改了模式”无法追溯。

`unified-delay`、`tcp-concurrent`、Keep Alive 与进程匹配属于文件级声明，不是会话勾选。运行模式虽然出现在 YAML，也可被 API 在运行中改变。若不加区分，恢复文件可能把正在使用的 global 或 direct 打回默认 `rule`，而策略组选择仍留在 `store-selected` 缓存中，表现为模式和节点来自两套历史。

## 不能混为一份的判断依据与拆分步骤

判断依据有三条。其一，生命周期不同：YAML 随部署更新；`store-selected` 与 `store-fake-ip` 随 API 使用增长，fakeip 映射尤其不应当作配置正文传播。其二，安全边界不同：`authentication`、`secret`、TLS PEM，以及不校验 secret 的 unix、pipe、DOH，一旦进入“连偏好一起打包”的文件，接收者就同时拿到控制面与代理端口凭证。其三，加载顺序不同：文件提供初值，API 与 profile 存储提供会话延续；合成一份无法表达以谁为准。

操作上应固定分工：监听、网段、出站接口、GEO 地址、证书路径只放 YAML；策略组选择依赖 `store-selected` 的独立存储；界面资源放 `external-ui` 目录并用 `SAFE_PATHS` 约束，不把控制面临时状态粘回全局段。需要可重复部署时，让 YAML 成为唯一声明，把 `store-selected` 视为可选缓存而不是第二份配置。`mode` 若要以文件为准，恢复后应检查运行中的模式是否仍等于文件，而不是看界面上次留下的选择。

若已经混存并出现启动后选择跳动、模式不符合文件、或 fakeip 地址错乱：先看 `profile` 两个开关是否为 true，再分别处理 YAML 与缓存，不要用覆盖整目录的方式对齐。若 API 能改、文件不能解释，查 `external-controller` 是否对非本机开放、`secret` 是否为空、是否启用了不验证 secret 的 socket。路径类界面问题查 `external-ui` 与 `SAFE_PATHS`，不要把缺界面当成缺配置键。手册不描述把偏好写回 YAML 的合并格式，因此不存在一份可遵循的混编文件。

https://wiki.metacubex.one/config/general/
