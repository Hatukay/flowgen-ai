import { Activity, CalendarCheck2, ClipboardCheck, Clock3 } from "lucide-react";

const cardStyles = {
  active: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  runs: "bg-emerald-50 text-emerald-700",
  tests: "bg-slate-100 text-slate-700",
};

export default function DashboardCards({ metrics }) {
  const cards = [
    {
      label: "Aktif Görevler",
      value: metrics.activeTasks,
      icon: Activity,
      tone: "active",
    },
    {
      label: "Onay Bekleyen",
      value: metrics.pendingTasks,
      icon: Clock3,
      tone: "pending",
    },
    {
      label: "Bugünkü Çalışmalar",
      value: metrics.todayRuns,
      icon: CalendarCheck2,
      tone: "runs",
    },
    {
      label: "Başarılı Testler",
      value: metrics.successfulTests,
      icon: ClipboardCheck,
      tone: "tests",
    },
  ];

  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-950">Dashboard</h2>
        <p className="text-sm text-slate-500">Görev, run ve test görünümü</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="rounded-lg border border-line bg-white p-4" key={card.label}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">{card.value}</p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cardStyles[card.tone]}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
