"use client";

import { useEffect, useState } from "react";
import { EMPTY_FACILITY_PROFILE, type FacilityProfile } from "@/types";
import GuidancePanel from "@/components/GuidancePanel";

export default function FacilityProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<FacilityProfile>(EMPTY_FACILITY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/plans/${params.id}`)
      .then((r) => r.json())
      .then((plan) => {
        if (plan.facilityProfile) setProfile({ ...EMPTY_FACILITY_PROFILE, ...plan.facilityProfile });
        setLoading(false);
      });
  }, [params.id]);

  function set<K extends keyof FacilityProfile>(key: K, value: FacilityProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/plans/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ facilityProfile: profile }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">企业概况</h1>

      <GuidancePanel title="为何重要">
        本计划下所有产品共用此信息。
      </GuidancePanel>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">企业名称</label>
          <input
            value={profile.facilityName}
            onChange={(e) => set("facilityName", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">地址</label>
          <input
            value={profile.address}
            onChange={(e) => set("address", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">生产的食品类别</label>
          <input
            value={profile.foodCategories}
            onChange={(e) => set("foodCategories", e.target.value)}
            placeholder="例如：即食烘焙食品、常温货架期酱料"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">负责人 / HACCP 团队组长</label>
            <input
              value={profile.responsibleIndividual}
              onChange={(e) => set("responsibleIndividual", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">联系方式</label>
            <input
              value={profile.responsibleIndividualContact}
              onChange={(e) => set("responsibleIndividualContact", e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存"}
        </button>
        {savedAt && <span className="ml-3 text-xs text-slate-500">已保存。</span>}
      </div>
    </div>
  );
}
