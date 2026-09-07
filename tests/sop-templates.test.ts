/**
 * SOP 模板 × markdown 解析器 契约测试
 *
 * 目的（两件事，缺一不可）：
 *
 *  1. 守住"模板内容"这道门禁。exportDocx 用的是自研极简 markdown 解析器，
 *     遇到不支持的语法**不会报错**，而是原样输出成纯文本——于是表格悄悄变成
 *     段落、`**加粗**` 变成字面星号、列数不齐的表格静默串列。这类缺陷要等客户
 *     拿到 Word 文档才被发现，且极难定位到是哪个模板引入的。本测试把这条不变量
 *     变成每次提交都会跑的红灯：
 *         "所有内置模板都只使用解析器支持的语法"。
 *
 *  2. 守住"解析器语义"这道门禁。锁定块级结构的关键行为（标题层级、列表续编号、
 *     CJK 换行拼接、表格解析、引用合并），防止日后改动解析器（或换成第三方库）
 *     时悄悄改变已交付文档的排版。
 *
 * 设计上尽量**从真实解析器的输出反推劣化**（见 findDegradations 中的"孤立管道
 * 行"与表格形状检查），而不是在测试里重抄一份规则表——这样测试不会与实现漂移。
 * 只有"解析器有意不支持的语法"这一份清单是显式声明的，它同时充当文档。
 * 另有一组"门禁自检"用已知坏样本证明检测确实会报警，防止门禁悄悄失效。
 *
 * 运行： npm test   （无需数据库、无需网络、无需环境变量）
 *
 * 新增测试文件时，请把路径追加到 package.json 的 test 脚本里。
 * 不要改成自动发现或 glob：Node 18/20 的默认发现模式不包含 .ts，
 * 那样会在这些版本上静默跑 0 个测试——CI 绿灯但其实什么都没测。
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SOP_TEMPLATES, type SopRenderContext } from "@/lib/sopTemplates";
import { parseMarkdown, type MdBlock, type ListCounter } from "@/lib/exportDocx";

const CATEGORIES = ["gmp", "food_safety", "recall"] as const;

/** 一个数据齐全的计划：供应商/团队/产品/召回等都被填充。 */
const FULL_CTX: SopRenderContext = {
  facility: {
    facilityName: "测试食品有限公司",
    address: "上海市浦东新区测试路 100 号",
    foodCategories: "即食肉制品、常温酱料",
    responsibleIndividual: "张三",
    responsibleIndividualContact: "13800000000",
  } as never,
  vendors: [
    {
      name: "供应商A",
      materialsSupplied: "鸡肉",
      status: "APPROVED",
      certification: "SQF",
      guaranteeOnFile: true,
      guaranteeExpiry: "2026-12-31",
      contactName: "李四",
      phone: "021-1234",
      email: "a@b.com",
    },
  ] as never,
  haccpTeam: [
    { name: "张三", role: "QA 主管", expertise: "微生物", responsibilities: "全面负责" },
  ] as never,
  products: [{ name: "酱牛肉", foodCategory: "肉制品" }] as never,
  recallContacts: [{ role: "召回协调人", name: "王五", phone: "139", email: "w@b.com" }] as never,
  mockRecalls: [
    { performedAt: "2026-01-01", performedBy: "王五", percentTraced: "98%", resultsSummary: "合格" },
  ] as never,
  productFormulations: [
    { productName: "酱牛肉", ingredients: [{ name: "大豆油", isAllergen: true, allergenType: "大豆" }] },
  ] as never,
};

/** 一个字段全空的计划：用户刚创建、什么都没填。模板必须优雅降级为占位符。 */
const SPARSE_CTX = { facility: {} } as never as SopRenderContext;

/**
 * 解析器有意不支持的 markdown 语法。命中即代表导出会静默劣化。
 * 新增模板若需要这些语法，请先把解析器补上，而不是放宽这里。
 */
const UNSUPPORTED: { re: RegExp; why: string }[] = [
  { re: /```/, why: "围栏代码块：``` 会作为字面文本输出" },
  { re: /!\[[^\]]*\]\(/, why: "图片：解析器不支持，会输出字面 ![…](…)" },
  { re: /\[[^\]]*\]\([^)]+\)/, why: "链接：解析器不支持，会输出字面 […](…)" },
  {
    re: /<\/?(?:br|div|span|u|b|i|em|strong|p|a|img|table|thead|tbody|tr|td|th|ul|ol|li|hr|h[1-6])\b[^>]*>/i,
    why: "HTML 标签：会输出尖括号字面文本（如需换行请另起一行）",
  },
  { re: /<https?:\/\/[^>]+>/, why: "自动链接 <http…>：不支持" },
  { re: /~~/, why: "删除线 ~~：不支持" },
  { re: /\*\*\*/, why: "三重强调 ***：嵌套解析会错乱（** 与 * 只用其一）" },
  { re: /^\s*[-*+]\s+\[[ xX]\]/, why: "任务列表 - [ ]：不支持（纸质表单勾选请直接写 [ ]）" },
];

/** 把块里的可读文本全部取出来（含表格表头与单元），用于文本层面的检查。 */
function textsOf(blocks: MdBlock[]): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  blocks.forEach((b, i) => {
    switch (b.kind) {
      case "heading":
      case "para":
      case "quote":
      case "bullet":
      case "ordered":
        out.push({ where: `${b.kind}#${i}`, text: b.text });
        break;
      case "table":
        b.header.forEach((c, ci) => out.push({ where: `table#${i} 表头列${ci}`, text: c }));
        b.rows.forEach((r, ri) =>
          r.forEach((c, ci) => out.push({ where: `table#${i} 第${ri + 1}行列${ci}`, text: c }))
        );
        break;
      default:
        break; // blank / hr
    }
  });
  return out;
}

/** 去掉行内代码后统计 ** 标记数，奇数即代表加粗未闭合。 */
function hasUnpairedBold(text: string): boolean {
  const markers = (text.replace(/`[^`]*`/g, "").match(/\*\*/g)?.length ?? 0) % 2;
  return markers === 1;
}

/**
 * 渲染一段 markdown 并返回所有"会静默劣化导出"的问题描述（空数组即合格）。
 *
 * A、B 两类从真实解析器输出反推（无需重抄规则，故不会与实现漂移）；
 * C 类依赖 UNSUPPORTED 清单。
 */
function findDegradations(md: string): string[] {
  const counter: ListCounter = { next: 1 };
  const { blocks } = parseMarkdown(md, counter);
  const problems: string[] = [];

  // A. 块级结构：没被识别的行会退化成 para，并保留其原始起始符号。
  for (const b of blocks) {
    if (b.kind !== "para") continue;
    if (/^\|/.test(b.text)) {
      problems.push(`孤立的表格行（缺少 | --- | 分隔行，整表会退化为纯文本）："${b.text.slice(0, 60)}"`);
    }
    if (/^#{1,6}\S/.test(b.text)) {
      problems.push(`标题 # 后缺少空格（不会被解析为标题）："${b.text.slice(0, 60)}"`);
    }
    if (/^=+$/.test(b.text)) {
      problems.push(`Setext 标题下划线 === 不支持："${b.text.slice(0, 60)}"`);
    }
  }

  // B. 表格形状：解析器用 max(列数) 补齐/截断，因此列数不齐不报错，
  //    只会静默串列——这正是必须拦住的缺陷。
  blocks.forEach((b, i) => {
    if (b.kind !== "table") return;
    if (b.rows.length === 0) problems.push(`表格 table#${i} 只有表头、没有数据行`);
    b.rows.forEach((r, ri) => {
      if (r.length !== b.header.length) {
        problems.push(
          `表格 table#${i} 第${ri + 1}行有 ${r.length} 列，表头有 ${b.header.length} 列` +
            `（列数不齐会被静默补齐或截断，导出表格串列）：${JSON.stringify(r).slice(0, 80)}`
        );
      }
    });
  });

  // C. 文本层面：不支持的行内语法 + 未闭合的强调标记。
  const lines = md.split("\n");
  for (const { re, why } of UNSUPPORTED) {
    const hit = lines.find((l) => re.test(l));
    if (hit) problems.push(`${why} —— 命中："${hit.trim().slice(0, 60)}"`);
  }
  for (const { where, text } of textsOf(blocks)) {
    if (hasUnpairedBold(text)) problems.push(`** 加粗未闭合（${where}）："${text.slice(0, 60)}"`);
    if ((text.match(/`/g)?.length ?? 0) % 2 === 1)
      problems.push(`行内代码反引号未闭合（${where}）："${text.slice(0, 60)}"`);
  }

  return problems;
}

describe("模板注册表", () => {
  it("非空、key 唯一、category 合法（拼错的 category 会让模板从导出中静默消失）", () => {
    assert.ok(SOP_TEMPLATES.length > 0, "SOP_TEMPLATES 为空");
    const seen = new Set<string>();
    for (const t of SOP_TEMPLATES) {
      assert.ok(t.key.trim().length > 0, `模板 "${t.title}" 的 key 为空`);
      assert.ok(!seen.has(t.key), `模板 key 重复：${t.key}`);
      seen.add(t.key);
      assert.ok(t.title.trim().length > 0, `模板 ${t.key} 的 title 为空`);
      assert.ok(
        (CATEGORIES as readonly string[]).includes(t.category),
        `模板 ${t.key} 的 category="${t.category}" 非法，应为 ${CATEGORIES.join("|")} 之一；拼错会让它永远不出现在导出文档里`
      );
    }
  });
});

describe("SOP 模板：渲染健壮性", () => {
  for (const t of SOP_TEMPLATES) {
    it(`[${t.key}] 在数据齐全与数据全空两种上下文下都能渲染`, () => {
      for (const [label, ctx] of [
        ["齐全", FULL_CTX],
        ["全空", SPARSE_CTX],
      ] as const) {
        let md = "";
        assert.doesNotThrow(() => {
          md = t.render(ctx);
        }, `渲染 ${label} 上下文时抛异常`);
        assert.ok(md.trim().length > 0, `${label} 上下文渲染结果为空`);
        for (const leak of ["undefined", "NaN", "[object Object]"]) {
          const bad = md.split("\n").find((l) => l.includes(leak));
          assert.ok(!bad, `${label} 上下文渲染结果含占位符泄漏 "${leak}"："${bad?.trim().slice(0, 80)}"`);
        }
      }
    });
  }
});

describe("SOP 模板：解析器语法契约（静默劣化门禁）", () => {
  for (const t of SOP_TEMPLATES) {
    it(`[${t.key}] 只使用解析器支持的语法`, () => {
      const problems = findDegradations(t.render(FULL_CTX));
      assert.deepEqual(
        problems,
        [],
        `模板 ${t.key} 存在 ${problems.length} 处会静默劣化导出的问题：\n  - ${problems.join("\n  - ")}`
      );
    });
  }
});

describe("SOP 模板：文档结构约定", () => {
  for (const t of SOP_TEMPLATES) {
    it(`[${t.key}] 以一级标题开头且至少含两个标题`, () => {
      const counter: ListCounter = { next: 1 };
      const { blocks } = parseMarkdown(t.render(FULL_CTX), counter);
      const first = blocks.find((b) => b.kind !== "blank");
      assert.ok(first, "模板无内容块");
      assert.equal(first?.kind, "heading", `模板应以 # 标题开头，实际首个块是 ${first?.kind}`);
      if (first?.kind === "heading") assert.equal(first.level, 1, "模板应以一级标题（# ）开头");
      const headings = blocks.filter((b) => b.kind === "heading");
      assert.ok(headings.length >= 2, `至少应有 2 个标题（文档标题 + 章节标题），实际 ${headings.length}`);
    });
  }
});

describe("门禁自检（证明检测确实会报警，防止测试退化成空门禁）", () => {
  const badSamples: { md: string; expectIncludes: string }[] = [
    { md: "| 列A | 列B |\n| 1 | 2 |", expectIncludes: "孤立的表格行" },
    { md: "| 列A | 列B |\n| --- | --- |\n| 只有一列 |", expectIncludes: "列数不齐" },
    { md: "详见 [官网](https://example.com) 说明", expectIncludes: "链接" },
    { md: "![流程图](https://example.com/a.png)", expectIncludes: "图片" },
    { md: "第一行<br>第二行", expectIncludes: "HTML 标签" },
    { md: "```python\nprint(1)\n```", expectIncludes: "围栏代码块" },
    { md: "~~已废弃~~ 条目", expectIncludes: "删除线" },
    { md: "***非常重要***", expectIncludes: "三重强调" },
    { md: "- [ ] 勾选框", expectIncludes: "任务列表" },
    { md: "##无空格标题", expectIncludes: "缺少空格" },
    { md: "加粗未闭合的文本**", expectIncludes: "加粗未闭合" },
    { md: "行内代码没闭合的`文本", expectIncludes: "反引号未闭合" },
  ];

  for (const { md, expectIncludes } of badSamples) {
    it(`能识别「${expectIncludes}」`, () => {
      const problems = findDegradations(md);
      assert.ok(
        problems.some((p) => p.includes(expectIncludes)),
        `期望检出「${expectIncludes}」，实际：${JSON.stringify(problems)}`
      );
    });
  }

  it("对合规模板零误报（否则门禁会被无视）", () => {
    const clean = "# 标题\n\n## 章节\n\n正文 **加粗** 与 `代码`。\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n";
    assert.deepEqual(findDegradations(clean), []);
  });
});

describe("解析器语义黄金用例（防止解析器被改坏）", () => {
  const parse = (md: string) => parseMarkdown(md, { next: 1 }).blocks.filter((b) => b.kind !== "blank");

  it("标题层级", () => {
    const blocks = parse("# A\n\n## B\n\n###### F");
    assert.deepEqual(
      blocks.map((b) => (b.kind === "heading" ? [b.level, b.text] : b.kind)),
      [
        [1, "A"],
        [2, "B"],
        [6, "F"],
      ]
    );
  });

  it("`#标题`（无空格）不算标题 —— 记录当前有意行为", () => {
    assert.equal(parse("#标题")[0]?.kind, "para");
  });

  it("表格：表头 + 分隔行 + 数据行", () => {
    const blocks = parse("| a | b |\n| --- | --- |\n| 1 | 2 |\n| 3 | 4 |");
    assert.equal(blocks.length, 1);
    assert.deepEqual(blocks[0], {
      kind: "table",
      header: ["a", "b"],
      rows: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
  });

  it("没有分隔行的竖线行不是表格（模板门禁靠此判定）", () => {
    assert.equal(parse("| a | b |\n| 1 | 2 |")[0]?.kind, "para");
  });

  it("列表缩进映射为 level", () => {
    const blocks = parse("- 顶层\n  - 二级\n    - 三级");
    assert.deepEqual(
      blocks.map((b) => (b.kind === "bullet" ? b.level : b.kind)),
      [0, 1, 2]
    );
  });

  it("有序列表：紧邻项共用编号序列，空行后重新起算", () => {
    const ordered = parse("1. a\n2. b\n\n3. c").filter(
      (b) => b.kind === "ordered"
    ) as Extract<MdBlock, { kind: "ordered" }>[];
    assert.equal(ordered.length, 3);
    const [x, y, z] = ordered;
    assert.equal(x.listId, y.listId, "1. 2. 应属同一序列");
    assert.notEqual(y.listId, z.listId, "空行后的 3. 应另起序列");
    assert.deepEqual([x.listId, z.listId], [1, 2], "counter 应从 1 起按序递增（并发安全依赖此）");
  });

  it("有序列表：保留起始编号", () => {
    assert.deepEqual(parseMarkdown("5. a\n6. b", { next: 1 }).orderedLists, [{ id: 1, start: 5 }]);
  });

  it("引用：连续 > 行合并为一段", () => {
    const blocks = parse("> 第一行\n> 第二行");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.kind, "quote");
  });

  it("分隔线 --- / *** / ___", () => {
    assert.deepEqual(parse("---\n\n***\n\n___").map((b) => b.kind), ["hr", "hr", "hr"]);
  });

  it("缩进的续行并入上一段：CJK 之间不插空格，拉丁字母插空格", () => {
    const cjk = parse("中文前半\n 中文后半")[0] as Extract<MdBlock, { kind: "para" }>;
    assert.equal(cjk.text, "中文前半中文后半", "CJK 之间不应插入空格（否则导出出现怪空格）");
    const latin = parse("hello\n world")[0] as Extract<MdBlock, { kind: "para" }>;
    assert.equal(latin.text, "hello world", "拉丁字母换行应插入空格");
  });

  it("未缩进的另一行算新段落（模板靠此让每行独立成段）", () => {
    assert.deepEqual(parse("致：[承运方名称]\n发件人：某公司").map((b) => b.kind), ["para", "para"]);
  });

  it("换行的列表项续接到同一项，而不是另起一项", () => {
    const bullets = parse("- 第一条\n  续写内容\n- 第二条").filter((b) => b.kind === "bullet");
    assert.equal(bullets.length, 2);
  });

  it("CRLF 与 LF 输入解析结果一致", () => {
    assert.deepEqual(
      parseMarkdown("## 标题\r\n\r\n- 项目\r\n", { next: 1 }).blocks,
      parseMarkdown("## 标题\n\n- 项目\n", { next: 1 }).blocks
    );
  });
});
