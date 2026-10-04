# 图片目录维护

使用 Python 3.10 或更新版本，安装一次依赖：

```sh
python3 -m pip install -r scripts/requirements.txt
```

添加、替换或删除图片后运行：

```sh
python3 scripts/update_catalog.py
```

把原图、`catalog.json` 和 `app/previews/` 的变化一起提交即可。工具读取实际尺寸、更新文件大小和内容标识、生成小型 WebP 预览、移除不再使用的预览，始终保留原图。壁纸目录尺寸写错时会停止并指出正确尺寸。

中文标题和处理说明仍可在 `catalog.json` 中编辑。替换原图后保留标题，旧的处理说明会清除，请按新图补充。GIF 的列表预览显示首帧，下载保留动画；SVG 使用原矢量图预览。

只检查、不写文件：`python3 scripts/update_catalog.py --check`。
