# 图标清单与来源

所有文件均为 512×512 PNG、RGBA；链接固定到收录时审查的上游提交。Oasisic-Icons 提供 35 个，Dashboard Icons 提供 3 个；这两批采用原 PNG。除下述明确标注的标准化处理外，图片文件字节未修改。 金融图标为另外一批矢量素材转换，详见文末清单。

Claude 的上游文件名为 `Anthropic.png`，Gemini 的上游文件名为 `GoogleAI.png`；本集合按图案对应的服务命名。

## Dashboard Icons 补充项与标准化处理

保留完整 [Apache-2.0 许可](licenses/dashboard-icons-apache-2.0.txt)，版权归 Bjorn Lammers、Meier Lukas、Thomas Camlong 和 Homarr Labs。固定来源提交为 `adca944175c9a3eb0471f78a4da87f237476d585`。仅选取这 3 项，不同步或镜像上游。

| 文件 | 处理 |
|---|---|
| [development/vscode.png](development/vscode.png) | 按原比例缩至 460×460，透明画布居中留边；不裁切标志 |
| [development/gitlab.png](development/gitlab.png) | 按原比例缩至 460×443，透明画布居中留边；不裁切标志 |
| [proxy-clients/clash.png](proxy-clients/clash.png) | 转换为 RGBA，无颜色量化；保留原始像素尺寸，居中填充透明画布至 512×512 |

修改的 PNG 同时内嵌来源、许可与修改说明。原底色保留；等比留边不裁切标志；Clash 原图不放大，保留原始像素细节。

## AI

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Claude | [claude.png](ai/claude.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/Anthropic/Anthropic.png) |
| DeepSeek | [deepseek.png](ai/deepseek.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/DeepSeek/DeepSeek.png) |
| Gemini | [gemini.png](ai/gemini.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/GoogleAI/GoogleAI.png) |
| Grok | [grok.png](ai/grok.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/SpaceXAI/xAI/Grok/Grok.png) |
| Kimi | [kimi.png](ai/kimi.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/Kimi/Kimi.png) |
| ChatGPT | [openai.png](ai/openai.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/OpenAI/OpenAI.png) |
| Perplexity | [perplexity.png](ai/perplexity.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/Perplexity/Perplexity.png) |

## 媒体播放器

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Emby | [emby.png](media-players/emby.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Emby/Emby.png) |
| Infuse | [infuse.png](media-players/infuse.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Infuse/Infuse.png) |
| Jellyfin | [jellyfin.png](media-players/jellyfin.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Jellyfin/Jellyfin.png) |
| Plex | [plex.png](media-players/plex.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Plex/Plex.png) |

## 游戏

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Epic Games | [epic-games.png](gaming/epic-games.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Game/EpicGames/EpicGames.png) |
| Nintendo | [nintendo.png](gaming/nintendo.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Game/Nintendo/Nintendo.png) |
| PlayStation | [playstation.png](gaming/playstation.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/SONY/PlayStation/PlayStation.png) |
| Steam | [steam.png](gaming/steam.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Game/Steam/Steam.png) |

## 开发工具

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Cursor | [cursor.png](development/cursor.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Development/Cursor/Cursor.png) |
| Docker | [docker.png](development/docker.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Infrastructure/Docker/Docker.png) |
| GitHub | [github.png](development/github.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/GitHub/GitHub.png) |
| GitLab | [gitlab.png](development/gitlab.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/gitlab.png) |
| Visual Studio Code | [vscode.png](development/vscode.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/visual-studio-code.png) |

## 代理客户端

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Clash | [clash.png](proxy-clients/clash.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/clash.png) |
| Surge | [surge.png](proxy-clients/surge.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Surge/Surge/Surge.png) |

## 线路与专线

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| BGP | [bgp.png](routes/bgp.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/BGP/BGP.png) |
| GIA | [gia.png](routes/gia.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/GIA/GIA.png) |
| IEPL | [iepl.png](routes/iepl.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/IEPL/IEPL.png) |
| IPLC | [iplc.png](routes/iplc.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/IPLC/IPLC.png) |

## 国家与地区

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| 澳大利亚 | [australia.png](regions/australia.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Australia/Australia.png) |
| 加拿大 | [canada.png](regions/canada.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Canada/Canada.png) |
| 中国 | [china.png](regions/china.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/China/China.png) |
| 德国 | [germany.png](regions/germany.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Germany/Germany.png) |
| 中国香港 | [hong-kong.png](regions/hong-kong.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/HongKong/HongKong.png) |
| 日本 | [japan.png](regions/japan.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Japan/Japan.png) |
| 荷兰 | [netherlands.png](regions/netherlands.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Netherlands/Netherlands.png) |
| 新加坡 | [singapore.png](regions/singapore.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Singapore/Singapore.png) |
| 韩国 | [south-korea.png](regions/south-korea.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Korea/Korea.png) |
| 中国台湾 | [taiwan.png](regions/taiwan.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/CN-Taiwan/CN-Taiwan.png) |
| 英国 | [united-kingdom.png](regions/united-kingdom.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/UK/UK.png) |
| 美国 | [united-states.png](regions/united-states.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/US/US.png) |

## 银行、券商与大型金融机构（2026-10-05）

收录 23 个品牌，使用 `finance/` 单层目录，名称仍为小写英文、数字和短横线。中国银行与中银香港、HSBC 香港与新加坡、DBS 香港与新加坡、渣打香港与新加坡共用品牌 symbol，仅保留一份；清单不代表覆盖所有地区机构。

展示标题按品牌总部所在地的常用名称填写，不另维护搜索别名。蓝色八角形图案对应 Chase 零售银行品牌，展示名为「Chase」；品牌关系见下表的官方历史资料。

先核对机构官网、官方品牌说明或媒体资料，再采用下表固定提交中的矢量素材。官网列用于核对品牌，不表示这些 SVG 都由官网直接下载。OCBC 使用 2023 年更新后的 symbol，未使用 IconGo 的旧版。未采用来源中为深色主题改色、放大至 250px 或边缘质量不稳定的股票 PNG 集合。平安集团图标不作为平安银行图标；Morgan Stanley、ZA Bank、BNP Paribas 等本次未收录。

所有成品均为 512×512 PNG、RGBA：等比转换 SVG，按 symbol 的实际形状设置留白与居中，并用与整理工具相同的 r=115 整数圆角边界将外侧 alpha 置零。主体不重绘、不加阴影、不量化。IconGo 的白底圆角画布按现有标准重新生成，保留原 symbol 颜色和比例；HSBC、Deutsche Bank、Goldman Sachs 的单色 SVG 分别使用来源元数据的品牌色 `#DB0011`、`#0018A8`、`#7399C6`，配白色主体底板。Charles Schwab 和 Wells Fargo 保留素材本身的蓝色、红色底板，Fidelity 保留绿白图形；IBKR 保留源 symbol 内部渐变。其余透明 symbol 配白色主体底板。横向 symbol 使用较宽留白区域，圆形及纵向 symbol 另行等比缩放，未拉伸或裁切品牌图形。

许可：IconGo 与 Global Bank Logos 的 MIT 许可分别保存在 [icongo-mit.txt](licenses/icongo-mit.txt)、[global-bank-logos-mit.txt](licenses/global-bank-logos-mit.txt)；selfh.st 素材采用 [CC BY 4.0](licenses/selfhst-cc-by-4.0.txt)，作者为 selfh.st，均已转换、缩放、补底和处理圆角；Simple Icons 采用 [CC0](licenses/simple-icons-cc0.txt)。以上集合许可不授予银行商标权，所有品牌标识归各机构所有，用于识别机构，不表示授权或关联。

| 品牌 | 文件 | 矢量素材（固定提交） | 官网 / 官方核对资料 |
|---|---|---|---|
| Chase / 大通银行 | [chase.png](finance/chase.png) | [源 SVG](https://github.com/selfhst/icons/blob/b3ce1c7b79b2d6981e51af74bb6d05a01fe604fb/svg/chase.svg) | [官方资料](https://www.jpmorganchase.com/about/our-history) |
| Bank of America / 美国银行 | [bank-of-america.png](finance/bank-of-america.png) | [源 SVG](https://github.com/selfhst/icons/blob/b3ce1c7b79b2d6981e51af74bb6d05a01fe604fb/svg/bank-of-america.svg) | [官方资料](https://www.bankofamerica.com) |
| Citi / 花旗银行 | [citi.png](finance/citi.png) | [源 SVG](https://github.com/auraveni/global-bank-logos/blob/ad33060ca976397a9fcb46dd40c2d77bce5ce7e1/assets/bank/international-bank/citi.svg) | [官方资料](https://www.citigroup.com/global/about-us) |
| Wells Fargo / 富国银行 | [wells-fargo.png](finance/wells-fargo.png) | [源 SVG](https://github.com/selfhst/icons/blob/b3ce1c7b79b2d6981e51af74bb6d05a01fe604fb/svg/wells-fargo.svg) | [官方资料](https://www.wellsfargo.com) |
| Goldman Sachs / 高盛 | [goldman-sachs.png](finance/goldman-sachs.png) | [源 SVG](https://github.com/simple-icons/simple-icons/blob/98820a4dc8c363ca72fa2c0d294ea4a0a9bba75d/icons/goldmansachs.svg) | [官方资料](https://design.gs.com/brand/goldman-sachs-logo) |
| Charles Schwab / 嘉信理财 | [charles-schwab.png](finance/charles-schwab.png) | [源 SVG](https://github.com/selfhst/icons/blob/b3ce1c7b79b2d6981e51af74bb6d05a01fe604fb/svg/charles-schwab.svg) | [官方资料](https://www.schwab.com/media/6616) |
| Fidelity Investments / 富达投资 | [fidelity.png](finance/fidelity.png) | [源 SVG](https://github.com/selfhst/icons/blob/b3ce1c7b79b2d6981e51af74bb6d05a01fe604fb/svg/fidelity.svg) | [官方资料](https://www.fidelity.com/wealth/fidelity-go) |
| Interactive Brokers / 盈透证券 | [interactive-brokers.png](finance/interactive-brokers.png) | [源 SVG](https://github.com/selfhst/icons/blob/b3ce1c7b79b2d6981e51af74bb6d05a01fe604fb/svg/interactive-brokers.svg) | [官方资料](https://www.interactivebrokers.com/en/general/about/info-and-history.php) |
| 中国工商银行 / ICBC | [icbc.png](finance/icbc.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/icbc-rect.svg) | [官方资料](https://icbc.com.cn/ICBCLtd/%E5%85%B3%E4%BA%8E%E6%88%91%E8%A1%8C/%E9%9B%86%E5%9B%A2%E5%93%81%E7%89%8C/jcgf.htm) |
| 中国建设银行 / CCB | [ccb.png](finance/ccb.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/ccb-rect.svg) | [官方资料](https://www.ccb.com/cn/ccbtoday/jhbkhb/20200428_1588069504.html) |
| 中国农业银行 / ABC | [abc.png](finance/abc.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/abchina-rect.svg) | [官方资料](https://www.abchina.com/cn/aboutabc/nhfm/) |
| 中国银行 / BOC | [bank-of-china.png](finance/bank-of-china.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/boc-rect.svg) | [官方资料](https://www.boc.cn/aboutboc/bi1/201110/t20111014_1556052.html) |
| 交通银行 / Bank of Communications | [bank-of-communications.png](finance/bank-of-communications.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/bankcomm-rect.svg) | [官方资料](https://www.bankcomm.com/BankCommSite/) |
| 招商银行 / CMB | [cmb.png](finance/cmb.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/cmbchina-rect.svg) | [官方资料](https://www.cmbchina.com) |
| 兴业银行 / CIB | [cib.png](finance/cib.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/cib-rect.svg) | [官方标识](https://www.cib.com.cn/cn/resources2023/css/2023/images/new_logo.png) |
| HSBC / 汇丰银行 | [hsbc.png](finance/hsbc.png) | [源 SVG](https://github.com/simple-icons/simple-icons/blob/98820a4dc8c363ca72fa2c0d294ea4a0a9bba75d/icons/hsbc.svg) | [官方资料](https://www.hsbc.com/news-and-views/our-brand-in-action) |
| 恒生银行 / Hang Seng Bank | [hang-seng-bank.png](finance/hang-seng-bank.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/hangseng-rect.svg) | [官方资料](https://www.hangseng.com) |
| Standard Chartered / 渣打银行 | [standard-chartered.png](finance/standard-chartered.png) | [源 SVG](https://github.com/auraveni/global-bank-logos/blob/ad33060ca976397a9fcb46dd40c2d77bce5ce7e1/assets/bank/international-bank/standard.svg) | [官方资料](https://www.sc.com/en/media/) |
| DBS / 星展银行 | [dbs.png](finance/dbs.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/dbs-rect.svg) | [官方资料](https://www.dbs.com/newsroom/DBS_unveils_new_brand_campaign) |
| OCBC / 华侨银行 | [ocbc.png](finance/ocbc.png) | [源 SVG](https://github.com/auraveni/global-bank-logos/blob/ad33060ca976397a9fcb46dd40c2d77bce5ce7e1/assets/bank/international-bank/ocbc.svg) | [官方资料](https://www.ocbc.com/group/about-us/our-brand.page) |
| UOB / 大华银行 | [uob.png](finance/uob.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/uobchina-rect.svg) | [官方资料](https://www.uobgroup.com/uobgroup/about/index.page) |
| UBS / 瑞银 | [ubs.png](finance/ubs.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/ubs-rect.svg) | [官方资料](https://www.ubs.com/global/en/our-firm/our-history.html) |
| Deutsche Bank / 德意志银行 | [deutsche-bank.png](finance/deutsche-bank.png) | [源 SVG](https://github.com/simple-icons/simple-icons/blob/98820a4dc8c363ca72fa2c0d294ea4a0a9bba75d/icons/deutschebank.svg) | [官方资料](https://www.db.com) |

## 2026-10-08：个人导航补充

补充 68 个文件，继续使用现有单文件、单主要用途规范。优先保留清晰的用户 SunPanel 原图或图标库素材；没有将截图、模糊的 16–64 像素图片强行放大并称为高质量图标。原站或原始素材足够清晰时使用真实图案，其余采用 4 枚通用用途图案。

[逐项机器可读记录](navigation-sources.json) 保存原始 URL 或 `uploads.zip!<路径>`、固定提交、获取日期、原始尺寸、源文件与成品 SHA-256；用户归档提供者为 zzpice，原始作者与许可无法从压缩包推定，不宣称取得开放授权。未使用的归档文件不发布。原配置的 Censys / Scamalytics 图案互换已按官网核对纠正。Music Tag Web 沿用用户选择的 Navidrome 图案，共用一个文件，不声明是其官方标识。

Dashboard Icons 保留 [Apache-2.0](licenses/dashboard-icons-apache-2.0.txt)，selfh.st（selfhst/icons）保留 [CC BY 4.0](licenses/selfhst-cc-by-4.0.txt)；作者与许可沿用各固定版本。原站 favicon 未发现开放许可时保留原站权利，只用于入口识别。品牌与商标权利属于相应权利人。

等比缩放并留边、以白色衬底（XVIDEOS 为深色）合成 512×512 RGBA，使用 r=115 遮罩令圆角外完全透明；SVG 用 Sharp 光栅化。来源尺寸和处理限制记录于目录 note，PNG 内嵌来源、许可与修改说明。原始二进制不重复入库，不生成额外尺寸或明暗变体。

4 枚通用用途图案通过 OpenAI ImageGen 生成，再按相同规则标准化；不是缺失网站的官方 logo。完整提示词见 JSON；AI 生成不等于已授予开放许可，本批未另行指定资源许可。

| 名称 | 文件 | 原始来源 / 生成 | 许可 / 权利 |
|---|---|---|---|
| YouTube | [youtube.png](media/youtube.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/youtube.png) | Apache-2.0 |
| bilibili | [bilibili.png](media/bilibili.png) | 用户提供：`uploads.zip!2025/8/3/fc6f4e349e0347956396e39680111e2c.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| YouTube Music | [youtube-music.png](media/youtube-music.png) | 用户提供：`uploads.zip!2025/8/2/b84ee9af917ea2e3ba96ba3a3c9f1fe9.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| ‎Apple Music | [apple-music.png](media/apple-music.png) | 用户提供：`uploads.zip!2025/8/2/dd466d96aa536072bc2c2c487eb97d83.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| X | [x.png](social/x.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/x.png) | Apache-2.0 |
| Spotify | [spotify.png](media/spotify.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/spotify.png) | Apache-2.0 |
| Notion | [notion.png](productivity/notion.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/notion.png) | Apache-2.0 |
| Pamir University | [pamir-mail.png](productivity/pamir-mail.png) | [源文件](https://mail.ryanvan.com/assets/mail-CSokca-y.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| AGSVPT公开图床 | [agsv-image.png](productivity/agsv-image.png) | [源文件](https://img.seedvault.cn/favicon.ico) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| Anki中文网 | [anki.png](learning/anki.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/anki.png) | Apache-2.0 |
| PDF Guru Anki | [pdf-guru-anki.png](productivity/pdf-guru-anki.png) | [源文件](https://guru.kevin2li.top/img/favicon.ico) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 云深考公 | [wolai.png](productivity/wolai.png) | [源文件](https://cdn.wostatic.cn/dist/app_icon_1024.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| RouterOS | [routeros.png](network/routeros.png) | 用户提供：`uploads.zip!2025/8/2/538390352d48e021a376b5f1998ef4de.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| PVE | [proxmox.png](self-hosted/proxmox.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/proxmox.png) | Apache-2.0 |
| 飞牛 fnOS | [fnos.png](self-hosted/fnos.png) | 用户提供：`uploads.zip!2025/10/5/742062dcfd3329a46eae48b437b178eb.webp` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| MoviePilot | [movie-pilot.png](media-players/movie-pilot.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/movie-pilot.png) | Apache-2.0 |
| qBittorrent | [qbittorrent.png](self-hosted/qbittorrent.png) | 用户提供：`uploads.zip!2025/8/2/0069b64e2f920b339bc8906c132cc5cd.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Emby Nginx | [emby-nginx.png](network/emby-nginx.png) | 用户提供：`uploads.zip!2025/8/29/d64a9189dccbc0d187ca2c306acc4cc4.ico` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| SMBox | [smbox.png](self-hosted/smbox.png) | 用户提供：`uploads.zip!2025/8/2/510e0166260c755a4656b9386d5a805c.webp` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| 5G CPE 5s | [huawei.png](network/huawei.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/huawei.png) | Apache-2.0 |
| Sub Store | [sub-store.png](network/sub-store.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/sub-store.png) | Apache-2.0 |
| Sun-Panel-Helper | [sun-panel-helper.png](self-hosted/sun-panel-helper.png) | 用户提供：`uploads.zip!2025/9/21/a526061d89f242f185af79c59881c538.svg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Navidrome | [navidrome.png](media-players/navidrome.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/navidrome.png) | Apache-2.0 |
| V2EX | [v2ex.png](social/v2ex.png) | [源文件](https://www.v2ex.com/static/icon-192.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| HOSTLOC | [hostloc.png](social/hostloc.png) | 用户提供：`uploads.zip!2025/8/2/e4541549a99c2812fc5475b08d375f09.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| LINUX DO | [linuxdo.png](social/linuxdo.png) | 用户提供：`uploads.zip!2025/8/2/3f960dab58095f53518f8ef4cca42c54.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Chiphell | [chiphell.png](social/chiphell.png) | 用户提供：`uploads.zip!2025/8/2/e397032de0f8326d031a001a2b095bd8.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| NGA | [nga.png](social/nga.png) | 用户提供：`uploads.zip!2025/8/2/8aa4783db3c1c6f9ac3de51192257a52.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| NodeSeek | [nodeseek.png](social/nodeseek.png) | [源文件](https://www.nodeseek.com/static/image/favicon/android-chrome-512x512.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 爆棚小组 | [playgm.png](social/playgm.png) | 用户提供：`uploads.zip!2025/8/2/107c2c1ba050600d0d35b1200dff92ba.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| MikroTik | [mikrotik.png](network/mikrotik.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/mikrotik.png) | Apache-2.0 |
| Reddit | [reddit.png](social/reddit.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/reddit.png) | Apache-2.0 |
| 巴哈姆特 | [bahamut.png](social/bahamut.png) | [源文件](https://i2.bahamut.com.tw/favicon.svg?v=1689129528) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 吾爱破解 | [52pojie.png](social/52pojie.png) | [源文件](https://www.52pojie.cn/favicon.svg) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| M-Team | [m-team.png](media/m-team.png) | 用户提供：`uploads.zip!2025/8/2/56074ee5acb824c6347818303289b768.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Audiences | [audiences.png](media/audiences.png) | 用户提供：`uploads.zip!2025/8/2/beebdf7a3c2f26c5156f0d5ebfc86a25.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| HDKylin | [hd-kylin.png](media/hd-kylin.png) | 用户提供：`uploads.zip!2025/8/2/a1fea89e3de75f137e4a8ef07a566396.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| BTSCHOOL | [btschool.png](media/btschool.png) | 用户提供：`uploads.zip!2025/8/2/61325ce1fd4c2f6a0f316faba356a387.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| 朱雀 | [zhuque.png](media/zhuque.png) | [源文件](https://zhuque.in/assets/images/512.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 瓜牛居士 | [guaniu.png](media/guaniu.png) | 用户提供：`uploads.zip!2025/8/2/35cc993523ef54a4928bf1aefabddba0.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| BTNULL | [btnull.png](media/btnull.png) | 用户提供：`uploads.zip!2025/8/2/b51e5260a736dfab11ef03eafee349a4.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| 哲风壁纸 | [haowallpaper.png](media/haowallpaper.png) | [源文件](https://haowallpaper.com/favicon.ico) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 最全IPTV电视直播源及工具 | [flowus.png](media/flowus.png) | [源文件](https://cdn2.flowus.cn/assets/flowus-favicon-36b0b2bc.svg) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 明月浩空网 | [myhkw.png](media/myhkw.png) | [源文件](https://myhkw.cn/favicon.ico) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| 阿里云 | [aliyun.png](cloud/aliyun.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/aliyun.png) | Apache-2.0 |
| Nexitally | [nexitally.png](network/nexitally.png) | [源文件](https://naiixi.com/images/mainlogo.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| YToo | [ytoo.png](cloud/ytoo.png) | 用户提供：`uploads.zip!2025/8/2/9c9e642bd64196f7e2dc1e5549eba6de.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Proxmox VE Helper | [proxmox-helper-scripts.png](self-hosted/proxmox-helper-scripts.png) | [源文件](https://raw.githubusercontent.com/selfhst/icons/2053b70b283ffed5f2cc1424d1e17d9c554a846d/png/proxmox-helper-scripts.png) | CC BY 4.0 |
| Speedtest | [speedtest.png](network/speedtest.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/ookla-speedtest.png) | Apache-2.0 |
| ITDOG | [itdog.png](network/itdog.png) | 用户提供：`uploads.zip!2025/8/2/f2290234fa87a2b789733af81ca9e18c.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| ipleak | [ipleak.png](network/ipleak.png) | 用户提供：`uploads.zip!2025/8/2/2fddd1ff3eb51db9f2b909e0065f43f6.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| ip位置查询 | [geolocation.png](network/geolocation.png) | 用户提供：`uploads.zip!2025/8/2/3bf3d4ed85d239ad622db206575dbd5e.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Censys | [censys.png](network/censys.png) | 用户提供：`uploads.zip!2025/8/2/2c35f6af1730bf7d12e8a97f80bad43d.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| Scamalytics | [scamalytics.png](network/scamalytics.png) | [源文件](https://scamalytics.com/wp-content/uploads/2016/06/icon_128.png) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| Cloudflare | [cloudflare.png](cloud/cloudflare.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/cloudflare.png) | Apache-2.0 |
| NameSilo | [namesilo.png](cloud/namesilo.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/name-silo.png) | Apache-2.0 |
| GNAME | [gname.png](network/gname.png) | 用户提供：`uploads.zip!2025/8/2/d72d08cbbe4e5a4c6907877a7c05167c.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| porkbun | [porkbun.png](cloud/porkbun.png) | [源文件](https://raw.githubusercontent.com/homarr-labs/dashboard-icons/57e939e504eda0ea764098015da93aa666ad6f31/png/porkbun.png) | Apache-2.0 |
| 南+ South Plus | [south-plus.png](adult/south-plus.png) | 用户提供：`uploads.zip!2025/8/2/cd3fef69710b9dea8dd0b4ec0b57577b.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| moxing | [moxing.png](adult/moxing.png) | 用户提供：`uploads.zip!2025/8/2/8e264bc2c63e4694253d7c560a0d52ee.jpeg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| 98堂 | [sehuatang.png](adult/sehuatang.png) | 用户提供：`uploads.zip!2025/8/2/f1698bccb6185ae9c5fded33a55794d7.jpg` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| pixiv | [pixiv.png](social/pixiv.png) | [源文件](https://raw.githubusercontent.com/selfhst/icons/2053b70b283ffed5f2cc1424d1e17d9c554a846d/png/pixiv.png) | CC BY 4.0 |
| XVIDEOS | [xvideos.png](adult/xvideos.png) | [源文件](https://assets-cdn77.xvideos-cdn.com/v3/img/skins/default/logo/xv.white.svg) | 未发现开放许可；原站标识权利归原权利人，仅用于识别 |
| Pornhub | [pornhub.png](adult/pornhub.png) | 用户提供：`uploads.zip!2025/8/2/0fdc70cd6143692e9ba09d8cc242037e.png` | 用户提供的 SunPanel uploads；原始作者或开放许可未确认，品牌权利归相应权利人 |
| 知识卡片 | [knowledge-cards.png](productivity/knowledge-cards.png) | OpenAI ImageGen（通用图案） | AI 生成，未另行指定开放许可；通用用途图案，不是对应网站的官方品牌 |
| 私有服务 | [private-service.png](self-hosted/private-service.png) | OpenAI ImageGen（通用图案） | AI 生成，未另行指定开放许可；通用用途图案，不是对应网站的官方品牌 |
| 社区交流 | [community.png](social/community.png) | OpenAI ImageGen（通用图案） | AI 生成，未另行指定开放许可；通用用途图案，不是对应网站的官方品牌 |
| 影音资源 | [media-library.png](media/media-library.png) | OpenAI ImageGen（通用图案） | AI 生成，未另行指定开放许可；通用用途图案，不是对应网站的官方品牌 |

## 2026-10-08 第二轮导航修复

仅替换导航中 8 个通用图案引用，已有 129 枚图标文件保持不变。S-UI 保留完整 [GPL-3.0 许可](licenses/s-ui-frontend-gpl-3.0.txt)；修改与固定上游来源记录在 [navigation-sources.json](navigation-sources.json)。低清放大与确定性几何重建均有明确说明，没有新增 AI 图案。

| 名称 | 文件 | 来源 |
|---|---|---|
| S-UI | [s-ui.png](self-hosted/s-ui.png) | [S-UI 原站素材](https://raw.githubusercontent.com/alireza0/s-ui-frontend/e4525297b002c1c3be234cc1c9695ef84be741a0/public/assets/icon-512.png) |
| DMIT | [dmit.png](cloud/dmit.png) | [DMIT 原站素材](https://www.dmit.io/templates/dmit_theme_2020/dmit/assets/images/dmit_logo_with_text.svg) |
| bandwagonhost | [bandwagonhost.png](cloud/bandwagonhost.png) | [bandwagonhost 原站素材](https://bandwagonhost.com/templates/organicbandwagon/images/logo4.png) |
| AGSV | [agsv.png](media/agsv.png) | [AGSV 原站素材](https://www.agsvpt.com/pic/login_left.png) |
| CHDBits | [chdbits.png](media/chdbits.png) | [CHDBits 原站素材](https://ptchdbits.co/chdbits.png) |
| 禁忌书屋 | [jinji-books.png](adult/jinji-books.png) | 用户原始归档，详见来源记录 |
| kikkua · 知识卡片 | [kikkua.png](productivity/kikkua.png) | [kikkua · 知识卡片 原站素材](https://kikkua.online/) |
| MissAV | [missav.png](adult/missav.png) | 用户原始归档，详见来源记录 |

## 2026-10-09 GitHub 文件加速项目图标

[development/github-proxy.png](development/github-proxy.png) 为本项目使用 Codex 原创绘制的几何图标，以端正的文件轮廓和下载箭头表示文件加速工具，不采用 GitHub 官方 Logo。沿用现有项目图标的纯色底板与白色线条，无渐变或阴影。成品为 512×512 PNG / RGBA，按现有 r=115 整数圆角掩码将外侧 alpha 置零；主体从高分辨率几何图形等比采样，无第三方图形素材。原创图案未另行指定开放许可。

SHA-256：`4f35bd9aa767cbcbebf2c0310632a713f191180690e6f2560efe0c9494c60179`。图标原图只在本仓库维护，zzp-home 通过固定提交与校验值生成发布资源。
