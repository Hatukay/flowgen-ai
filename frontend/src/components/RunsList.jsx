import { CheckCircle2, Clock4 } from "lucide-react";
import StatusBadge from "./StatusBadge";

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "--:--";
  }
}

function ConfidenceBar({ value }) {
  if (value === undefined || value === null) return null;
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-slate-500">{pct}%</span>
    </div>
  );
}

function MetaTag({ label, value, color = "bg-slate-100 text-slate-600" }) {
  if (!value) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}
    >
      {label && <span className="text-slate-400">{label}</span>}
      {value}
    </span>
  );
}

export default function RunsList({ runs }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">Son gerçekleşen görevler</h2>
          <p className="text-sm text-slate-500">Run kayıtları ve demo çıktıları</p>
        </div>
        <CheckCircle2 className="text-emerald-600" size={21} />
      </div>

      <div className="space-y-3">
        {runs.slice(0, 8).map((run) => (
          <div className="flex items-start gap-3 rounded-lg border border-line bg-white p-3" key={run.id}>
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Clock4 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5 text-slate-900">
                {run.summary || run.outputSummary || "—"}
              </p>

              {/* ─── Meta tags: platform, taskId, confidence, action platform ─── */}
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <MetaTag
                  value={run.platform}
                  color="bg-blue-50 text-blue-700"
                />
                <MetaTag
                  label="task:"
                  value={run.taskId}
                  color="bg-slate-100 text-slate-600"
                />
                <MetaTag
                  value={run.actionPlatform}
                  label="→"
                  color="bg-violet-50 text-violet-700"
                />
                <MetaTag
                  value={run.source || run.triggeredBy}
                  label="kaynak:"
                  color="bg-amber-50 text-amber-700"
                />
              </div>

              <ConfidenceBar value={run.confidence} />

              <p className="mt-1 text-xs text-slate-500">{formatTime(run.createdAt)}</p>
            </div>
            <StatusBadge status={run.status} />
          </div>
        ))}
      </div>
    </section>
  );
}
