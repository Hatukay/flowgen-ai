import { ShieldCheck, X } from "lucide-react";

const triggerLabels = {
  instant: "Anlik",
  scheduled: "Planli",
  triggered: "Tetiklenmeli",
};

export default function ApprovalModal({ isApproving, onClose, onConfirm, open, task }) {
  if (!open || !task) return null;

  const fields = [
    ["Kaynak", task.sourcePlatform],
    ["Hedef", task.action?.platform],
    ["Hedef detay", task.action?.target],
    ["Kategori", task.category],
    ["Tetikleme", triggerLabels[task.triggerType] || task.triggerType],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-white shadow-soft">
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-950">Gorevi aktif et</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Bu gorev {task.sourcePlatform} eventlerini AI ile degerlendirip {task.action?.platform} aksiyonu uretecek.
              </p>
            </div>
          </div>
          <button
            className="focus-ring rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
            title="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {fields.map(([label, value]) => (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-line bg-panel px-4 py-3" key={label}>
              <span className="text-sm font-semibold text-slate-500">{label}</span>
              <span className="max-w-[60%] break-words text-right text-sm font-bold text-slate-900">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line bg-panel px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="focus-ring min-h-11 rounded-lg border border-line bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Vazgec
          </button>
          <button
            className="focus-ring min-h-11 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            disabled={isApproving}
            onClick={onConfirm}
            type="button"
          >
            {isApproving ? "Onaylaniyor" : "Onayla"}
          </button>
        </div>
      </div>
    </div>
  );
}
