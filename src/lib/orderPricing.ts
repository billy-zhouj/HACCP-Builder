/**
 * 国内支付的价格表（元）。
 *
 * 服务端唯一事实源：金额以服务端为准，前端组件仅作展示。客户端传入的金额
 * 必须与价格表一致，否则订单被拒绝（防止伪造金额）。
 */
export const PLAN_UNLOCK_PRICE_CNY = Number(process.env.PLAN_UNLOCK_PRICE_CNY ?? 99);

/** 转换为分。 */
export function toFen(cny: number): number {
  return Math.round(cny * 100);
}

/** 从分转换为元（保留两位小数）。 */
export function toYuan(fen: number): number {
  return fen / 100;
}
