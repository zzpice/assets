# 静态资源库

个人壁纸、头像与图片资源，支持筛选、下载和复制外链。

[浏览资源](https://zzpice.github.io/assets/)

## 目录规则

壁纸按「种类 / 实际分辨率 / 文件名」存放：

```text
wallpapers/
└── anime/
    └── 1440x3120/
        ├── girl-wink-shh.png
        └── girl-rain.png
avatar.png
```

种类：`anime` 动漫、`landscape` 风景、`minimal` 极简、`abstract` 抽象、`gaming` 游戏、`photography` 摄影，其他用 `other`。

- 文件名使用小写英文、数字和短横线，种类和分辨率无需在文件名中重复。
- 分辨率用实际的 `宽x高`，例如 `1440x3120`；放大图注明处理情况。
- 同目录的新版本加 `-v2`、`-v3`；同一图片的不同尺寸放入各自目录。
- 主头像固定为 `avatar.png`，其他头像放入 `avatars/`；其他资源按用途分类。

## 上传与使用

图片放入对应目录并提交后，首页自动显示。需要中文标题或处理说明时，可填写 `catalog.json`。

图片外链为：

```text
https://zzpice.github.io/assets/<文件路径>
```
