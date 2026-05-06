import { Bot, CheckCircle2, CircleDot, Server, Wifi } from "lucide-react";

function HealthBadge({ icon: Icon, label, tone = "blue" }) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-white text-slate-600",
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold ${styles[tone]}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}

export default function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Bot size={19} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-950">AI FlowOps</p>
            <p className="text-xs text-slate-500">Demo Workspace</p>
          </div>
        </div>

        <div className="hidden md:block">
          <p className="text-sm font-bold text-slate-950">AI FlowOps Demo Console</p>
          <p className="text-xs text-slate-500">Chat ile görev planla, onayla, n8n akış sonucunu izle.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <HealthBadge icon={CircleDot} label="Demo Mode" tone="blue" />
          <HealthBadge icon={Wifi} label="n8n Local: 5678" tone="green" />
          <HealthBadge icon={Server} label="Backend API / Mock hazır" tone="slate" />
          <HealthBadge icon={CheckCircle2} label="Demo Workspace" tone="slate" />
        </div>
      </div>
    </header>
  );
}
