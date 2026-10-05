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
| 兴业银行 / CIB | [cib.png](finance/cib.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/cib-rect.svg) | [官方资料](https://www.cib.com.cn/cn/aboutCIB/investor/profile/logo.html) |
| HSBC / 汇丰银行 | [hsbc.png](finance/hsbc.png) | [源 SVG](https://github.com/simple-icons/simple-icons/blob/98820a4dc8c363ca72fa2c0d294ea4a0a9bba75d/icons/hsbc.svg) | [官方资料](https://www.hsbc.com/news-and-views/our-brand-in-action) |
| 恒生银行 / Hang Seng Bank | [hang-seng-bank.png](finance/hang-seng-bank.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/hangseng-rect.svg) | [官方资料](https://www.hangseng.com) |
| Standard Chartered / 渣打银行 | [standard-chartered.png](finance/standard-chartered.png) | [源 SVG](https://github.com/auraveni/global-bank-logos/blob/ad33060ca976397a9fcb46dd40c2d77bce5ce7e1/assets/bank/international-bank/standard.svg) | [官方资料](https://www.sc.com/en/media/) |
| DBS / 星展银行 | [dbs.png](finance/dbs.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/dbs-rect.svg) | [官方资料](https://www.dbs.com/newsroom/DBS_unveils_new_brand_campaign) |
| OCBC / 华侨银行 | [ocbc.png](finance/ocbc.png) | [源 SVG](https://github.com/auraveni/global-bank-logos/blob/ad33060ca976397a9fcb46dd40c2d77bce5ce7e1/assets/bank/international-bank/ocbc.svg) | [官方资料](https://www.ocbc.com/group/about-us/our-brand.page) |
| UOB / 大华银行 | [uob.png](finance/uob.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/uobchina-rect.svg) | [官方资料](https://www.uobgroup.com/uobgroup/about/index.page) |
| UBS / 瑞银 | [ubs.png](finance/ubs.png) | [源 SVG](https://github.com/icongo/bank-logos/blob/ffca539a043900fbf2a4fd6a5d32f1706ae5dfd1/logos/ubs-rect.svg) | [官方资料](https://www.ubs.com/global/en/our-firm/our-history.html) |
| Deutsche Bank / 德意志银行 | [deutsche-bank.png](finance/deutsche-bank.png) | [源 SVG](https://github.com/simple-icons/simple-icons/blob/98820a4dc8c363ca72fa2c0d294ea4a0a9bba75d/icons/deutschebank.svg) | [官方资料](https://www.db.com) |
