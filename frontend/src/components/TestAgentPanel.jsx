import { CheckCircle2, Loader2, TestTube2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

const pendingChecks = [
  { name: "Template seçildi", result: "ready" },
  { name: "Kaynak ve hedef tanımlı", result: "ready" },
  { name: "Onay mekanizması aktif", result: "ready" },
  { name: "Slack hedefi tanımlı", result: "ready" },
  { name: "Test mesajı başarıyla işlendi", result: "ready" },
];

export default function TestAgentPanel({ isTesting, result }) {
  const checks = result?.checks || pendingChecks;
  const status = result?.status || "ready";

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">AI Test Agent</h2>
          <p className="text-sm text-slate-500">Template, izin ve hedef kontrolü</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {isTesting ? <Loader2 className="animate-spin" size={20} /> : <TestTube2 size={20} />}
        </div>
      </div>

      <div className="mb-4">
        <StatusBadge status={status} label={status === "ready" ? "Teste hazır" : undefined} />
      </div>

      <div className="space-y-3">
        {checks.map((check) => (
          <div className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-3" key={check.name}>
            <CheckCircle2
              className={check.result === "passed" ? "text-emerald-600" : "text-slate-300"}
              size={17}
            />
            <span className="text-sm font-semibold text-slate-700">{check.name}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-line bg-panel p-3">
        <p className="text-sm font-semibold leading-6 text-slate-700">
          {result?.aiFeedback || "Test Et butonu ile canlı kontrol sonucu burada görünecek."}
        </p>
      </div>
    </section>
  );
}
