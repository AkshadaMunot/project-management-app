"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type Subtask = {
  id: number;
  title: string;
  completed: boolean;
};

type Task = {
  id: string;
  title: string;
  description: string;
  priority: string;
  member: string;
  status: string;
  labels: string[];
  subtasks: Subtask[];
  comments: string[];
};
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/$/, "");
type AccentMode = "Amber" | "Blue" | "Pink" | "Rose" | "Emerald" | "Black";

const ACCENT_THEMES: Record<AccentMode, { color: string; soft: string }> = {
  Amber: { color: "#f59e0b", soft: "color-mix(in srgb, #f59e0b 16%, transparent)" },
  Blue: { color: "#3b82f6", soft: "color-mix(in srgb, #3b82f6 16%, transparent)" },
  Pink: { color: "#ec4899", soft: "color-mix(in srgb, #ec4899 16%, transparent)" },
  Rose: { color: "#f43f5e", soft: "color-mix(in srgb, #f43f5e 16%, transparent)" },
  Emerald: { color: "#10b981", soft: "color-mix(in srgb, #10b981 16%, transparent)" },
  Black: { color: "#111827", soft: "color-mix(in srgb, #111827 18%, transparent)" },
};

function readAccentMode(): AccentMode {
  const value = document.documentElement.getAttribute("data-color-mode");
  const normalized = String(value ?? "").trim().toLowerCase();
  const mode = ["Amber", "Blue", "Pink", "Rose", "Emerald", "Black"].find(
    (item) => item.toLowerCase() === normalized
  );
  return (mode as AccentMode | undefined) ?? "Blue";
}

function useAccentTheme() {
  const [mode, setMode] = useState<AccentMode>("Blue");
  useEffect(() => {
    const sync = () => setMode(readAccentMode());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-color-mode", "data-color"] });
    const storage = (event: StorageEvent) => {
      if (["colorMode", "color-mode", "accentColor", "accent-color"].includes(event.key ?? "")) sync();
    };
    window.addEventListener("storage", storage);
    window.addEventListener("color-mode-change", sync);
    window.addEventListener("accent-color-change", sync);
    return () => {
      observer.disconnect(); window.removeEventListener("storage", storage);
      window.removeEventListener("color-mode-change", sync); window.removeEventListener("accent-color-change", sync);
    };
  }, []);
  return ACCENT_THEMES[mode];
}


type ApiTask = Partial<Task> & {
  _id?: string;
  id?: string;
};

function normalizeTask(item: ApiTask): Task | null {
  const id = String(item.id ?? item._id ?? "").trim();
  if (!id) return null;

  return {
    id,
    title: item.title ?? "Untitled Task",
    description: item.description ?? "",
    priority: item.priority ?? "Medium",
    member: item.member ?? "Admin",
    status: item.status ?? "To Do",
    labels: Array.isArray(item.labels) ? item.labels : [],
    subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
    comments: Array.isArray(item.comments) ? item.comments : [],
  };
}


const defaultTask: Task = {
  id: "write-api-documentation",
  title: "Write API Documentation",
  description:
    "Create clear and detailed API documentation to guide developers.",
  priority: "High",
  member: "Admin",
  status: "To Do",
  labels: ["Research", "Design"],
  subtasks: [
    {
      id: 1,
      title: "Prepare API structure",
      completed: true,
    },
    {
      id: 2,
      title: "Write endpoint documentation",
      completed: true,
    },
    {
      id: 3,
      title: "Review documentation",
      completed: false,
    },
  ],
  comments: [],
};

const availableLabels = [
  "Research",
  "Design",
  "Development",
  "Testing",
  "Deployment",
];

export default function TaskDetailsPage() {
  const router = useRouter();
  const accentTheme = useAccentTheme();
  const accentStyle = { "--accent": accentTheme.color, "--accent-soft": accentTheme.soft } as CSSProperties;
  const params = useParams();

  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [newSubtask, setNewSubtask] = useState("");
  const [comment, setComment] = useState("");

  /* =========================
     LOAD TASK
  ========================= */

  useEffect(() => {
    let cancelled = false;

    const loadTask = async () => {
      try {
        const response = await fetch(
          `${API_URL}/tasks/${encodeURIComponent(taskId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("NOT_FOUND");
          }
          throw new Error("Failed to load task");
        }

        const normalized = normalizeTask(await response.json());

        if (!normalized) {
          throw new Error("INVALID_TASK");
        }

        if (!cancelled) {
          setTask(normalized);
          setOriginalTask(JSON.parse(JSON.stringify(normalized)));
        }
      } catch (error) {
        console.error("Failed to load task:", error);
        if (!cancelled) {
          setTask(null);
          setOriginalTask(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (taskId) loadTask();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  /* =========================
     CHECK UNSAVED CHANGES
  ========================= */

  const hasChanges =
    task && originalTask
      ? JSON.stringify(task) !== JSON.stringify(originalTask)
      : false;

  /* =========================
     SAVE ALL CHANGES
  ========================= */

  const saveChanges = async () => {
    if (!task) return;

    try {
      const response = await fetch(
        `${API_URL}/tasks/${encodeURIComponent(task.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            member: task.member,
            status: task.status,
            labels: task.labels,
            subtasks: task.subtasks,
            comments: task.comments,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save task");
      }

      const saved = normalizeTask(await response.json());

      if (!saved) {
        throw new Error("Backend returned an invalid task");
      }

      setTask(saved);
      setOriginalTask(JSON.parse(JSON.stringify(saved)));
      setEditing(false);
      router.push("/tasks");
    } catch (error) {
      console.error("Failed to save task:", error);
      window.alert("Could not save changes. Please check that the backend is running.");
    }
  };

  /* =========================
     CANCEL / BACK
  ========================= */

  const goBack = () => {
    router.push("/tasks");
  };

  const cancelChanges = () => {
    if (!originalTask) return;

    setTask(JSON.parse(JSON.stringify(originalTask)));
    setEditing(false);
    setNewSubtask("");
    setComment("");
  };

  /* =========================
     STATUS
  ========================= */

  const changeStatus = (status: string) => {
    if (!task) return;

    setTask({
      ...task,
      status,
    });
  };

  /* =========================
     PRIORITY
  ========================= */

  const changePriority = (priority: string) => {
    if (!task) return;

    setTask({
      ...task,
      priority,
    });
  };

  /* =========================
     MEMBER
  ========================= */

  const changeMember = (member: string) => {
    if (!task) return;

    setTask({
      ...task,
      member,
    });
  };

  /* =========================
     LABEL
  ========================= */

  const toggleLabel = (label: string) => {
    if (!task) return;

    const updatedLabels = task.labels.includes(label)
      ? task.labels.filter((item) => item !== label)
      : [...task.labels, label];

    setTask({
      ...task,
      labels: updatedLabels,
    });
  };

  /* =========================
     SUBTASK
  ========================= */

  const toggleSubtask = (id: number) => {
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((subtask) =>
      subtask.id === id
        ? {
            ...subtask,
            completed: !subtask.completed,
          }
        : subtask
    );

    setTask({
      ...task,
      subtasks: updatedSubtasks,
    });
  };

  /* =========================
     ADD SUBTASK
  ========================= */

  const addSubtask = () => {
    if (!task || !newSubtask.trim()) return;

    const updatedSubtasks = [
      ...task.subtasks,
      {
        id: Date.now(),
        title: newSubtask.trim(),
        completed: false,
      },
    ];

    setTask({
      ...task,
      subtasks: updatedSubtasks,
    });

    setNewSubtask("");
  };

  /* =========================
     ADD COMMENT
  ========================= */

  const addComment = () => {
    if (!task || !comment.trim()) return;

    setTask({
      ...task,
      comments: [...task.comments, comment.trim()],
    });

    setComment("");
  };

  /* =========================
     DELETE
  ========================= */

  const deleteTask = async () => {
    if (!task) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/tasks/${encodeURIComponent(task.id)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      router.push("/tasks");
    } catch (error) {
      console.error("Failed to delete task:", error);
      window.alert("Could not delete the task. Please check that the backend is running.");
    }
  };

  /* =========================
     STATUS COLORS
  ========================= */

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";

      case "Doing":
        return "bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent-soft)]";

      case "On Hold":
        return "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";

      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700";
    }
  };

  /* =========================
     PRIORITY COLORS
  ========================= */

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";

      case "High":
        return "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800";

      case "Medium":
        return "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";

      case "Low":
        return "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";

      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main style={accentStyle} className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-800">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-5 shadow-sm">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading task...
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     NOT FOUND
  ========================= */

  if (!task) {
    return (
      <main style={accentStyle} className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-800">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Task not found
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The task you are looking for does not exist.
          </p>

          <button
            onClick={() => router.push("/tasks")}
            className="mt-5 rounded-lg bg-slate-800 dark:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Back to Tasks
          </button>
        </div>
      </main>
    );
  }

  const completedSubtasks = task.subtasks.filter(
    (subtask) => subtask.completed
  ).length;

  return (
    <main style={accentStyle} className="min-h-screen bg-slate-50 dark:bg-slate-800 p-4 md:p-6 lg:p-8">

      {/* =========================
          TOP BAR
      ========================= */}

      <div className="mx-auto mb-6 flex max-w-7xl flex-wrap items-center justify-between gap-4">

        <button
          onClick={goBack}
          className="group flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 transition hover:text-slate-900 dark:hover:text-white"
        >
          <span className="text-lg transition group-hover:-translate-x-1">
            ←
          </span>

          Back to Tasks
        </button>

        <div className="flex flex-wrap items-center gap-2">

          {hasChanges && (
            <span className="mr-2 rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
              Unsaved changes
            </span>
          )}

          <button
            onClick={() => setEditing(!editing)}
            className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {editing ? "Finish Editing" : "Edit Task"}
          </button>

          {hasChanges && (
            <button
              onClick={cancelChanges}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          )}

          <button
            onClick={deleteTask}
            className="rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-300 shadow-sm transition hover:bg-red-50 dark:hover:bg-red-950/60"
          >
            Delete
          </button>

          <button
            onClick={saveChanges}
            disabled={!hasChanges}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
              hasChanges
                ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]"
                : "cursor-not-allowed bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
            }`}
          >
            Save Changes
          </button>

        </div>
      </div>

      {/* =========================
          MAIN CARD
      ========================= */}

      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">

        {/* =========================
            HEADER
        ========================= */}

        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-7 md:px-8">

          {editing ? (
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Task Title
              </label>

              <input
                value={task.title}
                onChange={(e) =>
                  setTask({
                    ...task,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-2xl font-bold text-slate-900 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                  {task.title}
                </h1>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>

              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                {task.description}
              </p>
            </>
          )}
        </div>

        {/* =========================
            CONTENT
        ========================= */}

        <div className="grid grid-cols-1 gap-8 p-6 md:p-8 lg:grid-cols-3">

          {/* =========================
              LEFT
          ========================= */}

          <div className="lg:col-span-2">

            {/* PROPERTIES */}

            <section className="mb-8">

              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Properties
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage the basic details of this task.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* PRIORITY */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Priority
                  </label>

                  <select
                    value={task.priority}
                    onChange={(e) =>
                      changePriority(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                  >
                    <option>No Priority</option>
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                {/* MEMBER */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Member
                  </label>

                  <select
                    value={task.member}
                    onChange={(e) =>
                      changeMember(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                  >
                    <option>Admin</option>
                    <option>Designer</option>
                    <option>Developer</option>
                    <option>Dev Team</option>
                    <option>QA Team</option>
                    <option>Security</option>
                    <option>Product</option>
                  </select>
                </div>

              </div>
            </section>

            {/* STATUS */}

            <section className="mb-8">

              <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
                Change Status
              </h2>

              <select
                value={task.status}
                onChange={(e) =>
                  changeStatus(e.target.value)
                }
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              >
                <option>To Do</option>
                <option>Doing</option>
                <option>Completed</option>
                <option>On Hold</option>
              </select>

            </section>

            {/* LABELS */}

            <section className="mb-8">

              <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">
                Labels
              </h2>

              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Select one or more labels for this task.
              </p>

              <div className="flex flex-wrap gap-2">

                {availableLabels.map((label) => {
                  const selected = task.labels.includes(label);

                  return (
                    <button
                      key={label}
                      onClick={() => toggleLabel(label)}
                      className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

              </div>
            </section>

            {/* SUBTASKS */}

            <section className="mb-8">

              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Subtasks
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {completedSubtasks} of {task.subtasks.length} completed
                </p>
              </div>

              <div className="space-y-3">

                {task.subtasks.map((subtask) => (
                  <label
                    key={subtask.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 transition hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() =>
                        toggleSubtask(subtask.id)
                      }
                      className="h-4 w-4 accent-[var(--accent)]"
                    />

                    <span
                      className={`text-sm font-medium ${
                        subtask.completed
                          ? "text-slate-400 dark:text-slate-500 line-through"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </label>
                ))}

              </div>

              {/* ADD SUBTASK */}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                <input
                  value={newSubtask}
                  onChange={(e) =>
                    setNewSubtask(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

                <button
                  onClick={addSubtask}
                  className="rounded-xl bg-slate-800 dark:bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  + Add
                </button>

              </div>
            </section>

            {/* COMMENTS */}

            <section>

              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Comments & Updates
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Add notes or updates related to this task.
                </p>
              </div>

              <div className="space-y-3">

                {task.comments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No comments yet.
                    </p>
                  </div>
                ) : (
                  task.comments.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      {item}
                    </div>
                  ))
                )}

              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                <input
                  value={comment}
                  onChange={(e) =>
                    setComment(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addComment();
                    }
                  }}
                  placeholder="Write a comment..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

                <button
                  onClick={addComment}
                  className="rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)]"
                >
                  Add Comment
                </button>

              </div>

            </section>

          </div>

          {/* =========================
              RIGHT DETAILS
          ========================= */}

          <aside className="h-fit rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-6">

            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Details
              </h2>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Current task information
              </p>
            </div>

            <div className="space-y-6">

              {/* STATUS */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </p>

                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
              </div>

              {/* PRIORITY */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Priority
                </p>

                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${getPriorityStyle(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>

              {/* MEMBER */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Member
                </p>

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                    {task.member.charAt(0).toUpperCase()}
                  </div>

                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {task.member}
                  </span>

                </div>
              </div>

              {/* LABELS */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Labels
                </p>

                <div className="flex flex-wrap gap-2">

                  {task.labels.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      No labels
                    </span>
                  ) : (
                    task.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {label}
                      </span>
                    ))
                  )}

                </div>
              </div>

              {/* SUBTASK PROGRESS */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Subtasks
                </p>

                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {completedSubtasks} / {task.subtasks.length} completed
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{
                      width:
                        task.subtasks.length === 0
                          ? "0%"
                          : `${
                              (completedSubtasks /
                                task.subtasks.length) *
                              100
                            }%`,
                    }}
                  />
                </div>
              </div>

              {/* COMMENTS */}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Comments
                </p>

                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {task.comments.length}
                </p>
              </div>

            </div>

          </aside>

        </div>

        {/* =========================
            BOTTOM SAVE BAR
        ========================= */}

        {hasChanges && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-6 py-4 sm:flex-row md:px-8">

            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                You have unsaved changes
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save your changes before leaving this task.
              </p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={cancelChanges}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Discard
              </button>

              <button
                onClick={saveChanges}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent)]"
              >
                Save Changes
              </button>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}