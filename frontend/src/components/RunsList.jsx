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
        {runs.slice(0, 5).map((run) => (
          <div className="flex items-start gap-3 rounded-lg border border-line bg-white p-3" key={run.id}>
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Clock4 size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5 text-slate-900">{run.summary}</p>
              <p className="mt-1 text-xs text-slate-500">{formatTime(run.createdAt)}</p>
            </div>
            <StatusBadge status={run.status} />
          </div>
        ))}
      </div>
    </section>
  );
}
