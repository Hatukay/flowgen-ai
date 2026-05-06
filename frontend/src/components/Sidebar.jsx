import {
  Activity,
  Bot,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Plus,
  Workflow,
} from "lucide-react";

const navItems = [
  { label: "Yeni Görev", icon: Plus, active: true },
  { label: "Eski Görevler", icon: History },
  { label: "Aktif Görevler", icon: Activity },
  { label: "Template’ler", icon: Workflow },
  { label: "Test Raporları", icon: ClipboardCheck },
];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-20 shrink-0 border-r border-line bg-white md:flex lg:w-72">
      <div className="flex w-full flex-col gap-6 px-3 py-5 lg:px-5">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Bot size={21} />
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-bold text-slate-950">AI FlowOps</p>
            <p className="truncate text-xs text-slate-500">n8n Agent Console</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`focus-ring flex h-11 w-full items-center justify-center gap-3 rounded-lg px-3 text-sm font-semibold transition lg:justify-start ${
                  item.active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
                type="button"
                title={item.label}
              >
                <Icon size={19} />
                <span className="hidden truncate lg:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden rounded-lg border border-line bg-panel p-4 lg:block">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm">
            <LayoutDashboard size={18} />
          </div>
          <p className="text-sm font-bold text-slate-900">Demo odaklı MVP</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Chat, onay, test ve dashboard akışı tek ekranda hazır.
          </p>
        </div>
      </div>
    </aside>
  );
}
