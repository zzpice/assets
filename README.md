# 静态资源库

个人壁纸、头像与静态资源，使用 GitHub Pages 提供固定图片外链。

- [浏览与筛选资源](https://zzpice.github.io/assets/)
- [GitHub 仓库](https://github.com/zzpice/assets)

首页支持按壁纸种类、实际分辨率、横竖屏方向筛选，也可搜索名称、下载图片和复制外链。

## 目录与命名

壁纸统一按「种类 → 实际分辨率 → 图片」存放：

```text
wallpapers/<category>/<width>x<height>/<name>.<ext>
```

当前目录：

```text
avatar.png
wallpapers/
  anime/
    945x2048/
      anime-girl-rain.png
    1440x3120/
      anime-girl-wink-shh.png
catalog.json                # 可选标题、尺寸与处理说明
index.html
```

种类按画面内容与风格选择。以下目录有对应资源时再创建：

| 目录名 | 壁纸种类 |
| --- | --- |
| `anime` | 动漫 |
| `landscape` | 风景 |
| `minimal` | 极简 |
| `abstract` | 抽象 |
| `gaming` | 游戏 |
| `photography` | 摄影 |
| `other` | 其他壁纸 |

一个文件只归入一个主要种类。横屏、竖屏、方形由实际宽高判断，不再增加目录层级。头像放在 `avatars/`，主头像仍固定使用根目录 `avatar.png`；其他资源可使用 `logos/`、`screenshots/` 等用途目录。

### 文件名

- 使用小写英文、数字与短横线，名称简短、能描述画面，例如 `anime-girl-rain.png`。
- 分辨率已写在目录中，文件名无需重复分辨率。
- 同一壁纸的不同尺寸分别放进各自的分辨率目录，可沿用同一文件名。
- 同目录内的不同版本使用 `-v2`、`-v3` 后缀，避免覆盖已有图片。

### 分辨率

- `宽x高` 使用文件的**实际像素尺寸**，例如 `1440x3120`，不用 `2k`、`4k`、`hd` 等含糊标记。
- 按宽、高的顺序填写，不因手机或电脑用途交换数字。
- 放大后的版本可以按最终实际尺寸归档，但不得将其称为原生分辨率生成；可在 `catalog.json` 的 `note` 中注明来源与放大处理。
- 当前雨夜壁纸实际为 **945×2048**；眨眼壁纸实际为 **1440×3120**，由 853×1844 重绘稿放大导出。

## 图片地址

推荐使用 Pages 外链：

```text
https://zzpice.github.io/assets/<文件路径>
```

当前壁纸：

| 图片 | 分辨率 | 图片地址 |
| --- | --- | --- |
| 眨眼少女 · 嘘 | 1440×3120 | [打开图片](https://zzpice.github.io/assets/wallpapers/anime/1440x3120/anime-girl-wink-shh.png) |
| 雨夜少女 | 945×2048 | [打开图片](https://zzpice.github.io/assets/wallpapers/anime/945x2048/anime-girl-rain.png) |

Raw 地址仅作备用：

```text
https://raw.githubusercontent.com/zzpice/assets/main/<文件路径>
```

主头像地址保持固定：<https://zzpice.github.io/assets/avatar.png>。

## 新增资源

1. 核对文件的实际宽高、格式与画面内容。
2. 按种类选择目录，再按实际宽高创建分辨率目录。
3. 用符合规则的描述性英文文件名上传图片。
4. 首页会自动发现新图片，并从目录读取种类和分辨率；不必手动维护图片列表。
5. 如需中文标题或处理说明，再向 `catalog.json` 添加可选元数据。

`catalog.json` 记录 `path`、`title`、`kind`、`category`、`width`、`height`，以及可选的 `note`。它同时作为 GitHub 列表接口暂时不可用时的备用目录。宽高必须与图片文件和分辨率目录一致。未登记的图片仍会自动显示。

## 发布约定

- 保持纯静态站点与 `.nojekyll`，不引入构建框架或额外依赖。
- 不预建空目录；有实际图片时再创建。
- Pages 为主要地址，Raw 为备用地址。
- 更新图片时遵循用途、种类、实际分辨率和版本命名规则。
