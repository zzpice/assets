# 银行卡面

从 [Cardentify](https://cards.no2.ac/) 选取指定 10 家银行的 41 款卡片，共 43 个原始文件：香港 19 个、中国内地 22 个、新加坡 2 个。41 个来自 Apple Pay、1 个来自 Samsung Pay、1 个来自 PayPal。整理日期：2026-10-04。

## 目录与顺序

```text
bank-cards/originals/<地区>/<银行>/<名称>.<格式>
bank-cards/custom/<地区>/<银行>/<名称>.<格式>
```

`originals` 保存钱包提供的原始文件；`custom` 保存自己修改的版本，有实际文件时再创建。文件名使用小写英文、数字和短横线，不重复地区、银行或尺寸。

以下机构名称与英文名称依据 Cardentify 的机构记录，中文括号统一为全角。地区及银行顺序同时用于 Pages 分组和筛选；顺序保存在 [catalog.json](../catalog.json) 的 `cardBanks` 清单中。

| 地区目录 | 银行目录 | 机构名称 | 英文名称 | 原始文件 |
|---|---|---|---|---:|
| `hong-kong` | `hsbc` | 香港上海滙豐銀行 | The Hongkong and Shanghai Banking Corporation | 12 |
| `hong-kong` | `bank-of-china` | 中國銀行（香港） | Bank of China (Hong Kong) | 3 |
| `hong-kong` | `standard-chartered` | 渣打銀行（香港） | Standard Chartered Bank (Hong Kong) | 1 |
| `hong-kong` | `dbs` | 星展銀行（香港） | DBS Bank (Hong Kong) | 1 |
| `hong-kong` | `za-bank` | 眾安銀行 | ZA Bank | 2 |
| `china-mainland` | `icbc` | 中国工商银行 | Industrial and Commercial Bank of China | 4 |
| `china-mainland` | `ccb` | 中国建设银行 | China Construction Bank | 4 |
| `china-mainland` | `cmb` | 招商银行 | China Merchants Bank | 14 |
| `singapore` | `standard-chartered` | Standard Chartered (Singapore) | Standard Chartered (Singapore) | 1 |
| `singapore` | `dbs` | DBS Bank | DBS Bank | 1 |

## 原始文件与来源

- 只收录能确认钱包来源的卡面，优先级为 **Apple Pay > Google Pay > Samsung Pay > PayPal**；不收录 Mi Pay、云闪付、Amazon Pay 或来源不明的文件。
- 同一卡片通常只保留最高优先级的版本。汇丰 Mastercard Debit 的彩色／银色 Mastercard 标识，以及 Premier Mastercard 的蓝色／紫色布局存在明显差异，因此各保留两个 Apple Pay 版本；不推测发行年份。
- 中銀卡保留 Apple Pay 版本，省略 Samsung Pay 版本。汇丰附属扣账卡仅有已确认的 Samsung Pay 版本；香港渣打國泰 Mastercard 仅有已确认的 PayPal 版本。
- 原始文件保持字节不变，不裁剪、缩放、压缩、转码或覆盖。不同原版使用新的描述性名称；修改后的文件放入 `custom`。
- 每个原版在 `catalog.json` 的 `source` 中记录 `collection`、`wallet`、原文件 `url`、Cardentify 的 `cardId` 和 `assetId`、获取日期 `retrieved`、文件 `sha256`。文件地址中的内容哈希与保存文件核对一致；钱包来源依据 Cardentify 标注，未独立从钱包设备提取。
- 修改版在 `catalog.json` 中填写 `derivedFrom`，指向同地区、同银行的原始文件，并在 `note` 中说明修改内容；不将其标为钱包原版。

上传前按[维护说明](../scripts/README.md)更新目录、生成小型预览并检查。预览位于 `app/previews/`，下载始终提供对应资源文件；工具会拒绝覆盖已有原版、来源或哈希缺失、修改版未关联原版的情况。

只保存卡面图片及必要来源，不保存完整卡号、CVV、`pass.json` 或账户资料。不自动同步上游，也不完整镜像第三方项目。卡面、商标和产品名称的权利归各权利人；保留 Cardentify 来源标注及其学习交流、非商业使用说明，不将卡面声明为本项目原创或另授开源许可。[Cardentify 提交说明](https://github.com/no2ac/Cardentify)。
