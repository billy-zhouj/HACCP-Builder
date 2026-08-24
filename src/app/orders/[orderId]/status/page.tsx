"use client";

import { useEffect, useState, Suspense } from "react";

interface OrderStatus {
  orderId: string;
  orderNumber: string;
  status: "pending_payment" | "paid" | "activated" | "expired" | "cancelled";
  amountCNY: number;
  companyName: string | null;
  paymentMethod: string;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
  activatedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "等待付款",
  paid: "已付款，待审核",
  activated: "已激活",
  expired: "订单已过期",
  cancelled: "已取消",
};

const STATUS_STYLES: Record<string, string> = {
  pending_payment: "bg-amber-50 text-amber-800 border-amber-200",
  paid: "bg-blue-50 text-blue-800 border-blue-200",
  activated: "bg-green-50 text-green-800 border-green-200",
  expired: "bg-red-50 text-red-800 border-red-200",
  cancelled: "bg-slate-100 text-slate-600 border-slate-200",
};

const PAYMENT_LABELS: Record<string, string> = {
  alipay: "支付宝",
  wechat: "微信支付",
};

function OrderStatusInner({ params }: { params: { orderId: string } }) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchOrderStatus() {
      try {
        setLoading(true);
        const isOrderNumber = params.orderId.startsWith("ORD-");
        const query = isOrderNumber
          ? `orderNumber=${encodeURIComponent(params.orderId)}`
          : `orderId=${encodeURIComponent(params.orderId)}`;
        const res = await fetch(`/api/orders/manual?${query}`);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "无法获取订单信息");
        }

        setOrder(await res.json());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "查询失败");
      } finally {
        setLoading(false);
      }
    }

    fetchOrderStatus();
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-2 text-sm text-slate-500">加载中…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">{error || `未找到订单 ${params.orderId}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">订单详情</h1>

      <div className={`rounded-lg border p-4 ${STATUS_STYLES[order.status]}`}>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-lg">{STATUS_LABELS[order.status]}</p>
          <span className="text-xs opacity-75">{new Date(order.createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
        {order.status === "pending_payment" && (
          <p className="mt-1 text-sm">请在 {new Date(order.expiresAt).toLocaleDateString("zh-CN")} 前完成付款</p>
        )}
        {order.status === "paid" && <p className="mt-1 text-sm">我们已收到您的付款，将在 24 小时内审核开通</p>}
        {order.status === "activated" && order.activatedAt && (
          <p className="mt-1 text-sm">于 {new Date(order.activatedAt).toLocaleDateString("zh-CN")} 激活</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">订单信息</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-slate-500">订单编号</dt>
            <dd className="font-mono font-medium text-slate-900">{order.orderNumber}</dd>
          </div>
          <div>
            <dt className="text-slate-500">支付金额</dt>
            <dd className="font-bold text-blue-600 text-lg">¥{order.amountCNY}</dd>
          </div>
          <div>
            <dt className="text-slate-500">支付方式</dt>
            <dd className="text-slate-900">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</dd>
          </div>
          <div>
            <dt className="text-slate-500">企业名称</dt>
            <dd className="text-slate-900">{order.companyName || "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">下单时间</dt>
            <dd className="text-slate-900">{new Date(order.createdAt).toLocaleString("zh-CN")}</dd>
          </div>
          <div>
            <dt className="text-slate-500">付款截止</dt>
            <dd className="text-slate-900">{new Date(order.expiresAt).toLocaleDateString("zh-CN")}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">下一步操作</h3>

        {order.status === "pending_payment" && (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>返回「审核与导出」页查看付款二维码</li>
            <li>通过 {PAYMENT_LABELS[order.paymentMethod] || "所选方式"} 完成扫码付款</li>
            <li>付款到账后等待人工审核开通</li>
          </ol>
        )}

        {order.status === "paid" && (
          <p className="text-sm text-slate-700">我们已收到您的付款，工作人员将在 24 小时内完成审核并开通权限。</p>
        )}

        {order.status === "activated" && (
          <a
            href="/dashboard"
            className="inline-block rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            前往控制台
          </a>
        )}

        {order.status === "expired" && (
          <p className="text-sm text-slate-700">订单已过期，请重新提交订单。</p>
        )}
      </div>
    </div>
  );
}

export default function OrderStatusPage({ params }: { params: { orderId: string } }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">加载中…</p>}>
      <OrderStatusInner params={params} />
    </Suspense>
  );
}
