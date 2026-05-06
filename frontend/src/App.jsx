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
  if (task.workflowTemplate === "mail_summary") {
    return "Son 10 mail özetlendi.";
  }

  if (task.workflowTemplate === "payment_reminder") {
    return "Ödeme hatırlatıcısı planlandı.";
  }

  return "Telegram mesajı Slack destek kanalına gönderildi.";
}

function upsertTask(tasks, nextTask) {
  const exists = tasks.some((task) => task.id === nextTask.id);
  if (exists) {
    return tasks.map((task) => (task.id === nextTask.id ? nextTask : task));
  }
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
    const activeTasks = tasks.filter((task) => task.status === "active").length;

    return {
      activeTasks,
      pendingTasks: pendingFromPlan,
      todayRuns: runs.length,
      successfulTests: testResult?.status === "passed" ? "3/3" : "2/3",
    };
  }, [currentPlan, runs.length, tasks, testResult]);

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
      ...approved,
      status: "active",
    };

    const nextPlan = {
      ...currentPlan,
      task: activeTask,
    };

    const newRun = {
      id: `run_${Date.now()}`,
      taskId: activeTask.id,
      status: "success",
      summary: successSummaryFor(activeTask),
      createdAt: new Date().toISOString(),
    };

    setCurrentPlan(nextPlan);
    setTasks((previous) => upsertTask(previous, activeTask));
    setRuns((previous) => [newRun, ...previous]);
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
                onEdit={() => setLastUserMessage("Plan düzenleme demo kapsamında mock olarak tutuluyor.")}
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
