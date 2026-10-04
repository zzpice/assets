# 图片目录维护

使用 Python 3.10 或更新版本，安装一次依赖：

```sh
python3 -m pip install -r scripts/requirements.txt
```

添加、替换或删除图片后运行：

```sh
python3 scripts/update_catalog.py
```

把原图和工具生成的变化一起提交，包括 `catalog.json`、`app/previews/`、`index.html` 和 `sw.js`。工具读取实际尺寸、从目录读取风格分类、更新文件大小和内容标识、生成小型 WebP 预览、移除不再使用的预览，始终保留原图。壁纸和头像目录尺寸写错时会停止并指出正确尺寸。

`icons/` 下的图标须为 512×512 PNG、RGBA，r=115 圆角外侧完全透明。工具会检查并拒绝不合规文件，不自动修图，也不生成重复预览。

修改界面脚本、样式或离线逻辑后也运行同一命令，并提交 `index.html` 和 `sw.js` 的变化。工具会按目录和界面内容更新资源及离线缓存版本，避免新旧界面混用；离线缓存更新在后台完成，下次重新打开后使用。

中文标题和处理说明仍可在 `catalog.json` 中编辑。替换原图后保留标题，旧的处理说明会清除，请按新图补充。GIF 的列表预览显示首帧，下载保留动画；SVG 使用原矢量图预览。

适用设备会按实际尺寸和比例初步分类为手机、电脑、平板；无法明确区分的尺寸（例如 1080×1920）保留为「待分类」。可在 `catalog.json` 中用 `device` 修正：`phone`、`desktop`、`tablet`、`unknown`，手动分类优先。只有手机竖屏壁纸提供锁屏效果，其他图片使用普通预览。

只检查、不写文件：`python3 scripts/update_catalog.py --check`。
