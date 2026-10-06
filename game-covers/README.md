# 游戏封面

收藏真实、可确认作品与版本的正式发行封面。成品统一为 **1000×1500 px、2:3、RGB**，使用 JPEG 或 PNG。[浏览图库](https://zzpice.github.io/assets/)。

## 组织与主封面

```text
game-covers/<系列>/<作品>/<平台-地区[-版本]>.jpg
```

目录与文件名用小写英文、数字和短横线；已有文件保留路径。不同封面另取名称，不覆盖其他作品。无系列作品可归入 `standalone`（独立作品）。

- `edition: "main"` 是**这个登记作品在图库中的代表封面**，每个作品最多一张；`alternate` 是同作品的其他版本或地区封面，不会自动升为主封面。
- 原版、独立登记的 Remake 和合集都可以各有自己的 `main`。独立作品使用不同作品 ID 和目录；合集封面放在合集目录，不复制到原作目录充当其代表封面。
- 原作通常优先选择独立首版。后续版本不要误归到另一个作品，必要时用简短的 `version` 标明，例如「高清版（2017）」或「北美首版（2010）」。

## 最少登记信息

仅维护根目录 [catalog.json](../catalog.json)：

- `gameSeries`：每个系列的 `id`、`title`。
- `games`：每个作品的 `series`、`id`、`title`、`firstReleaseYear`。年份指**该登记作品全球最早的正式发行年份**，不是所选封面的地区、移植或重发年份；独立登记的重制／合集记录自己的首发年。
- 每张封面：`path`、`edition`、`cover.platform`、`cover.region`、`source`（一个出处页面或原图 HTTP(S) 链接）。仅有必要时补充 `cover.version` 和简短 `note`。

```json
{
  "path": "game-covers/zero-escape/virtues-last-reward/ps-vita-na.jpg",
  "edition": "main",
  "cover": { "platform": "PlayStation Vita", "region": "North America" },
  "source": "https://images.launchbox-app.com/6cd07fb7-2431-4a5a-957d-671c821ef33c.jpg",
  "note": "LaunchBox 源图 1920×2496，等比缩小、白色留边。"
}
```

作品归属来自目录，图片标题从作品记录生成，避免重复抄写串错。工具维护实际宽高、大小、内容标识与缩略图；不再人工维护发行出处、发行商、获取日期、哈希、裁切坐标或缩放倍数。网站保留系列／作品／主与其他版本筛选，按作品首发年分组排序，详情只补充版本、图片规格、一个来源链接与短说明。

## 来源与适配

优先开发商、发行商和官方游戏平台；可靠游戏数据库、资料站、历史媒体库以及版本可确认的封面扫描也可收录。核对作品、平台、地区及正式封面身份，不使用搜索缩略图、来源不明转载、同人图、评级待定的宣传样稿或 AI 重绘／补绘图。年份和版本不确定时先核实，不猜测。

没有原图分辨率硬门槛。可靠老素材可等比放大，人工确认清晰度可接受，并在短 `note` 中注明源图尺寸与放大；不把输出尺寸当作原图清晰度。优先合理裁切，裁切会损坏标题、Logo、人物或构图时保留全图并留边。不得拉伸或改动核心美术。

下载源图到仓库外并检查后，用 [normalize_cover.py](../scripts/normalize_cover.py) 等比处理；工具允许放大，只打印一条可使用的短说明，不覆盖源文件或已有封面：

```sh
python3 scripts/normalize_cover.py ../cover-work/source.jpg \
  game-covers/example/game/ps-vita-na.jpg --mode contain --background '#ffffff'
# 裁切时显式指定人工确认的 2:3 范围
python3 scripts/normalize_cover.py ../cover-work/source.jpg \
  game-covers/example/game/ps-vita-na-crop.jpg --mode crop --crop 100 0 1100 1500
python3 scripts/update_catalog.py
python3 scripts/update_catalog.py --check
```

校验硬规则为已登记的唯一系列／作品、有效首发年、核心封面字段、每作品最多一个主封面，以及实际 1000×1500、RGB、JPEG／PNG 格式。等比处理由标准化工具保证；来源可信度、版本归属与构图仍需人工确认，不用复杂元数据假装机器可以判断。

目前收录《999》（2009）、《善人死亡》（2012）、《刻之困境》（2016）。前后两款保留各自 Aksys 源图；《999》明确区分作品首发 2009 与北美封面 2010，不再链接到续作页面。《善人死亡》使用 [LaunchBox 北美 PS Vita 正式正面封面](https://gamesdb.launchbox-app.com/games/images/12105-zero-escape-virtues-last-reward)，保留完整画面并留边；2012 首发年经[作品官网](https://www.spike-chunsoft.co.jp/pages/zendesu/extra/index.html)核对。新增作品只改目录和 catalog，无需扩展本 README 的收录清单。

封面美术、标题与商标归原权利人，本仓库不另授许可。
