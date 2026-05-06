import { CheckCircle2, Loader2, TestTube2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

const pendingChecks = [
  { name: "Task schema dogru", result: "ready" },
  { name: "Action var", result: "ready" },
  { name: "Source platform var", result: "ready" },
  { name: "Onay mekanizmasi aktif", result: "ready" },
  { name: "LLM decision test edilebilir", result: "ready" },
];

export default function TestAgentPanel({ isTesting, result }) {
  const checks = result?.checks || pendingChecks;
  const status = result?.status || "ready";

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">AI Test Agent</h2>
          <p className="text-sm text-slate-500">Schema, platform ve LLM kontrolu</p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {isTesting ? <Loader2 className="animate-spin" size={20} /> : <TestTube2 size={20} />}
        </div>
      </div>

      <div className="mb-4">
        <StatusBadge status={status} label={status === "ready" ? "Teste hazir" : undefined} />
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
          {result?.aiFeedback || "Test Et butonu ile canli kontrol sonucu burada gorunecek."}
        </p>
      </div>
    </section>
  );
}
