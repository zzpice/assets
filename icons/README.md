# 精选图标

精选图标，覆盖常用服务、金融机构、代理客户端、线路及常用国家和地区。每项保留一个文件，用于个人导航、文档、网页和代理客户端。

**图片标准：512×512 PNG、RGBA，r=115 圆角外侧完全透明，保留主体底色和图形。**

## 分类

| 用途 | 目录 |
|---|---|
| AI | [ai/](ai/) |
| 媒体播放器 | [media-players/](media-players/) |
| 游戏 | [gaming/](gaming/) |
| 银行、券商与金融机构 | [finance/](finance/) |
| 开发工具 | [development/](development/) |
| 代理客户端 | [proxy-clients/](proxy-clients/) |
| 线路与专线 | [routes/](routes/) |
| 国家与地区 | [regions/](regions/) |
| 影音与资源 | [media/](media/) |
| 社区与社交 | [social/](social/) |
| 效率工具 | [productivity/](productivity/) |
| 学习 | [learning/](learning/) |
| 网络工具 | [network/](network/) |
| 设备与自托管 | [self-hosted/](self-hosted/) |
| 云与域名 | [cloud/](cloud/) |
| 成人网站 | [adult/](adult/) |

文件路径为 `icons/<分类>/<名称>.png`，名称使用小写英文、数字和短横线。同一图标只归入一个主要用途，不按母公司嵌套，不制作多尺寸或明暗变体。

表格顺序也是网站「全部种类」的默认分组顺序；筛选菜单与分组标题使用同一顺序。尺寸或名称排序只调整组内图片，不打乱分类。

分类以主要用途为准：Surge、Clash 归代理客户端；BGP、GIA、IEPL、IPLC 归线路。媒体播放器、游戏等服务独立归类，不按母公司分类。

## 使用与来源

- [浏览资源](https://zzpice.github.io/assets/)的「图标」页支持用途筛选、预览、下载、收藏和复制链接。
- 单图直链示例：`https://zzpice.github.io/assets/icons/ai/claude.png`。
- 35 个图片来自 [Oasisic-Icons](https://github.com/Hawaiine/Oasisic-Icons/tree/f0f3bc2a44616885682ee5f0e5921540b964e2d8)，保留完整 [MIT 许可](licenses/oasisic-mit.txt)。品牌标识用于识别对应服务，品牌权利归各权利人。
- 另从 [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons/tree/adca944175c9a3eb0471f78a4da87f237476d585) 选取 3 个常用图标，保留完整 [Apache-2.0 许可](licenses/dashboard-icons-apache-2.0.txt)。按需转换通道、补充透明画布或等比留边，并通过相同图片标准；没有收录同名的 Stash 媒体管理图标。
- [完整清单与逐项来源](SOURCES.md)固定到本次审查的提交。所有修改均在清单和对应文件中注明；其余图片原样保存。
- 金融分类收录 23 个代表性品牌，采用经官方资料核对的 SVG 转换，按同一尺寸、RGBA 和圆角标准处理；同品牌只收录一个代表性图标。逐项来源、品牌版本、处理方式与许可见清单末节。
- 金融图标按品牌总部所在地的常用名称展示：中国大陆银行使用中文，国际品牌保留总部常用名称，例如 DBS、OCBC、UOB。每项只维护 `title`，不追加中英文对照、地区适用说明或搜索别名，不另建总部或语言字段；搜索使用标题和文件路径，来源清单中的中英文对照仅用于核对品牌。
- 现有整理工具检查 PNG、512×512、RGBA 和圆角边界；只检查，不自动修图。
- 2026-10-08 为个人导航补充 68 枚图标：优先选取清晰的 SunPanel 原图、固定版本图标库及原站素材，4 枚为 AI 生成的通用用途图案。原始归档中的截图、模糊小图或选错品牌的图片不直接迁入。逐项 URL、许可、原始尺寸、SHA-256 与处理说明见 [导航补充来源](navigation-sources.json)；低分辨率 favicon 的放大不代表细节恢复。
- 第二轮仅补充 8 枚原站 / 归档标识：AGSV 使用官网 666×666 徽章，DMIT 使用官网矢量，S-UI 使用固定上游 512px 素材；kikkua 还原内联书本 favicon，MissAV 按原图的简单几何修复。原有图标文件不变，来源和尺寸限制逐项记录。
- 整理日期：2026-10-08。按实际需要手动增加或替换，不自动同步上游，不引入安装包、订阅配置或新的构建流程。

## 新增、替换与检查

新增或替换时核对品牌、图片标准及逐项来源，同步更新 [SOURCES.md](SOURCES.md)、相应许可文件；当前数量由网页目录自动统计。展示名在 `catalog.json` 对应图片的 `title` 中维护，金融图标沿用上面的品牌命名约定。

新分类会自动追加到已有分类之后；需要调整默认顺序或中文名称时，更新 `app/site.js` 的 `iconCategoryLabels` 和本页分类说明。

完成后按[更新与检查](../scripts/README.md#更新与检查)生成目录并验证。工具只检查图片标准，不自动修图，也不为图标生成重复预览；界面分类清单变动同样需要更新页面和缓存版本。
