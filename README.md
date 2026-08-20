# HACCP 计划生成器（HACCP-Builder）

一款面向**中国中小食品企业**的引导式 Web 应用，帮助食品企业运营者一步一步构建正式的
**HACCP 计划**，遵循《国际食品法典委员会》(Codex Alimentarius) / NACMCF 的 HACCP 结构——
**5 个预备步骤 + 7 项原则**。

从企业概况、HACCP 团队、GMP 与前提方案、合格供应商、产品与配方、危害分析、CCP 判定、
预防控制措施、召回计划，到整套食品安全 SOP，最后一键导出为格式化的 **Word 文档**。
全程按中文操作习惯设计，法规依据指向《食品卫生通则》（CAC/RCP 1-1969）与
《食品安全国家标准 食品生产通用卫生规范》（GB 14881）。

> 本工具用于协助起草 HACCP 计划，不能替代企业食品安全负责人、食品安全顾问或相关机构的审核与签署。

## 功能一览

- **企业概况** — 企业名称、地址、食品类别、负责人与联系方式，计划下所有产品共用。
- **HACCP 团队（预备步骤 1）** — 组建负责本计划的多学科团队。
- **GMP 与前提方案** — 人员卫生、卫生操作（SSOP）、虫害防治、培训、班前检查等起始文档模板。
- **供应商** — 建立并维护合格供应商清单、保证书与认证。
- **产品（预备步骤 2 和 3）** — 描述每个产品的组成、分销、预期用途与预期消费者。
- **工艺流程（预备步骤 4 和 5）** — 绘制流程图并在现场确认。
- **配方** — 原料级详细信息：占配方比例、功能作用、关联供应商、原产国、是否过敏原等。
- **危害分析（原则 1）** — 每个工艺步骤的生物、化学、物理危害，提供预填建议与过敏原驱动建议。
- **CCP 判定（原则 2）** — Codex 四问判定树，每次作答后服务端重新评估。
- **预防控制措施（原则 3-7）** — 关键限值、监控、纠正措施、验证、记录保存、责任人。
- **召回计划** — 指定召回团队角色与联系人，并记录年度模拟召回。
- **SOP** — 按产品过敏原声明、供应商验证、HACCP 计划验证与年度再评估、纠正措施与验证记录等。
- **审核与导出** — 摘要统计与解锁/导出流程，下载格式化、可审计的 Word 文档。
- **控制台** — 计划列表，支持**新建、重命名、删除**计划，一键进入向导。

## 法规框架

本应用遵循 **Codex/NACMCF 的 HACCP 结构**（5 个预备步骤 + 7 项原则），这是国际上普遍
认可并采用的 HACCP 实施框架。各 SOP 模板的法规依据标注为：

- **CAC**：《食品卫生通则》（CAC/RCP 1-1969）
- **中国**：《食品安全国家标准 食品生产通用卫生规范》（GB 14881）
- **过敏原**：按《国际食品法典委员会》过敏原清单与 GB 7718 食品标签标准整理

本构建是**通用/跨行业**的，不针对特定食品行业分支应用逻辑。您可以在「企业概况」步骤
记录食品类别，并在模板文档中按需补充所在行业的具体要求。

## 技术栈

- **Next.js 14**（App Router）+ TypeScript + Tailwind CSS
- **Prisma** ORM，目标数据库 **Postgres**（本机可用 Docker 运行，或使用 Neon/Supabase 等免费实例）
- **NextAuth**（邮箱 + 密码凭据登录，bcrypt 加密，JWT 会话）
- **Stripe** 计费（一次性解锁计划 + 可选存储订阅），并提供开发模式旁路便于无密钥测试
- **docx** 生成导出的 Word 文档

## 本地运行

```bash
cd haccp-builder
npm install
cp .env.example .env        # 至少填写 DATABASE_URL（Postgres）和 NEXTAUTH_SECRET
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

`schema` 面向 Postgres——即使本地开发 `DATABASE_URL` 也须指向真实的 Postgres 实例。
可使用免费的 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com)，或在本地运行：

```bash
docker run -d --name haccp-postgres -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=haccp_builder -p 5432:5432 postgres
```

启动后访问 `http://localhost:3000`：注册账号、创建计划、按 13 步向导逐项填写。
`STRIPE_SECRET_KEY` 为空时，审核与导出步骤会显示「（开发模式）模拟解锁」按钮，
可无支付密钥走通全部流程（含 docx 导出）。

## 数据模型

详见 `prisma/schema.prisma`。核心实体：

- `User` — 账号与计费/保留状态
- `Plan` — 一个 HACCP 计划，持有序列化的 JSON `facilityProfile`，并关联 `products`、
  `vendors`、`sops`、`recallContacts`、`mockRecallRecords`、`haccpTeamMembers`、`exports`
- `HaccpTeamMember` — 预备步骤 1：HACCP 团队（区别于 `RecallContact` 召回团队）
- `Vendor` — 全厂合格供应商清单，可由配方的 `Ingredient` 关联
- `Product` — 厂内一个产品：预备步骤 2、3 的产品字段 + 预备步骤 5 的现场确认字段，
  并拥有自己的 `processSteps` 与 `ingredients`
- `Ingredient` — 产品级原料：名称、占配方比例、功能作用、可选关联 `Vendor`、
  原产国、过敏原标记与类型（由 Codex/GB 7718 过敏原清单提示）。驱动建议危害
  与按产品的过敏原声明
- `ProcessStep` — 产品工艺流程中的一个步骤（预备步骤 4）
- `Hazard` — 某步骤的一个危害，含 CCP 四问判定树的作答、`ccpStatus` 及预防控制字段（原则 3-7）
- `Sop` — 生成/编辑后的 GMP 或食品安全文档
- `RecallContact` / `MockRecallRecord` — 召回团队与模拟召回日志
- `PlanExport` — 导出文件记录（审计/再下载用）

> 多个字段（会员等级、计划状态、危害类型/严重度/可能性、CCP 状态）遵循既有约定
> 以 `String` 存储，允许值在 schema 注释与应用代码中说明。

## 核心逻辑

- `src/lib/ccpDecisionTree.ts` — Codex 四问 CCP 判定树的纯函数实现；危害 API 路由在每次
  作答更新后于服务端重跑，`ccpStatus` 绝不信任客户端传入
- `src/lib/hazardLibrary.ts` — 按工艺步骤名称的预填危害建议，以及按过敏原原料
  在接收/混合/包装/换产等步骤生成交叉接触危害建议
- `src/lib/allergenLibrary.ts` — 对齐 Codex 过敏原清单与 GB 7718 的主要过敏原清单
- `src/lib/sopTemplates.ts` — GMP/前提方案、召回计划及剩余食品安全 SOP 的起始模板，
  法规依据标注为 CAC/RCP 1-1969 与 GB 14881；`allergen_control` 模板为**按产品**生成，
  直接取自每个产品的 `Ingredient` 记录
- `src/lib/exportDocx.ts` — 通过 `docx` 包将整个计划组装为单个 Word 文档
- `src/lib/entitlements.ts` — 用户/计划权限的统一来源（导出门控、保留窗口、订阅状态）

## 隐私与数据安全

- **按构建隔离**。每个 API 路由从已签名会话解析当前用户（`src/lib/session.ts`），
  并以 `userId`（直接或通过所属 `Plan`/`Product`/`ProcessStep` 传递）限定每个 Prisma 查询。
  不存在接受裸 plan/product/step/hazard/ingredient id 而不校验所有权的接口。
- **凭据登录而非 OAuth**。邮箱 + 密码（bcrypt 12 轮哈希），会话为签名的 JWT（`NEXTAUTH_SECRET`）。
- **保留模型**。标准套餐的计划在创建时设置 `retentionExpiresAt`
  （`DEFAULT_RETENTION_DAYS`，默认 90 天），解锁/订阅事件时刷新；有效的存储订阅会移除该期限。
  > 注意：实际的清理任务尚未实现，见下方「待办事项」。
- **用户主动删除**。`DELETE /api/plans/[id]` 通过级联删除删除计划及其全部关联数据。
  控制台提供「删除」按钮并带二次确认。

## 计费模型

一次性费用解锁单个计划（`Plan.isPaid`）以启用 Word 导出；可选的周期存储订阅
（`User.storageSubscriptionEnd`）可移除默认保留期限。使用 Stripe Checkout
（`/api/billing/checkout`），由 webhook（`/api/billing/webhook`）完成履约。
未设置 `STRIPE_SECRET_KEY` 时，两个路由安全地空操作，UI 回退到开发模式解锁按钮
（`/api/billing/checkout-dev-unlock`，部署后由 `ALLOW_FREE_UNLOCK` 控制）。

正式启用：创建两个 Stripe 价格，设置 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、
`STRIPE_PRICE_ID_ONE_TIME`、`STRIPE_PRICE_ID_STORAGE_SUBSCRIPTION`，并在 Stripe
后台注册 webhook 端点。

## 待办事项 / 后续计划

1. **保留期清理任务** — 尚无定时任务清除超过 `retentionExpiresAt` 的计划。
2. **账户删除流程** — 尚无用户可见的「删除账号及全部数据」动作（级联关系已就绪）。
3. **邮箱验证 / 密码重置** — 注册即刻完成，无邮箱验证环节。
4. **PDF 导出** — 在 docx 之外按需增加。
5. **正式审核/签署步骤** — 例如导出前的电子签名或「[姓名] 于 [日期] 审核」确认。
6. **模板与判定树语言的法规复核** — 模板语言遵循标准 Codex/NACMCF 结构，未经食品安全
   顾问、律师或监管机构审查，请作为起草起点而非合规保证。
7. **生产数据库** — Postgres 已是配置的 provider（见 DEPLOYMENT.md）；字符串类型的枚举字段
   与 JSON 字符串 `facilityProfile` 可按需转换为原生 Prisma `enum`/`Json` 类型。
