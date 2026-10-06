# 游戏封面

收藏已确认版本的官方封面，统一为 **1000×1500 px、2:3、RGB**。按需增加系列与版本，不自动抓取或补齐全部作品。[在图库浏览](https://zzpice.github.io/assets/)。

## 组织与版本

```text
game-covers/<系列>/<作品>/<发行性质-平台-地区>.jpg
```

例如 `zero-escape/999/original-nds-na.jpg`。PNG 同样受支持；以绘画、渐变为主的封面默认用高质量 JPEG，细小文字或无损需求可以选 PNG。目录及文件名使用小写英文、数字和短横线；所有封面规格相同，无需重复建立尺寸目录。平台或地区有区别时，使用明确名称，不用含义不明的 `-v2`。

- **主封面**：`edition: "main"`，必须是原游戏的独立首发版本官方封面，`cover.releaseType: "original"`。每款作品最多一个主封面。不同地区首版可择其一，但必须确认地区、版本并记录选择理由。
- **其他版本**：`edition: "alternate"`，使用新文件名，记录版本、平台、地区和该版本年份。`releaseType` 支持 `original`（另一地区／同时首发平台）、`port`、`remaster`、`remake`、`reissue`、`collection`。后续版本不能替代主封面；首版暂无可靠素材时允许仅收录其他版本，工具不会自动提升为主封面。
- **合集**：单独登记作品，例如 `<系列>/the-nonary-games/collection-ps4-na.jpg`；用 `games[].includes` 关联原作品键（`系列/作品`），标为 `alternate`、`collection`。合集自己的首发年份属于合集，原游戏首发年份仍在各自作品记录中。不把同一合集封面复制到每个原作品目录，也不把合集当作原作主封面。
- 没有系列的独立游戏可用 `standalone` 系列，展示名为「独立作品」；不为每个游戏另建无实际关系的系列。

## 元数据与来源

复用根目录 [catalog.json](../catalog.json)，不另建逐作品 README 或重复来源表。按展示顺序维护 `gameSeries`（`id`、`title`）；`games` 每款记录一次 `series`、`id`、`title`、`firstReleaseYear`、`firstReleaseSource`，合集另记录 `includes`。

`firstReleaseYear` 是作品在全球最早的正式发行年份，排除试玩、抢先体验；不是所选图片的地区发行年份、移植或重制年份，也不是源图片上传年份。地区首版可以晚于全球首发，例如本批《999》的作品首发是 **2009**，北美 NDS 首版是 **2010**。

每张图片在 `assets` 登记 `path`、`title`、`edition`，以及：

| 字段 | 记录内容 |
|---|---|
| `cover` | `version`、`releaseType`、`platform`、`region`、`releaseYear`、`releaseSource`（当前版本的发行出处） |
| `source` | `publisher`、`page`（出处页面或官方媒体记录）、`url`（官方源文件）、`retrieved`（获取日期）、原文件 `sha256`、显示尺寸 `width` / `height` |
| `processing` | `mode`、原图坐标 `crop`（左、上、右、下）、`background`、等比缩放倍数 `scale`、最终文件 `sha256` |
| `note` | 原始尺寸、裁切／留边及放大说明；必要时说明版本和地区选择依据 |

`kind`、`category`、`game`、实际尺寸、文件大小、内容标识和小型预览由现有工具生成。网站按系列分组、作品首发年份排列，同一作品各版本相邻，默认主封面在前；支持系列、作品、主／其他版本筛选，图片信息可查看作品首发、当前版本及来源链接。根 README 只保留入口，新增作品不需扩展首页或维护多个清单。

## 图片适配与维护

1. 核对游戏、首发、平台、地区与封面版本。优先开发商、发行商或官方游戏平台的源文件；不使用搜索缩略图或来源不明转载。来源不完整或质量明显不足时暂不收录。
2. 将源文件下载到仓库之外的工作目录，先人工检查。使用 [标准化工具](../scripts/normalize_cover.py) 显式选择裁切或留边；裁切须人工指定 2:3 范围，尽量保留标题、标志和人物。裁切会损坏构图时，等比缩放加纯色留边。不得拉伸、重绘、重新拼接文字／Logo 或使用 AI 重构封面。
3. 工具打印来源尺寸、两个 SHA-256、处理参数与 `note`，把这些字段连同发行及来源资料合并到 `catalog.json`。原始下载文件不作为图库图片重复收录；保留官方原文件链接与哈希以供核对。工具不会覆盖源文件或已有封面。
4. 按 [维护说明](../scripts/README.md) 生成目录和预览，并运行 `--check`。检查精确尺寸、真实格式、RGB、必需元数据、年份、唯一主封面、合集关联和最终文件哈希；来源是否可靠、构图是否完整仍须人工确认。

```sh
# 原图裁切会丢失重要内容时，保留完整封面，居中留边
python3 scripts/normalize_cover.py ../cover-work/source.jpg \
  game-covers/example/game/original-switch-jp.jpg --mode contain --background '#ffffff'

# 人工确认裁切范围后，按原图像素坐标指定（此示例范围恰为 2:3）
python3 scripts/normalize_cover.py ../cover-work/source.jpg \
  game-covers/example/game/original-switch-jp.jpg --mode crop --crop 100 0 1100 1500

python3 scripts/update_catalog.py
python3 scripts/update_catalog.py --check
```

素材需要放大时工具默认停止；先寻找更高质量原图，确认质量可用后才显式添加 `--allow-upscale`，并保留放大说明。输出为 1000×1500 不代表原图具有该分辨率，也不会通过 AI 补充细节。

## 首批收录与取舍

| 游戏 | 作品首发 | 主封面 | 官方源图 | 处理 |
|---|---:|---|---|---|
| 999：9小时9人9扇门 | 2009 | 北美 Nintendo DS 独立首版，2010 | Aksys，800×718 | 完整保留，等比放大 1.250 倍至 1000×898，白色留边 |
| 极限脱出：刻之困境 | 2016 | 北美 PlayStation Vita 独立首版，2016 | Aksys，803×1024 | 完整保留，等比放大约 1.245 倍至 1000×1275，白色留边 |

选择北美首版是因为当前可取得并确认 Aksys 官方源文件，且两张平台包装、评级和发行商标识清楚；中文展示标题与原封面文字分开维护，不翻译或改动官方画面。《999》源图没有后来再版新增的 Zero Escape 系列标识，保留九人群像首版构图；不是 2012 年换封面再版或高清合集。首发与当前版本的具体出处见 `catalog.json`；《999》2009 年由开发商官网确认，北美发行资料与《刻之困境》的发行资料经 GameFAQs 核对，并与官方游戏平台的 2016 年信息交叉确认。

这两张是官网提供的中等分辨率文件，已明确记录有限放大，不宣称为高清扫描。暂不收录《善人死亡》及《The Nonary Games》：本次尚未获得同时满足版本确认和图片质量要求的官方封面；部分早期官网已失效。没有推测缺失的版本、地区或年份，也没有用当前重制／合集素材补作首版。

图片、美术、标题及标志的权利归原权利人，标准化处理不产生新的官方版本，也不另授开源许可。整理日期：2026-10-06。
