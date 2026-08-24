/**
 * CCP decision-tree engine — Principle 2 of the Codex Alimentarius/NACMCF
 * HACCP system.
 *
 * Implements the four-question CCP decision tree from the Codex 2022 revision
 * (CXC 1-1969, Annex IV, Figure 1):
 *
 *   Q1. Can the significant hazard be controlled at an acceptable level at
 *       this step by prerequisite programs (e.g., GHP)?
 *         Yes → this step is not a CCP (move to the next hazard/step)
 *         No  → Q2
 *   Q2. Are there specific control measures for this identified significant
 *       hazard at this step?
 *         Yes → Q3
 *         No  → this step is not a CCP; subsequent steps should be evaluated
 *               for whether they are CCPs
 *   Q3. Will a subsequent step prevent or eliminate this identified
 *       significant hazard, or reduce it to an acceptable level?
 *         Yes → that subsequent step should be a CCP
 *         No  → Q4
 *   Q4. Can this step prevent or eliminate this identified significant hazard,
 *       or reduce it to an acceptable level?
 *         Yes → this step is a CCP
 *         No  → modify the step, process or product to implement control
 *               measures (then return to the start of the tree after a new
 *               hazard analysis)
 *
 * This is decision-support, not a substitute for review/sign-off by the
 * individual(s) responsible for food safety at your facility.
 */

export type YesNo = boolean;

export interface DecisionTreeAnswers {
  /** Q1: Can the significant hazard be controlled at an acceptable level at this step by prerequisite programs (e.g., GHP)? */
  q1CanBeControlledByPrp: YesNo | null;
  /** Q2: Are there specific control measures for this identified significant hazard at this step? */
  q2HasSpecificControlMeasures: YesNo | null;
  /** Q3: Will a subsequent step prevent or eliminate the identified significant hazard, or reduce it to an acceptable level? */
  q3WillLaterStepPreventOrEliminate: YesNo | null;
  /** Q4: Can this step prevent or eliminate the identified significant hazard, or reduce it to an acceptable level? */
  q4CanStepPreventOrEliminate: YesNo | null;
}

export type DecisionResult =
  | { status: "NOT_A_CCP"; reasonKey: string; reason: string; nextQuestion: null }
  | { status: "CCP"; reasonKey: string; reason: string; nextQuestion: null }
  | { status: "PRW"; reasonKey: string; reason: string; nextQuestion: null }
  | { status: "NOT_EVALUATED"; reasonKey: null; reason: null; nextQuestion: keyof DecisionTreeAnswers };

export interface QuestionGuidance {
  short: string;
  plain: string;
  help: string;
  howToDecide: string;
  yesExample: string;
  noExample: string;
  watchOut: string;
  consequence: string;
}

export const QUESTION_TEXT: Record<keyof DecisionTreeAnswers, QuestionGuidance> = {
  q1CanBeControlledByPrp: {
    short: "该显著危害能否通过前提方案（如 GHP）在本步骤被控制在可接受水平？",
    plain: "靠良好卫生规范（GHP）等前提方案，这一危害在本步骤是否已经足够受控？",
    help: "先评估危害的显著性——无控制时发生的可能性与影响严重度——再判断 GHP 是否足以控制它。",
    howToDecide:
      "前提方案包括常规 GHP（清洁消毒、人员卫生、虫害控制、设备维护、过敏原隔离、供应商保证）以及控制该危害需要更多关注的 GHP（如针对该危害的监控与记录）。只有当这些措施足以把该显著危害控制在可接受水平时才回答「是」；如果还需要一个能设定关键限值的工艺控制步骤，回答「否」。",
    yesExample:
      "是——包装步骤的微生物风险，可由既有的清洁消毒与人员卫生 GHP 控制在可接受水平，无需单独的工艺控制步骤。",
    noExample:
      "否——原料接收步骤的致病菌风险无法仅靠 GHP 控制，必须依赖后续的加热等工艺控制步骤。",
    watchOut:
      "不要因为「存在某个 SOP」就回答「是」——必须是 GHP 本身足以充分控制该显著危害。对显著危害（高严重度或高可能性）尤其谨慎：轻易把显著危害归给前提方案，是审核中最常见的缺陷之一。",
    consequence: "「是」→ 本步骤不是 CCP（转向下一个危害/步骤）。「否」→ 继续 Q2。",
  },
  q2HasSpecificControlMeasures: {
    short: "本步骤是否存在针对该已识别显著危害的特定控制措施？",
    plain: "在这一步本身，有没有专门针对这一危害的控制手段？",
    help: "只看本步骤——不要看后续步骤（那是 Q3 的事）。",
    howToDecide:
      "特定控制措施是专门针对该已识别显著危害而设计的措施，通常能设定可测量的关键限值（温度、时间、pH、浓度、网目尺寸等）。加热、巴氏杀菌、金属检测、筛分、酸化通常符合；混合、储存、包装这类步骤即使存在一般性卫生措施，通常也不算针对该危害的特定控制措施。",
    yesExample: "是——巴氏杀菌步骤专门将产品在 72°C 保持 15 秒，针对营养型病原体。",
    noExample: "否——原料接收步骤只有常规验收与清洁要求，没有专门针对该致病菌的控制手段。",
    watchOut:
      "回答「否」并不意味着放过该危害——后续步骤应被评估是否为 CCP（Q3）。若在问题 2–4 均未识别出 CCP，必须修改工艺或产品以实施控制措施，并开展新的危害分析。",
    consequence: "「是」→ 继续 Q3。「否」→ 本步骤不是 CCP，后续步骤应被评估是否为 CCP。",
  },
  q3WillLaterStepPreventOrEliminate: {
    short: "后续步骤是否将预防或消除该已识别显著危害，或将其降至可接受水平？",
    plain: "下游是否有一个真正的步骤能把这个危害解决掉？",
    help: "只考虑你确实能够验证、监测并记录关键限值的后续步骤。",
    howToDecide:
      "向前查看剩余步骤，寻找针对该特定危害的真正的杀灭或降低步骤——一个你能验证、监测并记录关键限值的步骤。模糊的「后面大概会处理」不算数。",
    yesExample: "是——成型步骤可能引入的病原体，后续经验证的加热步骤可将其杀灭。",
    noExample: "否——这是包装前最后一道金属检测点，其后没有任何措施能去除金属碎片。",
    watchOut:
      "回答「是」时，本步骤不是 CCP——但你现在依赖的是那个后续步骤。务必确保该后续步骤本身也通过判定树评估，并被指定为带有自身关键限值的 CCP。最常见的失败是危害悄悄消失，因为每一步都指向下一步。",
    consequence: "「是」→ 该后续步骤应是 CCP（本步骤不是）。「否」→ 继续 Q4。",
  },
  q4CanStepPreventOrEliminate: {
    short: "本步骤是否可针对该已识别显著危害加以预防或消除，或将其降至可接受水平？",
    plain: "这一步本身有没有能力把这个危害压下来？",
    help: "判断本步骤的控制能力——它能否预防、消除或降低该危害至可接受水平。",
    howToDecide:
      "评估本步骤是否具备预防、消除或将该显著危害降至可接受水平的能力，例如可设定并执行的工艺参数（关键限值）。同时考虑本步骤的控制措施是否与其他步骤的控制措施协同控制同一危害——若是，两个步骤都应被视为 CCP。",
    yesExample: "是——烘烤步骤可将中心温度控制在 ≥90°C 并维持 5 分钟，足以杀灭原料中可能存在的病原菌。",
    noExample: "否——储存步骤无法消除已引入的金属碎片，也没有能力将其降至可接受水平。",
    watchOut:
      "回答「否」是危险信号：它意味着当前工艺对该显著危害没有任何可用的控制。不要就此放过——你必须修改步骤、工艺或产品以实施控制措施，然后在（新）危害分析之后回到决策树起点。",
    consequence: "「是」→ 本步骤是 CCP（编号并纳入 HACCP 工作表）。「否」→ 修改步骤、工艺或产品以实施控制措施。",
  },
};

/** 使用判定树前值得通读的通用原则。 */
export const DECISION_TREE_PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "一次只处理一个步骤的一个危害",
    body: "判定树分别应用于每个工艺步骤上的每一个显著危害。同一危害在一个步骤是 CCP、在另一个步骤不是——这是正常现象，而非矛盾。",
  },
  {
    title: "拿不准时，假设最坏情况",
    body: "如果无法决定如何回答某个问题，在获得相反证据之前假设最坏情况。把危害继续沿判定树向后传导，比过早地将其排除更安全。",
  },
  {
    title: "并非所有步骤都应是 CCP",
    body: "可由前提方案（GHP、卫生、个人卫生、虫害控制、过敏原隔离、供应商保证）充分控制在可接受水平的危害（Q1 答「是」），在那里得到控制，而不是作为 CCP。指定不必要的 CCP 会分散对真正保障食品安全要点的关注。",
  },
  {
    title: "Q3 答「是」时，你依赖的是后续步骤",
    body: "该后续步骤必须同样通过判定树评估，并被指定为带有自身关键限值的 CCP。最常见的失败是危害悄悄消失——因为每一步都指向下一步。",
  },
  {
    title: "CCP 需要可测量的关键限值",
    body: "如果你无法为某个步骤设定可实时测量和监测的限值（温度、时间、pH、浓度、网目尺寸），该步骤很可能不是真正的 CCP。",
  },
  {
    title: "Q4 答「否」是危险信号",
    body: "若本步骤无法预防、消除或降低该显著危害，答案不是「不是 CCP」——而是产品或工艺必须改变，以便该危害能够得到控制。修改后开展新的危害分析，并回到判定树起点。",
  },
  {
    title: "写下你的推理",
    body: "保留每个答案的理由。审核人员会核实你的决策有依据支撑，而一年之后你也不会记得当初为什么那样回答。",
  },
];

/**
 * Runs the answers so far through the decision tree and returns either the
 * final classification or the next question that still needs an answer.
 */
export function evaluateDecisionTree(answers: DecisionTreeAnswers): DecisionResult {
  const {
    q1CanBeControlledByPrp,
    q2HasSpecificControlMeasures,
    q3WillLaterStepPreventOrEliminate,
    q4CanStepPreventOrEliminate,
  } = answers;

  if (q1CanBeControlledByPrp === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q1CanBeControlledByPrp" };
  }

  if (q1CanBeControlledByPrp === true) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "controlled-by-prp",
      reason:
        "该显著危害可通过前提方案（如 GHP）在本步骤被控制在可接受水平，因此本步骤不是 CCP。转向下一个危害/步骤。",
      nextQuestion: null,
    };
  }

  if (q2HasSpecificControlMeasures === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q2HasSpecificControlMeasures" };
  }

  if (q2HasSpecificControlMeasures === false) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "no-specific-control-at-step",
      reason:
        "本步骤不存在针对该已识别显著危害的特定控制措施，因此本步骤不是 CCP——后续步骤应被评估是否为 CCP。若问题 2–4 均未识别出 CCP，须修改工艺或产品以实施控制措施，并开展新的危害分析。",
      nextQuestion: null,
    };
  }

  if (q3WillLaterStepPreventOrEliminate === null) {
    return {
      status: "NOT_EVALUATED",
      reasonKey: null,
      reason: null,
      nextQuestion: "q3WillLaterStepPreventOrEliminate",
    };
  }

  if (q3WillLaterStepPreventOrEliminate === true) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "later-step-should-be-ccp",
      reason:
        "后续步骤将预防或消除该已识别显著危害（或将其降至可接受水平），因此该后续步骤应是 CCP。务必确保该后续步骤本身也通过本判定树评估，并被指定为带有自身关键限值的 CCP。",
      nextQuestion: null,
    };
  }

  if (q4CanStepPreventOrEliminate === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q4CanStepPreventOrEliminate" };
  }

  if (q4CanStepPreventOrEliminate === true) {
    return {
      status: "CCP",
      reasonKey: "step-can-prevent-or-eliminate",
      reason:
        "本步骤可针对该已识别显著危害加以预防或消除（或将其降至可接受水平），因此本步骤是一个关键控制点（CCP）。请为它编号、设定关键限值与监控程序，并纳入 HACCP 工作表。",
      nextQuestion: null,
    };
  }

  return {
    status: "NOT_A_CCP",
    reasonKey: "no-control-possible",
    reason:
      "本步骤无法预防、消除或将该显著危害降至可接受水平——当前工艺没有可用的控制措施。按现状它不是 CCP，但你必须修改步骤、工艺或产品以实施控制措施；在（新）危害分析之后，回到决策树起点。",
    nextQuestion: null,
  };
}

export const QUESTION_ORDER: (keyof DecisionTreeAnswers)[] = [
  "q1CanBeControlledByPrp",
  "q2HasSpecificControlMeasures",
  "q3WillLaterStepPreventOrEliminate",
  "q4CanStepPreventOrEliminate",
];

/** 渲染已作答的路径，例如「Q1 否 → Q2 是 → Q3 否」。 */
export function describeAnswerPath(answers: DecisionTreeAnswers): string {
  return QUESTION_ORDER.map((q, i) => {
    const v = answers[q];
    if (v === null) return null;
    return `Q${i + 1} ${v ? "是" : "否"}`;
  })
    .filter(Boolean)
    .join("  →  ");
}
