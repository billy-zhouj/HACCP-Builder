"use client";

import { useEffect, useState } from "react";
import TemplateDocsEditor, { type GeneratedSop } from "@/components/TemplateDocsEditor";
import { SOP_TEMPLATES } from "@/lib/sopTemplates";
import RegulatoryNote from "@/components/RegulatoryNote";

const AVAILABLE = SOP_TEMPLATES.filter((t) => t.category === "food_safety").map((t) => ({ key: t.key, title: t.title }));

export default function SopsPage({ params }: { params: { id: string } }) {
  const [generated, setGenerated] = useState<GeneratedSop[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}?include=sops`).then((r) => r.json());
    setGenerated((plan.sops ?? []).filter((s: GeneratedSop) => AVAILABLE.some((a) => a.key === s.templateKey)));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function generate(key: string) {
    await fetch(`/api/plans/${params.id}/sops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateKey: key }),
    });
    load();
  }

  async function save(sopId: string, content: string) {
    await fetch(`/api/plans/${params.id}/sops/${sopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    load();
  }

  async function remove(sopId: string) {
    await fetch(`/api/plans/${params.id}/sops/${sopId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">SOP（标准操作规程）</h1>
      <p className="mt-1 text-sm text-slate-600">
        其余与危害相关的文档，包括基于配方数据构建的按产品过敏原声明，以及 HACCP
        专属的验证/再评估和纠正措施/验证记录。
      </p>
      <RegulatoryNote>
        下方的过敏原控制计划会根据每个产品的原料清单（配方步骤）自动生成按产品的过敏原声明——这比单一的企业级清单是真正的改进，因为配方变化时声明仍能保持准确。
      </RegulatoryNote>
      <TemplateDocsEditor available={AVAILABLE} generated={generated} onGenerate={generate} onSave={save} onDelete={remove} />
    </div>
  );
}
