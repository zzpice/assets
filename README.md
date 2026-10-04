# 静态资源库

个人常用图片与静态资源，使用 GitHub Pages 提供固定外链。

> 图片直接放进仓库即可；主页会自动读取并展示所有图片，不需要手动维护列表。

## 入口

- Pages：`https://zzpice.github.io/assets/`
- GitHub：`https://github.com/zzpice/assets`

## Avatar

<img src="https://zzpice.github.io/assets/avatar.png" alt="avatar" width="256">

**推荐地址**

```text
https://zzpice.github.io/assets/avatar.png
```

**备用 Raw 地址**

```text
https://raw.githubusercontent.com/zzpice/assets/main/avatar.png
```

## 使用方式

以后把图片提交到仓库任意目录，对外地址固定为：

```text
https://zzpice.github.io/assets/<文件路径>
```

例如：

```text
backgrounds/macos.png
→ https://zzpice.github.io/assets/backgrounds/macos.png
```

推荐按用途分类：

```text
avatar.png
avatars/
backgrounds/
logos/
screenshots/
```

主头像继续固定使用根目录的 `avatar.png`。其他图片按需放进对应目录即可。

## 约定

- 文件名优先使用小写英文、数字和短横线。
- 不为目录预建空文件夹；有实际图片时再创建。
- 不引入额外构建框架或依赖。
- `.nojekyll` 保持纯静态发布。
- Pages 为主地址，Raw 仅作为备用。
- 已经对外引用的文件尽量不要改名、移动或删除，以免旧链接失效。
- 覆盖同名文件后，Pages 或引用平台可能因缓存暂时显示旧版本。
