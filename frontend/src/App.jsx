import { useEffect, useMemo, useState } from "react";
import ActiveTasks from "./components/ActiveTasks";
import ApprovalModal from "./components/ApprovalModal";
import ChatPanel from "./components/ChatPanel";
import DashboardCards from "./components/DashboardCards";
import PlanCard from "./components/PlanCard";
import RunsList from "./components/RunsList";
import Sidebar from "./components/Sidebar";
import TestAgentPanel from "./components/TestAgentPanel";
import TopBar from "./components/TopBar";
import { defaultPlan, mockRuns, mockTasks, mockTestResult } from "./data/mockData";
import { approveTask, createChatPlan, getRuns, getTasks, testTask } from "./lib/api";

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function successSummaryFor(task) {
  if (task.action?.type === "summarize") return "Son 10 mail ozetlendi.";
  if (task.action?.type === "create_reminder") return "Odeme hatirlaticisi planlandi.";
  return `${task.sourcePlatform || "system"} eventi ${task.action?.platform || "dashboard"} aksiyonuna donustu.`;
}

function upsertTask(tasks, nextTask) {
  const exists = tasks.some((task) => task.id === nextTask.id);
  if (exists) return tasks.map((task) => (task.id === nextTask.id ? nextTask : task));
  return [nextTask, ...tasks];
}

export default function App() {
  const [tasks, setTasks] = useState(mockTasks);
  const [runs, setRuns] = useState(mockRuns);
  const [currentPlan, setCurrentPlan] = useState(defaultPlan);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDemoData() {
      const [nextTasks, nextRuns] = await Promise.all([getTasks(), getRuns()]);
      if (!mounted) return;
      setTasks(nextTasks);
      setRuns(nextRuns);
    }

    loadDemoData();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const pendingFromPlan = currentPlan?.task?.status === "waiting_approval" ? 1 : 0;
    return {
      activeTasks: tasks.filter((task) => task.status === "active").length,
      pendingTasks: tasks.filter((task) => task.status === "waiting_approval").length + pendingFromPlan,
      todayRuns: runs.length,
      successfulRuns: runs.filter((run) => run.status === "success").length,
    };
  }, [currentPlan, runs, tasks]);

  async function handleChatSubmit(message) {
    setLastUserMessage(message);
    setIsChatLoading(true);
    setTestResult(null);

    const [nextPlan] = await Promise.all([createChatPlan(message), wait(600)]);
    setCurrentPlan(nextPlan);
    setIsChatLoading(false);
  }

  async function handleConfirmApproval() {
    const task = currentPlan?.task;
    if (!task) return;

    setIsApproving(true);
    const approved = await approveTask(task.id);
    const activeTask = {
      ...task,
      ...approved.task,
      status: "active",
    };
    const backendRun = approved.run;

    setCurrentPlan((previous) => ({ ...previous, task: activeTask }));
    setTasks((previous) => upsertTask(previous, activeTask));
    setRuns((previous) => [
      backendRun || {
        id: `run_${Date.now()}`,
        taskId: activeTask.id,
        matchedTaskId: activeTask.id,
        eventId: null,
        status: "success",
        platform: "system",
        actionPlatform: activeTask.action?.platform,
        confidence: null,
        summary: successSummaryFor(activeTask),
        reason: "Kullanici onayi ile gorev active durumuna alindi.",
        createdAt: new Date().toISOString(),
      },
      ...previous,
    ]);
    setTestResult(mockTestResult);
    setIsApprovalOpen(false);
    setIsApproving(false);
  }

  async function handleTestTask() {
    const taskId = currentPlan?.task?.id;
    if (!taskId) return;

    setIsTesting(true);
    const result = await testTask(taskId);
    setTestResult(result);
    setIsTesting(false);
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <TopBar />
          <div className="grid gap-5 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 space-y-5">
              <ChatPanel
                currentPlan={currentPlan}
                isLoading={isChatLoading}
                lastUserMessage={lastUserMessage}
                onSubmit={handleChatSubmit}
              />
              <PlanCard
                isApproving={isApproving}
                onApprove={() => setIsApprovalOpen(true)}
                onEdit={() => setLastUserMessage("Plan duzenleme demo kapsaminda mock olarak tutuluyor.")}
                onTest={handleTestTask}
                plan={currentPlan}
              />
              <div className="grid gap-5 lg:grid-cols-2">
                <RunsList runs={runs} />
                <ActiveTasks tasks={tasks} />
              </div>
            </section>

            <aside className="space-y-5">
              <DashboardCards metrics={metrics} />
              <TestAgentPanel isTesting={isTesting} result={testResult} />
            </aside>
          </div>
        </main>
      </div>

      <ApprovalModal
        isApproving={isApproving}
        onClose={() => setIsApprovalOpen(false)}
        onConfirm={handleConfirmApproval}
        open={isApprovalOpen}
        task={currentPlan?.task}
      />
    </div>
  );
}
