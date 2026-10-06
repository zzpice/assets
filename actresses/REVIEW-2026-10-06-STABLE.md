# 头像与长期人物档案审核：2026-10-06

本轮基于重新克隆并核对的 main `d05ad9e3110022eefe568c498ce4a0b14ef675ea`，不是沿用此前对话中的假设。以下“替换／新增”均相对此提交；此前同日的 34 张替换、78 个中文名调整不重复计算。

## 当前仓库与发布

重新检查根 README、资源目录及来源清单、人物登记、174 张实际原图和现有预览、页面脚本与样式、测试、两个 GitHub Actions 工作流和 Pages 配置。人物 ID 与 FANZA 身份是唯一映射基础；174 人、170 位年度引用人物、四位历史人物、2023–2025 各 100 名、10 位名人堂成员均保留。年度快照的字节、FANZA ID、已有别名证据、名人堂选择及依据没有调整，没有新增人物、合并或重排 ID。

Pages 使用 main 根目录，检查开始时该提交的 Check gallery 与 Pages 构建均成功。Check gallery 使用 Python 3.12、固定 Pillow 依赖、Python/Node 测试及生成一致性检查；Review actress sources 是手动只读报告，不会自动换图、覆盖资料或提交。保持现有 Pages 发布方式与离线缓存约束。

## 实际结果与计数

- 检查 174 人的实际原图和列表预览；针对疑点人物比较图库候选与原始人物页，替换 13 张真实源图。
- 本次采用来源：Gfriends 6、集英社オンライン 2、C-more 2、LaSwan 1、LIGHT promotion 1、LINX 1。AVDC、MDCx、JAV Library Manager、myjoyu、MissAV 没有直接入库头像。
- 10 张替换同时考虑旧图的早期形象／时代感和较后期代表性，另 3 张主要为清晰度或画布构图。这里是人工视觉判断，不声称所有照片都有明确拍摄年月；提交、文件更新时间、URL 上传年月都不作为拍摄日期。按有日期的采访语境或可见后期造型判断的理由列在逐项表中。葵司与君岛美绪的现图比备选更自然、更适合，最终保留。
- 不采用 AI 修复图。只有无法找到适合的真实照片时才可评估可追溯的公开修复版本，不能换脸、补脸、重绘或去水印。本轮两位低清重点人物都找到真实候选。
- 19 人新增可靠来源的基本资料，合计 57 人；保留身高 55、完整生日 48、仅出生年 1、明确 AV 出道年份 6。未公开或无法可靠判断的继续为空。
- 明确 174 人的日文主艺名表记；新增 9 人有来源的罗马字，合计 29 人。中文主要展示名调整 7 人，旧表记及来源保留在别名，身份不变。
- 删除 38 人的事务所属性、37 人的三围属性、事务所映射与对应展示、校验旧逻辑、文档和测试。原始资料页及其摘要继续存在于来源记录中，不表示当前所属。
- 罗马字仅覆盖 29/174，移除字母索引筛选的界面、样式及逻辑；罗马字继续可搜索。旧 `letter` 链接参数忽略，页面仍显示全部人物。没有增加身高、生日、出道年份等低覆盖率筛选。栏目用内部枚举，年度用整数，保持与中文标签解耦。

## 外部来源实查

| 来源 | 实际检查内容 | 适合用途与采用边界 | 长期价值 |
| --- | --- | --- | --- |
| [Gfriends](https://github.com/gfriends/gfriends/tree/de8298f27afb4469100e39c159443c139ef0ef42) | 固定提交 `de8298f27afb4469100e39c159443c139ef0ef42` 的 README、完整 Filetree、已知姓名匹配和重点照片；区分原图与 `AI-Fix-` | 多组原始头像候选、旧艺名／罗马字线索。分组只是出处线索，不证明当前事务所、厂牌、拍摄年或授权。本次取 6 张固定提交原图 | 值得继续人工选图，选定后保持稳定；不自动追随更新 |
| [AVDC](https://github.com/moyy996/AVDC/tree/42ea8c08b26ac956f08e6cd0e88ffd83819c8b62) | README 与 Getter 代码；检查到的最后提交为 2021-06-05，`javbus.py` 从人物页找照片，JavDB/DMM 部分接口没有独立人物头像资料 | 是抓取工具，不是另一份可靠演员身份／事实数据库。Gfriends 的 `y-AVDC` 是历史收集分组，不能把它和新运行 AVDC 算作独立佐证 | 可参考抓取方式与历史候选，维护和来源价值低于原站／Gfriends |
| [MDCx Actress info database](https://github.com/sqzw-x/mdcx/releases/tag/actor_info_database) | 下载并只读检查 `Actress-20250220.db`：Info 21,860、Names 42,185、Urls 24,426 条；检查姓名、别名、罗马字、出生、身高、CareerPeriod、OfficialSite；已知姓名精确匹配得到 172 人的 174 条候选记录 | 可作线索索引和冲突发现，OfficialSite 可帮助找原页。缺少逐字段原始证据，不能直接把生日、身高、出道、状态或中文名批量覆盖。repo 已归档，不假定持续维护 | 保存版本参考即可；找到原页后以原页为准，不长期依赖同步 |
| [JAV Library Manager](https://github.com/ShadyDon-EdoTensei/jav-lib-manager/tree/af0b1c97e428bcfbfa643d647ef74785837324cc) | README、`data/actress_data.json` 的 945 条记录及头像 URL；精确匹配已确认表记获得 65 张 JavDB 候选 | 适合小型头像／姓名候选集；没有稳定跨站 ID、逐字段来源与审核快照。发现生日年份差异，不导入 birth_year、cup、height；候选中没有胜过本轮选定照片的图 | 辅助选图，低于官方原图；不作为事实同步库 |
| [myjoyu](https://myjoyu.com/) | 主页、[数据政策](https://myjoyu.com/data-policy)、[编辑政策](https://myjoyu.com/editorial-policy)及[河北彩花人物页](https://myjoyu.com/actresses/9725)；核对日文新表记和展示图性质 | 自述使用平台 API 与公开资料，但页面没有逐字段原始引用。适合中文用法／原站线索核验；人物页作品封面不适合作为头像，没有为重复已确认事实而叠加站点 | 可辅助查线索，不能替代原始人物资料 |
| [MissAV 公开人物页](https://missav.ws/cn/actresses) | 实际查看人物索引，以及[波多野結衣](https://missav.ws/dm288/cn/actresses/波多野結衣)、[つぼみ](https://missav.ws/dm165/cn/actresses/つぼみ)、[川上ゆう（森野雫）](https://missav.ws/dm87/cn/actresses/川上ゆう（森野雫）)页；部分直连受访问限制 | 中文使用与姓名对应可辅助核验；个人字段没有逐项出处，索引出道年也有明显口径疑点。没有下载作品或采用其人物事实 | 低权重辅助，不宜作为长期身份或个人资料的主库 |

候选发现过程在仓库外匹配了 1,718 张 Gfriends、65 张 JAV Library Manager，共 1,783 个地址；成功读取 1,780 个图片候选。该数字是下载／解析覆盖，不表示逐张人工审核，也不证明所有匹配都能作为人物身份依据。人工评估重点是 174 张已用头像及存在问题者的替代候选。候选图片、外部数据库、完整文件树、抓取 HTML 没有提交到本库。

## 保留与放弃的资料

档案保留：稳定 ID、FANZA 身份、常用展示名、日文主艺名、已确认旧名和别名、来源支持的罗马字、可选出生日期／出生年、身高、明确定义的 AV 出道年，以及已有年度／名人堂事实和来源审核元数据。出生日期与出生年不可同时写；出道年不可早于已记录出生年，也不能是未来值或布尔值；日文主艺名与罗马字必须选已带来源的主名／别名。

不保存当前事务所、所属厂牌、现役／引退、社交账号、粉丝数。三围、罩杯、体重、年龄会变化或产生口径维护成本；血型、出生地、爱好、特技、账号及数据库职业区间未证明本轮的实际必要性，不为了填满资料添加。头像来源可以是某事务所官网，但不由此产生人物的当前所属属性。

出生精度保持来源原样：小湊よつ葉、松本いちか、官方音乐项目人物页仅给月日，不从别处补上出生年。MINAMO 保留已有官方“2000 年”；葵伊吹聚合页面存在多个出生日期，官方页仅 5 月 18 日，因此没有完整生日。川上优的编辑资料明确 2004 年以森野雫首次出道，2007 年改名再出道；记录 2004，不把再出道当作首次 AV 出道。

已可靠确认的事实没有继续无意义堆叠聚合页。所有新增 profile 保留实际取到的源页面 SHA-256、URL、获取日、原文姓名和审核日。旧的可靠官方快照保持原有来源摘要，不声称本轮每一旧链接都重新抓取成功。

## 身份、冲突与数据质量

MDCx 的姓名相交不是合并证明：JULIA 还命中另一条“原小雪／JULIA”记录；“白石もも”存在不同生日、身高的两条记录。两者均未合并、未扩充身份和未自动补别名。没有发现足以证实本库需合并人物的证据。

| 人物 ID | 既有可靠来源值 | MDCx 候选差异 | 处理 |
| --- | --- | --- | --- |
| p0011 波多野結衣 | 1988-05-24 | 1988-07-12 | 保留原官方快照 |
| p0013 大槻ひびき | 身高 161 cm | 162 cm | 保留原官方快照 |
| p0100 MINAMO | 出生年 2000 | 1998-09-14 | 保留仅年份，不补日期 |
| p0124 小湊よつ葉 | 无出生年；153 cm | 1996-05-29；154 cm | 保留原始精度与身高 |
| p0129 九野ひなの | 2001-05-25 | 1999-04-10 | 保留原官方快照 |
| p0161 北岡果林 | 2003-09-19 | 2002-10-02 | 重新读取对应 Mine’S 人物页，确认原值 |
| p0165 小野坂ゆいか | 2002-02-09 | 2001-12-30 | 保留原官方快照 |

另发现 JAV Library Manager 的筱田优出生年与可靠资料不一致，未导入；部分 Eightman 旧人物地址会跳到新站主页，不能用主页证明个人事实、头像拍摄日期或当前所属。部分 T-POWERS 直连重试失败，没有让失败抓取或聚合数据库覆盖既有快照。本文的来源站和第三方数据都不证明图片再分发授权，原有来源、版权说明与移除规则继续适用。

## 尚无理想更新候选

| 人物 | 保留原因 |
| --- | --- |
| p0003 吉泽明步 | 周年官网原始人物图只有 300×400，全身取景；高宽横幅中的头部已截断。虽更后期，但不牺牲现有清晰度和头部构图；官网生日／身高可独立采用 |
| p0024 梦乃爱华 | 小型 JavDB 后期头像分辨率不足；高分候选缺乏更清楚原始出处，保持现有 S1 原图 |
| p0027 希岛爱理 | Duo 较新头像为 300×500，像素内有大片留白；当前 544×724 图更清晰、自然。采用 Duo 个人事实而不机械换图 |
| p0034 桃乃木香奈 | 比较较后期人工收集照片，但未取得更可靠原页来兼顾清晰度、来源和适合的头像构图，保留既有 IDEAPOCKET 图 |

上原亚衣等历史人物的现图仍有代表性，没有为了年份更换。这里“无理想更新候选”不表示缺失头像，也不触发自动修复或定期追新。未来优先原人物官网、可确认的事务所／厂牌原页、FANZA 身份资料及直接采访／出版方；Gfriends 继续作为人工选图补充，其他数据库与聚合页按上述边界辅助。

## 逐项采用记录

以下表格与 `data.json` 对应。源图保存原始字节，SHA-256 可核对；取景只是派生预览，文件下载仍是完整源图。

### 头像替换

| ID／展示名 | 新来源／尺寸 | 时代感因素 | 选择理由 | 原摘要 → 新摘要（SHA-256） |
| --- | --- | --- | --- | --- |
| p0001 风间由美 | [Gfriends](https://raw.githubusercontent.com/gfriends/gfriends/de8298f27afb4469100e39c159443c139ef0ef42/Content/6-Capsule/%E9%A2%A8%E9%96%93%E3%82%86%E3%81%BF.jpg) 686×1024 | 是；具体拍摄年月未知 | 更清晰的 Capsule 竖图，较成熟形象；减少下半身面积 | `382ad607198cd5f7d7cc34b67cad7d2a53102f16726750dffaf591d21a91bb97` → `f6484567987d9c5042485e99e7c947a508687ff5f8da19df0d31be32209b048a` |
| p0005 翔田千里 | [Gfriends](https://raw.githubusercontent.com/gfriends/gfriends/de8298f27afb4469100e39c159443c139ef0ef42/Content/8-Digigra/%E7%BF%94%E7%94%B0%E5%8D%83%E9%87%8C.jpg) 384×576 | 否；以质量／构图为主 | 替换 230×300 小图，Digigra 384×576 自然正面人物照 | `f0ba57f32020bdb246f0f3b5b29b2028a2ecf2f541a1ca2fd27b3aeefed3dcbb` → `374a98c7253a83b50b3ee9e79cf7069d11e3665c3161b7ff42b818e97f746364` |
| p0006 蕾 | [集英社オンライン](https://shuon.ismcdn.jp/mwimgs/b/0/-/img_b0992d0dba3d99b6461c93dd4b3e16ca61139.jpg) 500×500 | 是；具体拍摄年月未知 | 集英社 2023 年采访关联人物照，更接近后期形象 | `f72a7f4370a96f802b9651527cbee80be82200b8d5d8d72727fa728296bbd1f9` → `fb907abd1f7b682d8b6eddb3f9d172877795319001fa980f11a8a99ce1ac5e51` |
| p0009 川上优 | [集英社オンライン](https://shuon.ismcdn.jp/mwimgs/6/f/-/img_6f5b5db5623e8d5b5c439449bfba240155106.jpg) 500×500 | 是；具体拍摄年月未知 | 集英社 2022 年采访关联人物照，自然头肩与较后期形象 | `e7923512dcdcc58d2657b590e2a50d7d7226851c6c1234e8ecd3e69a1f61782a` → `4341f807cb8546d8917c1f55dd2ce98f5c0acaeeb3dbb2befc51041aa87cdd7c` |
| p0010 明日花绮罗 | [LaSwan](https://laswan.jp/wp-content/themes/Laswan/img/profile.jpg) 750×750 | 是；具体拍摄年月未知 | LaSwan 人物页较后期造型，替换早期 S1 照 | `d5ae2928cbdd8d9a25cd69adfcee197e991521bd44b4471d95dd57fda4d7dc8a` → `4ba705c3a42f2f0497631816520b6a43608fa801a52c0ee056d19a09fc9d2ed4` |
| p0016 JULIA | [C-more](https://cmore.jp/official/img/model/julia/julia.jpg) 516×516 | 是；具体拍摄年月未知 | C-more 官方人物照，较成熟自然形象 | `b65a0c1b4bf665914eb03a64e164a0bcdff3e9206e52c5a08aa963a931e315f7` → `3eeae8771bee8346ef8b366acd6c4b12f85da4f411684266ce940d89b8f1382e` |
| p0018 筱田优 | [Gfriends](https://raw.githubusercontent.com/gfriends/gfriends/de8298f27afb4469100e39c159443c139ef0ef42/Content/6-Tpowers/%E7%AF%A0%E7%94%B0%E3%82%86%E3%81%86.jpg) 1000×1000 | 是；具体拍摄年月未知 | T-POWERS 出处候选，较后期短发形象，原图细节更好 | `46b7013dd8db50fb9b029a523d4f97b5c137c17536efd0fe7b16aeee59173d8d` → `b8ba0ba0cd9272c4333cfe79ccf0125aabad39de5d3defcf66be52c98cc6143b` |
| p0029 橘玛丽 | [LIGHT promotion](https://lightpro.jp/img/talent/tachibanamar_m.jpg) 309×387 | 是；具体拍摄年月未知 | LIGHT 官方自然笑容人物照，较后期形象；现有候选低清或早期造型不优先 | `588767a3c3cb3eb10101227641fb90e84492b16683d7b63e04d83b3f52975a43` → `98ba350e32524252b32f2564f8742f9eede318677d28a0f3b970efb2ab450184` |
| p0032 三上悠亚 | [Gfriends](https://raw.githubusercontent.com/gfriends/gfriends/de8298f27afb4469100e39c159443c139ef0ef42/Content/7-Moodyz/%E4%B8%89%E4%B8%8A%E6%82%A0%E4%BA%9C.jpg) 600×783 | 是；具体拍摄年月未知 | MOODYZ 竖图，较后期形象，原图比例无需处理 | `d74b699042ba2053a7fa5d2a0568398d1d7dddd96b194c21546712a0232f76e2` → `df57dd9f7d5691fce66a560ca1720de694707c685780698353a80740cb7d2bdd` |
| p0042 山岸逢花 | [Gfriends](https://raw.githubusercontent.com/gfriends/gfriends/de8298f27afb4469100e39c159443c139ef0ef42/Content/5-Premium/%E5%B1%B1%E5%B2%B8%E3%81%82%E3%82%84%E8%8A%B1.jpg) 544×724 | 是；具体拍摄年月未知 | PREMIUM 较后期花饰人物照，优于早期造型；避免另一 MOODYZ 候选边缘他人肢体 | `ab79056a984ca9a2165153ad04910754b4fe4bc014cd20d4dc51fe4d7972d86a` → `38252056abc47b48e53b4721e0faecfaa87d540978f918b71ad4e160e6f89430` |
| p0048 七泽米亚 | [Gfriends](https://raw.githubusercontent.com/gfriends/gfriends/de8298f27afb4469100e39c159443c139ef0ef42/Content/6-Capsule/%E4%B8%83%E6%B2%A2%E3%81%BF%E3%81%82.jpg) 1105×1536 | 是；具体拍摄年月未知 | Capsule 较成熟形象，原竖图更清晰自然，保留姿态 | `6195f5b36323b52ac690eb05689dc17bf67ceb54599f72f1f3970b48c5e37bba` → `feebd594f4e46fcbe87f3767938f786dc4c5e62c3b8ad33a80d5054486e361bf` |
| p0069 青空光 | [C-more](https://cmore.jp/official/img/model/aozora/aozora.jpg) 516×516 | 否；以质量／构图为主 | C-more 官方独立人物照替代横幅源图，原画布减少无意义背景 | `1a345739bba38ce0723bf177aae929f995da97f1996e80483a95e182a9c50fb7` → `48dd5a25fd633f73dc460b6c7fa5e271bb5fd5a9bca27d233d0c399ae8f6d7c2` |
| p0134 柴崎はる | [LINX](https://pub.linx.live/contents/img.php?model_id=5470&target_id=6&s=1) 1000×1500 | 否；以质量／构图为主 | LINX 官方 1000×1500 原图替代 222×224 小图 | `b70146d778d710ca69f4fe8f88a52b0f3baa67a9b8ebf1f8e9bb14157ef6243c` → `cce6633e57701722449c73898b2de5808a9779c74d93eade297821eaf9539379` |

### 新增个人事实

| ID／姓名 | 实际采纳字段 | 原始资料页 | 源页面 SHA-256 |
| --- | --- | --- | --- |
| p0003 吉泽明步 | 出生日期 1984-03-03；身高 cm 161 | [吉沢明歩](https://akiho15th.wixsite.com/special) | `89e673576dbc5142cb0846c911cd12698887b5c816f5703913c5a94642d4b6b8` |
| p0006 蕾 | 出生日期 1987-12-25；AV 出道年份 2006 | [つぼみ](https://shueisha.online/list/persons/65a92d928ce1158c70000006) | `52b2546699d49fcb930d9e01cc2d06096e9ef883df6b6e06b9171d55b9011924` |
| p0009 川上优 | 出生日期 1982-03-03；AV 出道年份 2004 | [川上ゆう](https://shueisha.online/list/persons/65aa13f88ce1159272000479) | `9a84c031bb683bfaa395d6356cc2c3fa77f3b93a79472fa460a72a02c387f85b` |
| p0010 明日花绮罗 | 出生日期 1988-10-02；身高 cm 163 | [明日花キララ](https://laswan.jp/profile/) | `c0b68c66056666dce49493205c0e843a3e7333a3efbd158e66a7a46952fa1b92` |
| p0016 JULIA | 出生日期 1987-05-25；身高 cm 158 | [JULIA](https://cmore.jp/official/model-julia.html) | `a8fcb246047330797853d1c7694e3aa63b460fb2c87e1b80d1cbda24c81588bf` |
| p0027 希岛爱理 | 出生日期 1988-12-24；身高 cm 160 | [希島あいり](https://www.duo-official.com/models/airi-kijima/) | `2e9fddd787d497d01f90880764bdd1b13f3c1e1ab3b8d8945e955e3e4439140a` |
| p0029 橘玛丽 | 出生日期 1993-07-07；身高 cm 168 | [橘メアリー](https://lightpro.jp/talent/tachibanamary.html) | `b456a775184fa19bbd15c52719a1f73cd1aa8e1448415c20fa43b53ee73741ea` |
| p0039 明里紬 | 出生日期 1998-03-31；身高 cm 157；AV 出道年份 2017 | [明里つむぎ](https://cmore.jp/official/model-akari.html) | `fda13373b2435ccf7c3fe1a0b73acca983621a0bff8fb9b51106a76040af650a` |
| p0049 架乃由罗 | 出生日期 1998-12-28；身高 cm 156 | [架乃ゆら](https://pub.linx.live/contents/model/4602/) | `bd39390aec44ecd2143f36c20e9d86488672dca1bc24d4354d425c914a70ea09` |
| p0055 水川スミレ | 出生日期 1995-02-03；身高 cm 155 | [水川スミレ](https://pub.linx.live/contents/model/4721/) | `5fd86344d8fbe143f5462eb4bf588e9b07d708cc4f02e675c9ccbed7fdef36c9` |
| p0066 弥生美月 | 出生日期 1998-12-07；身高 cm 157；AV 出道年份 2019 | [弥生みづき](https://lightpro.jp/talent/yayoimizuki.html) | `727145759c86b98e5f753f130606278e1812d0ed71f0adceefed5ae15e155125` |
| p0067 松本一香 | 身高 cm 153；AV 出道年份 2019 | [松本いちか](https://lightpro.jp/talent/matsumotoichika.html) | `368364c975ba8945f02f8bc0b21d11f9233d560cbaa1d224a2e2c0a5fb62942e` |
| p0069 青空光 | 出生日期 1999-01-08；身高 cm 153；AV 出道年份 2019 | [青空ひかり](https://cmore.jp/official/model-aozora.html) | `458775676faf490b998e3153258e35d8648b3b3d15d312f1aa394e617bee7c19` |
| p0074 东条夏 | 出生日期 1999-08-19；身高 cm 156 | [東條なつ](https://pub.linx.live/contents/model/4915/) | `8c5006d90f74f3f4c13afc0179aabd399736b236bf68f0d79558cce456b4dbed` |
| p0134 柴崎はる | 出生日期 2000-01-08；身高 cm 155 | [柴崎はる](https://pub.linx.live/contents/model/5470/) | `a3e6e991a6836ae425ab9d718c8fedc72aaab7e912ea3b6f19723a6d9efbbfae` |
| p0083 葵伊吹 | 身高 cm 162 | [葵いぶき](https://otsukichannouta.com/profile/detail/169/) | `f8e95e06165295f94886ffc608a12d9cbc8c8c2845bbea9dde723257e6274a19` |
| p0122 未步奈奈 | 身高 cm 156 | [未歩なな](https://otsukichannouta.com/profile/detail/134/) | `345fd60f1a04e37205e44a95606ce04c907692518075a589abcbf029b905009a` |
| p0138 川越にこ | 身高 cm 150 | [川越にこ](https://otsukichannouta.com/profile/detail/170/) | `3fa7c9603f0832162ed4513b97807f9a06f2a75632ac8304ab48d0117eda2658` |
| p0150 佐々木さき | 身高 cm 150 | [佐々木さき](https://otsukichannouta.com/profile/detail/228/) | `703e73f1c9cf97aaed71a11098c74fba8482f9a26eb1cf50ce1b4c8f166d9b54` |

新增源页面均于 2026-10-06 获取并审核；其中集英社人物简介关联其直接采访，不将作品列表当作个人事实。没有把来源名称转化为当前所属。

### 中文展示名调整

| ID | 原展示名 → 新展示名 | 中文用法依据 |
| --- | --- | --- |
| p0064 | 吉根ゆりあ → 吉根柚莉爱 | [姓名依据](https://zh.wikipedia.org/wiki/吉根柚莉愛) |
| p0075 | 木下凛々子 → 木下凛凛子 | [姓名依据](https://www.theidolbase.com/actress/kinoshita-ririko/pictures) |
| p0083 | 葵いぶき → 葵伊吹 | [姓名依据](https://otsukichannouta.com/cn/profile/detail/949/) |
| p0095 | 花狩まい → 花狩舞 | [姓名依据](https://www.weibo.com/ttarticle/p/show?id=2309404625581626229112) |
| p0107 | つばさ舞 → 翼舞 | [姓名依据](https://www.momoshop.com.tw/product/14911976) |
| p0122 | 未歩なな → 未步奈奈 | [姓名依据](https://otsukichannouta.com/cn/profile/detail/935/) |
| p0142 | 本郷愛 → 本乡爱 | [姓名依据](https://www.renwudang.com/person/hongou-ai) |

仅中文使用和身份对应用于名称调整；未从姓名辅助站导入生日、身高、事务所、状态或未确认别名。官方音乐网站的“川越鈴子”“佐佐木早紀”与其他中文用法不统一，没有机械取代原日文展示名；倉本すみれ亦未因个别聚合站的“蓳／堇”差异强行定名。

### 新增有来源的罗马字

p0003 Akiho Yoshizawa、p0010 Asuka Kirara、p0029 Mary Tachibana、p0066 Mizuki Yayoi、p0067 Ichika Matsumoto、p0083 Aoi Ibuki、p0122 Miho Nana、p0138 Kawagoe Niko、p0150 Sasaki Saki。各表记的原页证据存入 `aliases`，与 `romanization` 对应。

本次评估的 MDCx 文件 SHA-256：`251206ca729bb6fcdd55a88b228dfb1f6beb8d069dce947d90acb6750a50c9d8`；未把数据库或其未核验记录入库。

## 验证

47 项 Python 测试、37 项 Node 测试、三个界面／离线脚本语法检查、`update_catalog.py --check` 和 `git diff --check` 通过。生成目录保持 303 个全站资源、174 个女优头像；所有旧个人事实（除主动删除的字段）、别名来源、稳定 ID、FANZA 身份、名人堂记录、三个年度源文件及其他资源原图逐项与基线比较一致。离线重复检查提示为 0 组相似图、0 组共享姓名；该工具不是人物合并证据。

实际浏览器检查桌面和手机布局、全部人物分页（48＋48＋48＋30）、年度 100 人、名人堂 10 人、中文／日文／罗马字搜索同一身份、详情的出生精度、AV 出道定义、旧字母参数退化、头像加载和页面宽度；无页面脚本错误、无横向溢出。新版缓存内容标识和原图下载地址由现有生成器更新，旧预览已清理。线上发布结果可按本次 main 提交查看 Check gallery 与 Pages 构建记录。
