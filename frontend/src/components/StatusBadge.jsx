const statusStyles = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  waiting_approval: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  tested: "border-blue-200 bg-blue-50 text-blue-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  ready: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusLabels = {
  active: "Aktif",
  waiting_approval: "Onay bekliyor",
  success: "Başarılı",
  passed: "Geçti",
  tested: "Test edildi",
  partial: "Kısmi",
  failed: "Hatalı",
  ready: "Hazır",
};

export default function StatusBadge({ status, label }) {
  const style = statusStyles[status] || statusStyles.ready;
  const text = label || statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${style}`}>
      {text}
    </span>
  );
}
