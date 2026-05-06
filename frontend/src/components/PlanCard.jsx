import { CheckCircle2, Clock3, Play, ShieldCheck, TestTube2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

const triggerLabels = {
  instant: "Anlık",
  scheduled: "Planlı",
  triggered: "Tetiklenmeli",
};

export default function PlanCard({ plan, isApproving, onApprove, onEdit, onTest }) {
  const task = plan?.task;
  if (!task) return null;

  const isActive = task.status === "active";
  const meta = [
    ["Kategori", task.category],
    ["Tip", triggerLabels[task.triggerType] || task.triggerType],
    ["Kaynak", task.source],
    ["Hedef", task.target],
    ["Template", task.workflowTemplate],
  ];

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              <ShieldCheck size={14} />
              Approval Layer
            </span>
            <StatusBadge status={task.status} />
          </div>
          <h2 className="text-xl font-bold text-slate-950">{task.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{task.description}</p>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {meta.map(([label, value]) => (
            <div className="rounded-lg border border-line bg-panel px-3 py-3" key={label}>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Clock3 size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-950">Görev Planı</h3>
          </div>
          <ol className="space-y-2">
            {plan.plan.map((step, index) => (
              <li className="flex gap-3 text-sm leading-6 text-slate-600" key={step}>
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-xs font-bold text-blue-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:flex-wrap">
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            disabled={isActive || isApproving}
            onClick={onApprove}
            type="button"
          >
            {isActive ? <CheckCircle2 size={17} /> : <Play size={17} />}
            {isActive ? "Aktifleştirildi" : isApproving ? "Aktifleştiriliyor" : "Onayla ve Aktifleştir"}
          </button>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            onClick={onTest}
            type="button"
          >
            <TestTube2 size={17} />
            Test Et
          </button>
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            onClick={onEdit}
            type="button"
          >
            Düzenle
          </button>
        </div>
      </div>
    </section>
  );
}
