---
title: "Clash DOMAIN 与 DOMAIN-SUFFIX 匹配范围有何区别"
description: "Clash DOMAIN 与 DOMAIN-SUFFIX 匹配范围有何区别。了解适用条件、操作步骤与常见问题的排查方法。"
pubDatetime: 2026-10-04T20:31:18.047820+00:00
modDatetime: 2026-10-04T20:31:18.047820+00:00
author: "编辑部"
featured: false
draft: false
tags: ["原理科普"]
---

`DOMAIN` 和 `DOMAIN-SUFFIX` 都出现在同一套 `rules` 列表里，载荷也常常都写主域名，但匹配范围不同。手册把前者定为匹配完整域名，把后者定为匹配域名后缀，并用 `google.com` 给出正反例。理解范围差，才能决定哪一种写主域名、哪一种写给整棵子域树。

## 适用条件：两种类型各自覆盖什么

`DOMAIN` 的适用条件是：你只想处理某一个精确主机名。请求的域名必须与载荷完全一致才命中。主机多一段标签、少一段标签、或只是看起来相似，都不算。因此 `DOMAIN,ad.com,REJECT` 这类条目只拒绝主机恰好为 `ad.com` 的请求，不会把 `www.ad.com` 算进去。

`DOMAIN-SUFFIX` 的适用条件是：你要把某一后缀当成一棵域名树的根来处理。手册示例写明：`google.com` 匹配 `www.google.com`、`mail.google.com` 和 `google.com`，但不匹配 `content-google.com`。也就是说，范围包括：

- 后缀自身（主域名）；
- 在标签边界上挂在该后缀之下的各级子域名；
- 不包括仅仅“字符串里出现这段文字”、中间没有点分边界的另一域名。

二者的范围差可以概括为：`DOMAIN` 是点对点的完整相等；`DOMAIN-SUFFIX` 是点分标签上的后缀关系，并且后缀关系不等于子串包含。

还要叠加列表顺序这一适用条件。规则从上到下匹配，顶部优先。即使某条 `DOMAIN-SUFFIX` 范围更宽，只要前面已有 `DOMAIN`、`DOMAIN-KEYWORD`、`GEOSITE` 或逻辑规则命中，后面的后缀规则不会再执行。比较两种类型时，必须连同它们在列表中的位置一起看。

## 具体场景：用同一主域名对照两种范围

把载荷都写成 `google.com`，分别套到两种类型上，用几类主机做判断：

1. 主机为 `google.com`。`DOMAIN` 命中，因为完整域名相等。`DOMAIN-SUFFIX` 也命中，手册把后缀自身列在匹配结果里。此时两种类型范围重叠，看不出差别。
2. 主机为 `www.google.com` 或 `mail.google.com`。`DOMAIN` 不命中，因为不是完整相等。`DOMAIN-SUFFIX` 命中，因为它们以 `.google.com` 结尾。这是范围差最常见的表现：子域名只属于后缀类型。
3. 主机为 `content-google.com`。两种类型都不按“google.com 后缀”命中。`DOMAIN` 因不相等失败；`DOMAIN-SUFFIX` 因不是点分后缀失败。若业务上要把这类名字算进去，应改看 `DOMAIN-KEYWORD` 的关键字匹配，而不是扩大对后缀的想象。
4. 主机为更深的 `a.b.google.com`。按后缀定义，它仍以 `.google.com` 结尾，属于 `DOMAIN-SUFFIX` 的范围；仍不属于 `DOMAIN` 的完整匹配。手册示例虽只写到 `www` 与 `mail`，判断依据仍是同一套“域名后缀”定义，而不是某一级子域的白名单。
5. 同列表中若还有 `DOMAIN-WILDCARD,*.google.com,...`，不要把它的范围直接等同于 `DOMAIN-SUFFIX,google.com`。通配符仅支持 `*` 和 `?`，且与配置其他地方的 Clash 格式通配符不相同。`*.google.com` 是否包含主域名本身，取决于通配符是否允许零级标签，不能用后缀规则的结论去反推。
6. 逻辑规则会改变“看起来像某类型”的实际范围。手册中的 `AND`、`OR`、`NOT` 要求把内部载荷写成带括号的规则片段，例如 `NOT,((DOMAIN,baidu.com)),PROXY`。此时真正生效的是逻辑组合后的集合，而不是外层某个单词。比较 `DOMAIN` 与 `DOMAIN-SUFFIX` 时，若它们被包在逻辑规则里，应先展开括号再判断范围。

判断依据固定为手册原定义加示例边界：完整匹配只认相等；后缀匹配认后缀自身与点分子域，并明确排除 `content-google.com` 这种非后缀相似名。

## 失败时下一步

当实际走向与你理解的范围不一致时，按范围差而不是按“规则坏了”处理：

- 若只有主域名进了预期策略、子域名没有，先确认写的是 `DOMAIN` 还是 `DOMAIN-SUFFIX`。范围需求是整棵子域树时，类型必须是后者。
- 若子域名和主域名都进了，但某个“长得像”的名字也进了，用手册反例核对是否误用了 `DOMAIN-KEYWORD` 或过宽的正则。后缀类型不应收 `content-google.com`。
- 若主域名反而没进、子域名进了，检查是否只用了 `DOMAIN-WILDCARD` 的 `*.` 形式，而没有单独的完整匹配或后缀规则覆盖后缀自身。
- 核对优先级：把需要优先的精确 `DOMAIN` 放在宽 `DOMAIN-SUFFIX` 之前，避免被宽规则先吃掉后无法再区分。
- 范围涉及 `GEOSITE` 或 `RULE-SET` 时，先确认集合内部用的是哪类域名规则，再与手写的 `DOMAIN`、`DOMAIN-SUFFIX` 比较，避免两套范围叠在同一列表里却以为只有一种。
- 仍无法解释时，把目标主机、规则类型、载荷、前后相邻规则四项对照手册逐条记下，排除 `MATCH` 兜底造成的“好像匹配到了”。

两种类型没有“哪个更强”的性能或效果含义，只有匹配范围不同。以完整域名对完整主机、域名后缀对点分后缀来选型即可。

https://wiki.metacubex.one/config/rules/
