"use client";

import { useEffect, useState } from "react";
import type { HaccpTeamMemberData } from "@/types";
import { SUGGESTED_HACCP_TEAM_ROLES } from "@/types";
import GuidancePanel from "@/components/GuidancePanel";

export default function HaccpTeamPage({ params }: { params: { id: string } }) {
  const [members, setMembers] = useState<HaccpTeamMemberData[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setMembers(plan.haccpTeamMembers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function addMember() {
    await fetch(`/api/plans/${params.id}/haccp-team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新团队成员" }),
    });
    load();
  }

  async function updateMember(memberId: string, patch: Partial<HaccpTeamMemberData>) {
    setMembers((ms) => ms.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
    await fetch(`/api/plans/${params.id}/haccp-team/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removeMember(memberId: string) {
    await fetch(`/api/plans/${params.id}/haccp-team/${memberId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">HACCP 团队（预备步骤 1）</h1>
      <p className="mt-1 text-sm text-slate-600">
        组建负责制定和维护本计划的多学科团队。这与召回计划步骤中的召回团队不同，但同一人可以同时参与两个团队。
      </p>

      <GuidancePanel title="建议覆盖的角色">{SUGGESTED_HACCP_TEAM_ROLES.join(" · ")}</GuidancePanel>

      <div className="space-y-4">
        {members.map((m) => (
          <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={m.name}
                onChange={(e) => updateMember(m.id, { name: e.target.value })}
                placeholder="姓名"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={m.role ?? ""}
                onChange={(e) => updateMember(m.id, { role: e.target.value })}
                placeholder="角色 / 职位"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={m.expertise ?? ""}
                onChange={(e) => updateMember(m.id, { expertise: e.target.value })}
                placeholder="专业领域（如：微生物学、工程）"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                value={m.responsibilities ?? ""}
                onChange={(e) => updateMember(m.id, { responsibilities: e.target.value })}
                placeholder="在团队中的职责"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button onClick={() => removeMember(m.id)} className="mt-3 text-xs font-medium text-red-600 hover:underline">
              删除
            </button>
          </div>
        ))}
        <button
          onClick={addMember}
          className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          + 添加团队成员
        </button>
      </div>
    </div>
  );
}
