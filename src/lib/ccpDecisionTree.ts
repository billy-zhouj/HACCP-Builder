/**
 * CCP decision-tree engine — Principle 2 of the Codex Alimentarius/NACMCF
 * HACCP system.
 *
 * Implements the classic four-question Codex CCP decision tree. This exact
 * structure is mandatory verbatim for FDA seafood HACCP (21 CFR 123), FDA
 * juice HACCP (21 CFR 120), and USDA FSIS meat/poultry HACCP (9 CFR 417),
 * and is the same tree CFIA references in its guidance for Preventive
 * Control Plans under the Safe Food for Canadians Regulations (SFCR). For
 * general manufactured-food facilities under FDA's FSMA Hazard Analysis and
 * Risk-Based Preventive Controls rule (21 CFR Part 117 Subpart C, "HARPC"),
 * this tree is not a regulatory mandate but is a widely accepted way to
 * make the same CCP-vs-other-preventive-control determination consistently.
 *
 * This is decision-support, not a substitute for review/sign-off by the
 * individual(s) responsible for food safety at your facility.
 */

export type YesNo = boolean;

export interface DecisionTreeAnswers {
  /** Q1: Do control measures exist for this hazard at this or a later step? */
  q1DoControlMeasuresExist: YesNo | null;
  /** Q2: Is this step specifically designed to eliminate/reduce the hazard to an acceptable level? */
  q2IsStepSpecificallyToControl: YesNo | null;
  /** Q3: Could contamination occur at, or increase to, an unacceptable level at this step? */
  q3CouldContaminationExceedLimit: YesNo | null;
  /** Q4: Will a later step eliminate the hazard or reduce it to an acceptable level? */
  q4WillLaterStepEliminate: YesNo | null;
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
  q1DoControlMeasuresExist: {
    short: "该危害是否存在控制措施——在本步骤，或流程中任何后续步骤？",
    plain: "在你的流程中，是否有任何能够控制该危害的措施？",
    help: "要同时查看本步骤及其后的所有步骤——不只是当前这一步。",
    howToDecide:
      "控制措施是任何能够预防、消除或将危害降至可接受水平的行动或活动。包括工艺步骤（加热、金属检测、筛分、过滤）以及存在于前提方案中的预防控制措施（卫生、过敏原转产、供应商保证）。只要其中任何一项适用于该危害，答案即为「是」。",
    yesExample:
      "是——沙门氏菌可能存在于来料生禽肉中，后续经验证的加热步骤达到 74°C 即可将其杀灭。",
    noExample:
      "否——玻璃碎片可能在本步骤进入，且下游没有任何措施（无检验、过滤或检测）能够将其去除。",
    watchOut:
      "如果回答「否」，不要就此放过。Codex 与 FDA/CFIA 指南都要求追问：在本步骤进行控制对食品安全是否必要？如果是，那么这就是一个无控制的重大危害——你必须修改步骤、工艺或产品以引入控制措施。这是工艺重新设计，而非简单的一个「不是 CCP」结果。",
    consequence:
      "「是」→ 继续 Q2。「否」→ 当前不是 CCP，且你可能需要改变工艺来控制该危害。",
  },
  q2IsStepSpecificallyToControl: {
    short: "本步骤是否专门设计用于消除该危害，或将其降至可接受水平？",
    plain: "该步骤是否被有意放入流程，专门用于处理这一特定危害？",
    help: "仅适用于加工步骤——对于来料/收货，视为不适用（回答「否」）并继续至 Q3。",
    howToDecide:
      "「专门设计」意味着该步骤的存在——至少部分地——是为了控制该危害，并且你可以为其设定一个可测量的限值。加热、巴氏杀菌、金属检测、筛分和酸化通常符合。混合、接收、储存和包装通常不符合，即使这些步骤可能也存在危害。",
    yesExample:
      "是——巴氏杀菌器专门设计为将产品在 72°C 保持 15 秒，以杀灭营养型病原体。",
    noExample:
      "否——混合步骤中可能存在的病原体，但混合本身并无意降低它们。",
    watchOut:
      "有两处最容易出错。(1) 此问题仅适用于加工步骤——对于来料/收货，视为「不适用」，回答「否」并继续 Q3。(2) 如果实际降低危害的是某个 SOP 或前提方案，答案也是「否」。此问题问的是加工步骤本身是否设计用于控制危害——而非围绕该步骤的某个程序是否控制了它。还要注意，回答「是」会立即终止判定树并得出 CCP 结论，因此只有在这是控制该危害真正最合适的步骤时才回答「是」。",
    consequence: "「是」→ 本步骤是 CCP（判定树结束）。「否」→ 继续 Q3。",
  },
  q3CouldContaminationExceedLimit: {
    short: "污染是否可能在本步骤发生，或增加到不可接受的水平？",
    plain: "如果此处的控制失效，该危害是否会在此步骤达到危险水平？",
    help: "假设控制措施失效的情况下回答——这正是该问题的意义所在。",
    howToDecide:
      "此问题询问的是，如果控制措施失效，本步骤是否存在、发生或增加污染。请基于产品、工艺、企业历史（投诉、召回、偏差、环境监测结果）和行业数据作答——而不是基于一切正常运转的假设。",
    yesExample:
      "是——冷却过程中如果冷却速率下滑，产气荚膜梭菌芽孢可能萌发并繁殖超过安全水平。",
    noExample:
      "否——产品在此步骤已密封并冷冻保存；没有实际的途径让污染进入或让危害生长。",
    watchOut:
      "不要仅仅因为你的控制措施通常有效就回答「否」——该问题假设它们失效了。这里适用常规经验法则：如果你不确定如何回答，在获得相反证据之前假设最坏情况。不确定时回答「是」，让 Q4 去解决。",
    consequence: "「是」→ 继续 Q4。「否」→ 本步骤不是 CCP。",
  },
  q4WillLaterStepEliminate: {
    short: "后续步骤是否会消除该危害，或将其降至可接受水平？",
    plain: "下游是否有某一步骤能真正解决这个问题？",
    help: "只考虑你确实能够验证和监测的后续步骤。",
    howToDecide:
      "向前查看剩余步骤，寻找针对该特定危害的真正的杀灭或降低步骤——一个你能验证、监测并记录关键限值的步骤。模糊的「后面大概会处理」不算数。",
    yesExample:
      "是——成型步骤可能存在病原体，但后续经验证的加热步骤可将其杀灭。",
    noExample:
      "否——这是包装前的最后一道金属检测点；其后没有任何措施能去除金属碎片。",
    watchOut:
      "如果回答「是」，本步骤不是 CCP——但你现在依赖的是那个后续步骤。务必确保该步骤也通过本判定树评估，并被指定为带有自身关键限值的 CCP。最常见的失败是危害悄悄消失，因为每一步都指向下一步。",
    consequence: "「是」→ 本步骤不是 CCP（该后续步骤才是）。「否」→ 本步骤是 CCP。",
  },
};

/** 使用判定树前值得通读的通用原则。 */
export const DECISION_TREE_PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "一次只处理一个步骤的一个危害",
    body: "判定树分别应用于每个工艺步骤上的每一个重大危害。同一危害在一个步骤是 CCP、在另一个步骤不是——这是正常现象，而非矛盾。",
  },
  {
    title: "拿不准时，假设最坏情况",
    body: "如果无法决定如何回答某个问题，在获得相反证据之前假设最坏情况。把危害继续沿判定树向后传导，比过早地将其排除更安全。",
  },
  {
    title: "并非所有步骤都应是 CCP",
    body: "由前提方案（GMP、卫生、个人卫生、虫害控制、过敏原隔离、供应商保证）充分控制的危害，在那里得到控制，而不是作为 CCP。指定不必要的 CCP 会分散对真正保障食品安全的要点的关注。",
  },
  {
    title: "控制该危害的 SOP 并不使该步骤「设计用于控制它」",
    body: "这是 Q2 最常见的错误。如果某步骤的危害是由 SOP 或前提方案降低的，那么加工步骤本身并非设计用于控制该危害——是 SOP 在起作用。对 Q2 回答「否」，并记录相应的控制 SOP，而不是指定 CCP。",
  },
  {
    title: "CCP 需要可测量的关键限值",
    body: "如果你无法设定一个可实时测量和监测的限值（温度、时间、pH、浓度、网目尺寸），该步骤很可能不是真正的 CCP。",
  },
  {
    title: "完全没有控制措施是危险信号",
    body: "如果某个重大危害在你的流程中任何地方都没有控制，答案不是「不是 CCP」——而是产品或工艺必须改变，以便该危害能够得到控制。",
  },
  {
    title: "写下你的推理",
    body: "保留每个答案的理由。FDA 和 CFIA 检查员都会核实你的决策有依据支撑，而一年之后你也不会记得当初为什么这样回答。",
  },
];

/**
 * Runs the answers so far through the decision tree and returns either the
 * final classification or the next question that still needs an answer.
 */
export function evaluateDecisionTree(answers: DecisionTreeAnswers): DecisionResult {
  const { q1DoControlMeasuresExist, q2IsStepSpecificallyToControl, q3CouldContaminationExceedLimit, q4WillLaterStepEliminate } =
    answers;

  if (q1DoControlMeasuresExist === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q1DoControlMeasuresExist" };
  }

  if (q1DoControlMeasuresExist === false) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "no-control-measure",
      reason:
        "该危害在本步骤或任何后续步骤都不存在控制措施。按现状它不是 CCP——但如果在本步骤进行控制对食品安全是必要的，你必须改变工艺、产品配方或预期用途，使该危害能在计划的某个环节得到控制。",
      nextQuestion: null,
    };
  }

  if (q2IsStepSpecificallyToControl === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q2IsStepSpecificallyToControl" };
  }

  if (q2IsStepSpecificallyToControl === true) {
    return {
      status: "CCP",
      reasonKey: "step-designed-to-control",
      reason:
        "本步骤专门设计用于消除该危害或将其降至可接受水平，因此它是一个关键控制点（CCP）。请在下一步为其定义关键限值和监测程序。",
      nextQuestion: null,
    };
  }

  if (q3CouldContaminationExceedLimit === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q3CouldContaminationExceedLimit" };
  }

  if (q3CouldContaminationExceedLimit === false) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "no-realistic-contamination-risk",
      reason:
        "该危害在本步骤不太可能发生污染，或污染不太可能增加到不可接受的水平，因此它不是本步骤的 CCP。请确保你的判定依据记录下原因——检查员会询问。",
      nextQuestion: null,
    };
  }

  if (q4WillLaterStepEliminate === null) {
    return { status: "NOT_EVALUATED", reasonKey: null, reason: null, nextQuestion: "q4WillLaterStepEliminate" };
  }

  if (q4WillLaterStepEliminate === true) {
    return {
      status: "NOT_A_CCP",
      reasonKey: "later-step-controls",
      reason:
        "后续步骤将消除该危害或将其降至可接受水平，因此本步骤不是 CCP。重要提示：请确保该后续步骤本身也通过本判定树评估并被指定为 CCP——否则该危害最终将无处受控。",
      nextQuestion: null,
    };
  }

  return {
    status: "CCP",
    reasonKey: "no-later-control-required-now",
    reason:
      "污染可能在此处达到不可接受的水平，且没有后续步骤能够控制它，因此本步骤是一个关键控制点（CCP）。请在下一步为其定义关键限值和监测程序。",
    nextQuestion: null,
  };
}

export const QUESTION_ORDER: (keyof DecisionTreeAnswers)[] = [
  "q1DoControlMeasuresExist",
  "q2IsStepSpecificallyToControl",
  "q3CouldContaminationExceedLimit",
  "q4WillLaterStepEliminate",
];

/** 渲染已作答的路径，例如「Q1 是 → Q2 否 → Q3 是」。 */
export function describeAnswerPath(answers: DecisionTreeAnswers): string {
  return QUESTION_ORDER.map((q, i) => {
    const v = answers[q];
    if (v === null) return null;
    return `Q${i + 1} ${v ? "是" : "否"}`;
  })
    .filter(Boolean)
    .join("  →  ");
}
