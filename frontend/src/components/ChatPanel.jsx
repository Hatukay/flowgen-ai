import { Loader2, Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { demoPrompts } from "../data/mockData";

export default function ChatPanel({ currentPlan, isLoading, lastUserMessage, onSubmit }) {
  const [message, setMessage] = useState("Telegramdan gelen sikayet mesajlarini Discord destek birimine gonder.");

  function submitMessage(nextMessage = message) {
    const trimmed = nextMessage.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setMessage("");
  }

  return (
    <section className="card overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-950">Yeni gorev olustur</h1>
            <p className="text-sm text-slate-500">Dogal dilde yaz, AI planlasin, sen onayla.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
            <Sparkles size={14} />
            Gemini Planner
          </span>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap gap-2">
          {demoPrompts.map((prompt) => (
            <button
              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              key={prompt}
              onClick={() => submitMessage(prompt)}
              type="button"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-panel p-4">
          <div className="ml-auto max-w-[88%] rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium leading-6 text-white">
            {lastUserMessage || "Telegramdan gelen sikayet mesajlarini Discord destek birimine gonder."}
          </div>

          <div className="max-w-[92%] rounded-lg border border-line bg-white px-4 py-3 text-sm leading-6 text-slate-600">
            {isLoading ? (
              <span className="inline-flex items-center gap-2 font-semibold text-blue-700">
                <Loader2 className="animate-spin" size={16} />
                Gemini gorevi analiz ediyor
              </span>
            ) : (
              <>
                <span className="font-semibold text-slate-900">Plan hazir:</span>{" "}
                {currentPlan?.task?.title || "Yeni otomasyon gorevi"}.
              </>
            )}
          </div>
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            submitMessage();
          }}
        >
          <input
            className="focus-ring min-h-11 flex-1 rounded-lg border border-line bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400"
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Orn: Son 10 mailimi ozetle"
            value={message}
          />
          <button
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
            Gonder
          </button>
        </form>
      </div>
    </section>
  );
}
