"use client";

import { useState } from "react";
import { PLAN_UNLOCK_PRICE_CNY } from "@/lib/orderPricing";

type PaymentMethod = "alipay" | "wechat";

type OrderResult = {
  success: boolean;
  orderId: string;
  orderNumber: string;
  amountCNY: number;
  expiresAt: string;
  paymentInstructions: Record<string, string | null>;
  nextSteps: string[];
};

const PAYMENT_METHODS: {
  key: PaymentMethod;
  label: string;
  sublabel: string;
  icon: string;
}[] = [
  { key: "wechat", label: "微信支付", sublabel: "WeChat Pay，扫码即付", icon: "💬" },
  { key: "alipay", label: "支付宝", sublabel: "Alipay，扫码即付", icon: "📱" },
];

export function PaymentOptions({
  planId,
  planName,
  onSuccess,
}: {
  planId: string;
  planName: string;
  onSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("wechat");
  const [contactEmail, setContactEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);

  async function handleSubmitOrder() {
    try {
      setLoading(true);
      setMessage(null);

      if (contactEmail.trim() && !/\S+@\S+\.\S+/.test(contactEmail.trim())) {
        setMessage({ type: "error", text: "请输入有效的联系邮箱（选填）" });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          planName,
          paymentMethod: selectedPaymentMethod,
          contactEmail: contactEmail.trim() || undefined,
          companyName: companyName.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "订单提交失败");
      }

      setOrderResult(data as OrderResult);
      setMessage({ type: "success", text: "订单已提交，请完成付款。" });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "提交失败，请重试" });
    } finally {
      setLoading(false);
    }
  }

  /** 开发模式：模拟解锁（仅本地/未配置真实支付时可用）。 */
  async function handleDevUnlock() {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch("/api/billing/checkout-dev-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "开发模式解锁失败");
      }
      setMessage({ type: "success", text: "✅ 计划已解锁（开发模式）！现在可以导出 Word 文档。" });
      onSuccess?.();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "开发模式解锁失败" });
    } finally {
      setLoading(false);
    }
  }

  if (orderResult) {
    return <PaymentInstructions order={orderResult} onBack={() => setOrderResult(null)} onActivated={onSuccess} />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">解锁此计划</h3>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            人民币结算
          </span>
        </div>
        <p className="text-sm text-slate-600">
          一次性支付 <strong className="text-lg text-brand-700">¥{PLAN_UNLOCK_PRICE_CNY}</strong>，
          解锁「{planName}」的格式化 Word 导出。付款到账后即可下载。
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">选择支付方式</h3>
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            扫码支付
          </span>
        </div>
        <div className="mb-3 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          🇨🇳 <strong>微信 / 支付宝</strong>：人民币结算，无需国际信用卡
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((method) => {
            const isSelected = selectedPaymentMethod === method.key;
            return (
              <button
                key={method.key}
                onClick={() => setSelectedPaymentMethod(method.key)}
                disabled={loading}
                className={`relative flex flex-col items-start rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                    : "border-slate-200 hover:border-green-300 hover:bg-slate-50"
                }`}
              >
                {method.key === "wechat" && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    默认
                  </span>
                )}
                <span className="text-2xl mb-2">{method.icon}</span>
                <span className="block text-sm font-medium text-slate-900">{method.label}</span>
                <span className="block text-xs text-slate-500 mt-0.5">{method.sublabel}</span>
                {isSelected && (
                  <svg className="absolute bottom-3 right-3 h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">联系信息（选填）</h3>
        <p className="text-xs text-slate-500 mb-4">用于记录订单与发送激活通知</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">企业名称</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例如：宁波 XX 食品有限公司"
              className="mt-1 block w-full rounded-md border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">联系邮箱</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="name@company.com"
              className="mt-1 block w-full rounded-md border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {message && message.type === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{message.text}</div>
      )}
      {message && message.type === "success" && !orderResult && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{message.text}</div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleSubmitOrder}
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {loading ? "处理中…" : `提交订单 · 微信/支付宝扫码付款 ¥${PLAN_UNLOCK_PRICE_CNY}`}
        </button>
        <p className="text-xs text-center text-slate-500">提交后立即显示收款二维码，付款到账后 24 小时内开通</p>

        <details className="mt-1 rounded-lg border border-dashed border-slate-300 bg-slate-50/50">
          <summary className="cursor-pointer px-3 py-2 text-center text-xs font-medium text-slate-500 hover:text-slate-700 select-none">
            🔧 开发者模式（模拟解锁，测试用）
          </summary>
          <div className="px-3 pb-3">
            <p className="mb-2 text-center text-xs text-slate-500">
              不经过真实支付直接解锁本计划，用于本地开发与端到端测试
              （需 <code className="rounded bg-slate-100 px-1">ALLOW_FREE_UNLOCK=true</code>）。
            </p>
            <button
              onClick={handleDevUnlock}
              disabled={loading}
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "处理中…" : "模拟解锁本计划"}
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}

function PaymentInstructions({
  order,
  onBack,
  onActivated,
}: {
  order: OrderResult;
  onBack: () => void;
  onActivated?: () => void;
}) {
  const instr = order.paymentInstructions;
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleActivate() {
    setActivating(true);
    setError(null);
    const res = await fetch(`/api/orders/${order.orderId}/activate`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setActivating(false);
    if (!res.ok) {
      setError(data.error || "激活失败");
      return;
    }
    setActivated(true);
    onActivated?.();
  }

  if (activated) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-base font-semibold text-green-800">✅ 已解锁！现在可以导出 Word 文档。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-green-900">订单已提交</h3>
            <p className="text-sm text-green-700">订单号：{order.orderNumber}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-600">支付金额</span>
            <p className="font-bold text-green-900 text-lg">¥{order.amountCNY}</p>
          </div>
          <div>
            <span className="text-green-600">有效期</span>
            <p className="text-green-900">7 天内完成付款</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4">{instr.method} 付款信息</h3>

        {instr.qrCodeUrl ? (
          <div className="flex justify-center mb-4">
            <div className="rounded-lg border border-slate-200 p-4 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={instr.qrCodeUrl} alt={`${instr.method}二维码`} className="h-48 w-48" />
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
              <div className="text-center text-slate-400">
                <p className="mt-1 text-xs">二维码待配置</p>
                <p className="mt-1 text-[10px]">请在 .env 设置 ALIPAY_QR_CODE_URL / WECHAT_QR_CODE_URL</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
          {instr.accountName && (
            <div className="flex justify-between">
              <span className="text-slate-500">户名</span>
              <span className="font-medium text-slate-900">{instr.accountName}</span>
            </div>
          )}
          {instr.account && (
            <div className="flex justify-between">
              <span className="text-slate-500">账号</span>
              <span className="font-mono font-medium text-slate-900">{instr.account}</span>
            </div>
          )}
          {instr.merchantId && (
            <div className="flex justify-between">
              <span className="text-slate-500">商户号</span>
              <span className="font-mono font-medium text-slate-900">{instr.merchantId}</span>
            </div>
          )}
          <div className="border-t border-slate-200 pt-3 flex justify-between">
            <span className="text-slate-500">金额</span>
            <span className="font-bold text-blue-600 text-lg">{instr.amount}</span>
          </div>
          {instr.remark && (
            <div className="flex justify-between">
              <span className="text-slate-500">附言/备注</span>
              <span className="font-mono font-medium text-amber-600">{instr.remark}</span>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p>
            📱 <strong>扫码提示：</strong>打开
            {instr.method === "微信支付" ? "微信" : "支付宝"}「扫一扫」扫描上方二维码，
            按金额 {instr.amount} 付款。付款到账后 24 小时内开通。
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-3">下一步操作</h3>
        <ol className="space-y-3">
          {order.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {i + 1}
              </span>
              <span className="text-slate-700">{step}</span>
            </li>
          ))}
        </ol>

        {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={handleActivate}
          disabled={activating}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {activating ? "处理中…" : "我已付款，开通导出权限"}
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">（开发模式模拟到账审核）</p>
      </div>

      <a
        href={`/orders/${order.orderNumber}/status`}
        className="block text-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
      >
        查看订单状态与付款截止时间 →
      </a>
    </div>
  );
}
