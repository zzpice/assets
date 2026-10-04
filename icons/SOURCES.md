# 图标清单与来源

所有文件均为 512×512 PNG、RGBA；链接固定到收录时审查的上游提交。Oasisic-Icons 提供 133 个，Dashboard Icons 提供 8 个；采用原 PNG，不收录 SVG。除下述明确标注的标准化处理外，图片文件字节未修改。

Claude 的上游文件名为 `Anthropic.png`，Gemini 的上游文件名为 `GoogleAI.png`；本集合按图案对应的服务命名。

## 圆角修正

上游将这 3 个旧图标登记为[圆角边界历史例外](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/config/icon-mask-exemptions.json)。本集合按其[规范化算法](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/scripts/normalize-icons.py)修正：仅将 r=115 遮罩外的 alpha 置零，整个图像的 RGB 及遮罩内 alpha 与上游逐像素一致。未抠底、未重绘、未锐化、未量化。

| 文件 | 修正的外侧像素数 |
|---|---:|
| [proxy/final.png](proxy/final.png) | 118 |
| [proxy/ai.png](proxy/ai.png) | 20 |
| [proxy/airport.png](proxy/airport.png) | 76 |

## Dashboard Icons 补充项与标准化处理

保留完整 [Apache-2.0 许可](licenses/dashboard-icons-apache-2.0.txt)，版权归 Bjorn Lammers、Meier Lukas、Thomas Camlong 和 Homarr Labs。固定来源提交为 `adca944175c9a3eb0471f78a4da87f237476d585`。仅选取这 8 项，不同步或镜像上游。

| 文件 | 处理 |
|---|---|
| [browsers/chrome.png](browsers/chrome.png) | 原 PNG 字节不变 |
| [browsers/edge.png](browsers/edge.png) | 原 PNG 字节不变 |
| [browsers/firefox.png](browsers/firefox.png) | 保留原始像素尺寸，居中填充透明画布至 512×512 |
| [browsers/safari.png](browsers/safari.png) | 仅将 r=115 圆角外侧 alpha 置零 |
| [development/vscode.png](development/vscode.png) | 按原比例缩至 460×460，透明画布居中留边；不裁切标志 |
| [development/gitlab.png](development/gitlab.png) | 按原比例缩至 460×443，透明画布居中留边；不裁切标志 |
| [network/bitwarden.png](network/bitwarden.png) | 仅将 r=115 圆角外侧 alpha 置零 |
| [network/clash.png](network/clash.png) | 转换为 RGBA，无颜色量化；保留原始像素尺寸，居中填充透明画布至 512×512 |

修改的 PNG 同时内嵌来源、许可与修改说明。原底色保留；等比留边不裁切标志；Clash 原图不放大，保留原始像素细节。

## 浏览器

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Chrome | [chrome.png](browsers/chrome.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/chrome.png) |
| Microsoft Edge | [edge.png](browsers/edge.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/edge.png) |
| Firefox | [firefox.png](browsers/firefox.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/firefox.png) |
| Safari | [safari.png](browsers/safari.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/safari.png) |

## AI

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| OpenAI / ChatGPT | [openai.png](ai/openai.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/OpenAI/OpenAI.png) |
| Claude | [claude.png](ai/claude.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/Anthropic/Anthropic.png) |
| DeepSeek | [deepseek.png](ai/deepseek.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/DeepSeek/DeepSeek.png) |
| 通义千问 | [qwen.png](ai/qwen.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/Qwen/Qwen.png) |
| Gemini | [gemini.png](ai/gemini.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/GoogleAI/GoogleAI.png) |
| Grok | [grok.png](ai/grok.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/SpaceXAI/xAI/Grok/Grok.png) |
| Kimi | [kimi.png](ai/kimi.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/Kimi/Kimi.png) |
| 豆包 | [doubao.png](ai/doubao.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/ByteDance/Doubao/Doubao.png) |
| Perplexity | [perplexity.png](ai/perplexity.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/AI/Perplexity/Perplexity.png) |
| Microsoft Copilot | [copilot.png](ai/copilot.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/Copilot/Copilot.png) |

## 开发与运维

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| GitHub | [github.png](development/github.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/GitHub/GitHub.png) |
| Cursor | [cursor.png](development/cursor.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Development/Cursor/Cursor.png) |
| Docker | [docker.png](development/docker.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Infrastructure/Docker/Docker.png) |
| AWS | [aws.png](development/aws.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Amazon/AWS/AWS.png) |
| 阿里云 | [alibaba-cloud.png](development/alibaba-cloud.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/AlibabaCloud/AlibabaCloud.png) |
| 腾讯云 | [tencent-cloud.png](development/tencent-cloud.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Tencent/TencentCloud/TencentCloud.png) |
| Proxmox | [proxmox.png](development/proxmox.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Infrastructure/Proxmox/Proxmox.png) |
| Azure | [azure.png](development/azure.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/Azure/Azure.png) |
| Visual Studio Code | [vscode.png](development/vscode.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/visual-studio-code.png) |
| GitLab | [gitlab.png](development/gitlab.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/gitlab.png) |

## 网络与安全

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Cloudflare | [cloudflare.png](network/cloudflare.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Infrastructure/Cloudflare/Cloudflare.png) |
| OpenWrt | [openwrt.png](network/openwrt.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Infrastructure/OpenWrt/OpenWrt.png) |
| 1Password | [1password.png](network/1password.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/1Password/1Password.png) |
| AdGuard | [adguard.png](network/adguard.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/AdGuard/AdGuard.png) |
| Surge | [surge.png](network/surge.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Surge/Surge/Surge.png) |
| Speedtest | [speedtest.png](network/speedtest.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/Speedtest/Speedtest.png) |
| Bitwarden | [bitwarden.png](network/bitwarden.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/bitwarden.png) |
| Clash | [clash.png](network/clash.png) | [源文件](https://github.com/homarr-labs/dashboard-icons/blob/adca944175c9a3eb0471f78a4da87f237476d585/png/clash.png) |

## 通讯与邮箱

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| 微信 | [wechat.png](communication/wechat.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Tencent/WeChat/WeChat.png) |
| QQ | [qq.png](communication/qq.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Tencent/QQ/QQ.png) |
| Telegram | [telegram.png](communication/telegram.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Communication/Telegram/Telegram.png) |
| Discord | [discord.png](communication/discord.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Communication/Discord/Discord.png) |
| WhatsApp | [whatsapp.png](communication/whatsapp.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Meta/Facebook/WhatsApp/WhatsApp.png) |
| Gmail | [gmail.png](communication/gmail.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/Gmail/Gmail.png) |
| Outlook | [outlook.png](communication/outlook.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/Outlook/Outlook.png) |
| 飞书 | [lark.png](communication/lark.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/ByteDance/Lark/Lark.png) |
| 钉钉 | [dingtalk.png](communication/dingtalk.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/DingTalk/DingTalk.png) |
| Zoom | [zoom.png](communication/zoom.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/Zoom/Zoom.png) |
| QQ 邮箱 | [qq-mail.png](communication/qq-mail.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Tencent/QQMail/QQMail.png) |
| 网易邮箱 | [netease-mail.png](communication/netease-mail.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/NetEase/NetEaseMail/NetEaseMail.png) |

## 社交与社区

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| X | [x.png](social/x.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/SpaceXAI/X/X.png) |
| Reddit | [reddit.png](social/reddit.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Social/Reddit/Reddit.png) |
| Instagram | [instagram.png](social/instagram.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Meta/Facebook/Instagram/Instagram.png) |
| 微博 | [weibo.png](social/weibo.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Social/Weibo/Weibo.png) |
| 知乎 | [zhihu.png](social/zhihu.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Social/Zhihu/Zhihu.png) |
| 小红书 | [xiaohongshu.png](social/xiaohongshu.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Social/rednote/rednote.png) |
| Facebook | [facebook.png](social/facebook.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Meta/Facebook/Facebook.png) |
| 豆瓣 | [douban.png](social/douban.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Social/Douban/Douban.png) |
| pixiv | [pixiv.png](social/pixiv.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Social/pixiv/pixiv.png) |
| Bangumi 番组计划 | [bangumi.png](social/bangumi.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Bangumi/Bangumi.png) |
| 百度贴吧 | [tieba.png](social/tieba.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Baidu/Tieba/Tieba.png) |

## 搜索与知识

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Google | [google.png](search/google.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/Google/Google.png) |
| 维基百科 | [wikipedia.png](search/wikipedia.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/Wikipedia/Wikipedia.png) |
| Bing | [bing.png](search/bing.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/Bing/Bing.png) |
| 百度 | [baidu.png](search/baidu.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Baidu/Baidu/Baidu.png) |

## 视频与媒体

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| YouTube | [youtube.png](video/youtube.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/YouTube/YouTube.png) |
| 哔哩哔哩 | [bilibili.png](video/bilibili.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/bilibili/bilibili.png) |
| Netflix | [netflix.png](video/netflix.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Netflix/Netflix.png) |
| Disney+ | [disney-plus.png](video/disney-plus.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Disney/DisneyPlus/DisneyPlus.png) |
| Prime Video | [prime-video.png](video/prime-video.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Amazon/PrimeVideo/PrimeVideo.png) |
| Twitch | [twitch.png](video/twitch.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Amazon/Twitch/Twitch.png) |
| 爱奇艺 | [iqiyi.png](video/iqiyi.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Baidu/iQIYI/iQIYI.png) |
| 腾讯视频 | [tencent-video.png](video/tencent-video.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Tencent/TencentVideo/TencentVideo.png) |
| 优酷 | [youku.png](video/youku.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/Youku/Youku.png) |
| Jellyfin | [jellyfin.png](video/jellyfin.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Jellyfin/Jellyfin.png) |
| Plex | [plex.png](video/plex.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Plex/Plex.png) |
| Infuse | [infuse.png](video/infuse.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Infuse/Infuse.png) |
| 抖音 | [douyin.png](video/douyin.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/ByteDance/Douyin/Douyin.png) |
| TikTok | [tiktok.png](video/tiktok.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/ByteDance/TikTok/TikTok.png) |
| Emby | [emby.png](video/emby.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Emby/Emby.png) |
| Crunchyroll | [crunchyroll.png](video/crunchyroll.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/SONY/Crunchyroll/Crunchyroll.png) |
| HBO Max | [hbo-max.png](video/hbo-max.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/WarnerBrosDiscovery/HBOMax/HBOMax.png) |

## 音乐与播客

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Spotify | [spotify.png](music/spotify.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Music/Spotify/Spotify.png) |
| Apple Music | [apple-music.png](music/apple-music.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Apple/AppleMusic/AppleMusic.png) |
| QQ 音乐 | [qq-music.png](music/qq-music.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Tencent/QQMusic/QQMusic.png) |
| 网易云音乐 | [netease-cloud-music.png](music/netease-cloud-music.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/NetEase/NetEaseCloudMusic/NetEaseCloudMusic.png) |
| YouTube Music | [youtube-music.png](music/youtube-music.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/YouTube/YouTubeMusic/YouTubeMusic.png) |
| 小宇宙 | [xiaoyuzhou.png](music/xiaoyuzhou.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Media/Xiaoyuzhou/Xiaoyuzhou.png) |
| SoundCloud | [soundcloud.png](music/soundcloud.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Music/SoundCloud/SoundCloud.png) |
| Apple Podcasts | [apple-podcasts.png](music/apple-podcasts.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Apple/ApplePodcasts/ApplePodcasts.png) |

## 网盘与存储

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| 群晖 | [synology.png](storage/synology.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Infrastructure/Synology/Synology.png) |
| Google Drive | [google-drive.png](storage/google-drive.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/GoogleDrive/GoogleDrive.png) |
| iCloud | [icloud.png](storage/icloud.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Apple/iCloud/iCloud.png) |
| OneDrive | [onedrive.png](storage/onedrive.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Microsoft/OneDrive/OneDrive.png) |
| Dropbox | [dropbox.png](storage/dropbox.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/CloudStorage/Dropbox/Dropbox.png) |
| 阿里云盘 | [aliyun-drive.png](storage/aliyun-drive.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/AliyunDrive/AliyunDrive.png) |
| 百度网盘 | [baidu-netdisk.png](storage/baidu-netdisk.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Baidu/BaiduNetdisk/BaiduNetdisk.png) |
| 夸克网盘 | [quark.png](storage/quark.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/Quark/Quark.png) |
| 115 网盘 | [115.png](storage/115.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/CloudStorage/115/115.png) |
| 123 云盘 | [123.png](storage/123.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/CloudStorage/123/123.png) |
| PikPak | [pikpak.png](storage/pikpak.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/CloudStorage/PikPak/PikPak.png) |

## 效率与工具

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Notion | [notion.png](productivity/notion.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/Notion/Notion.png) |
| Obsidian | [obsidian.png](productivity/obsidian.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/Obsidian/Obsidian.png) |
| Google 翻译 | [google-translate.png](productivity/google-translate.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/GoogleTranslate/GoogleTranslate.png) |
| Google 地图 | [google-maps.png](productivity/google-maps.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Google/GoogleMaps/GoogleMaps.png) |
| Adobe | [adobe.png](productivity/adobe.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Utilities/Adobe/Adobe.png) |

## 游戏

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| Steam | [steam.png](gaming/steam.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Game/Steam/Steam.png) |
| Epic Games | [epic-games.png](gaming/epic-games.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Game/EpicGames/EpicGames.png) |
| PlayStation | [playstation.png](gaming/playstation.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/SONY/PlayStation/PlayStation.png) |
| Nintendo | [nintendo.png](gaming/nintendo.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Game/Nintendo/Nintendo.png) |

## 购物与支付

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| 支付宝 | [alipay.png](lifestyle/alipay.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/AliPay/AliPay.png) |
| PayPal | [paypal.png](lifestyle/paypal.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Payment/PayPal/PayPal.png) |
| 淘宝 | [taobao.png](lifestyle/taobao.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Alibaba/Taobao/Taobao.png) |
| 京东 | [jd.png](lifestyle/jd.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Shopping/JD/JD.png) |
| 美团 | [meituan.png](lifestyle/meituan.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Shopping/Meituan/Meituan.png) |
| 拼多多 | [pinduoduo.png](lifestyle/pinduoduo.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Shopping/Pinduoduo/Pinduoduo.png) |

## 代理与分流

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| 直连 | [direct.png](proxy/direct.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Direct/Direct.png) |
| 代理 | [proxy.png](proxy/proxy.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Proxy/Proxy.png) |
| 拒绝 | [reject.png](proxy/reject.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Reject/Reject.png) |
| 自动选择 | [auto.png](proxy/auto.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Auto/Auto.png) |
| 全球 | [global.png](proxy/global.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Global/Global.png) |
| 兜底 | [final.png](proxy/final.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Final/Final.png) |
| 广告拦截 | [ad-block.png](proxy/ad-block.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/AD/AD.png) |
| Wi-Fi | [wifi.png](proxy/wifi.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/SSID/SSID.png) |
| AI 分流 | [ai.png](proxy/ai.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/GeneralAI/GeneralAI.png) |
| 流媒体分流 | [streaming.png](proxy/streaming.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Play/Play.png) |
| 游戏分流 | [game.png](proxy/game.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Game/Game.png) |
| 邮件分流 | [mail.png](proxy/mail.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Mail/Mail.png) |
| 机场 | [airport.png](proxy/airport.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Airport/Airport.png) |
| 网址分流 | [url.png](proxy/url.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/URL/URL.png) |
| 流量 | [traffic.png](proxy/traffic.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/System/Traffic/Traffic.png) |
| BGP | [bgp.png](proxy/bgp.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/BGP/BGP.png) |
| GIA | [gia.png](proxy/gia.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/GIA/GIA.png) |
| IEPL | [iepl.png](proxy/iepl.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/IEPL/IEPL.png) |
| IPLC | [iplc.png](proxy/iplc.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Proxy/IPLC/IPLC.png) |

## 国家与地区

| 名称 | 本地文件 | 原始来源 |
|---|---|---|
| 中国 | [china.png](regions/china.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/China/China.png) |
| 中国香港 | [hong-kong.png](regions/hong-kong.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/HongKong/HongKong.png) |
| 中国台湾 | [taiwan.png](regions/taiwan.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/CN-Taiwan/CN-Taiwan.png) |
| 日本 | [japan.png](regions/japan.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Japan/Japan.png) |
| 新加坡 | [singapore.png](regions/singapore.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Singapore/Singapore.png) |
| 韩国 | [south-korea.png](regions/south-korea.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Korea/Korea.png) |
| 美国 | [united-states.png](regions/united-states.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/US/US.png) |
| 英国 | [united-kingdom.png](regions/united-kingdom.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/UK/UK.png) |
| 德国 | [germany.png](regions/germany.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Germany/Germany.png) |
| 加拿大 | [canada.png](regions/canada.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Canada/Canada.png) |
| 澳大利亚 | [australia.png](regions/australia.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Australia/Australia.png) |
| 荷兰 | [netherlands.png](regions/netherlands.png) | [源文件](https://github.com/Hawaiine/Oasisic-Icons/blob/f0f3bc2a44616885682ee5f0e5921540b964e2d8/icons/Country/Netherlands/Netherlands.png) |
