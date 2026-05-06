import { Workflow } from "lucide-react";
import StatusBadge from "./StatusBadge";

const triggerLabels = {
  instant: "Anlik",
  scheduled: "Planli",
  triggered: "Tetiklenmeli",
};

export default function ActiveTasks({ tasks }) {
  const activeTasks = tasks.filter((task) => task.status === "active");

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950">Aktif gorevler</h2>
          <p className="text-sm text-slate-500">Telegram, Discord ve Mail akislar</p>
        </div>
        <Workflow className="text-blue-600" size={21} />
      </div>

      <div className="space-y-3">
        {activeTasks.map((task) => (
          <div className="rounded-lg border border-line bg-white p-3" key={task.id}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold leading-5 text-slate-900">{task.title}</p>
                <p className="mt-1 break-words text-xs text-slate-500">{task.condition}</p>
              </div>
              <StatusBadge status={task.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {task.sourcePlatform} to {task.action?.platform}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {triggerLabels[task.triggerType] || task.triggerType}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                {task.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
