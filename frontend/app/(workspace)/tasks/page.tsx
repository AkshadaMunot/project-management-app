"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

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
  const mode = (Object.keys(ACCENT_THEMES) as AccentMode[]).find(
    (item) => item.toLowerCase() === normalized
  );
  return mode ?? "Blue";
}

function useAccentTheme() {
  const [mode, setMode] = useState<AccentMode>("Blue");

  useEffect(() => {
    const sync = () => setMode(readAccentMode());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode"],
    });

    window.addEventListener("color-mode-change", sync);
    window.addEventListener("accent-color-change", sync);

    return () => {
      observer.disconnect();
      window.removeEventListener("color-mode-change", sync);
      window.removeEventListener("accent-color-change", sync);
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


const defaultTasks: Task[] = [
  {
    id: "write-api-documentation",
    title: "Write API Documentation",
    description:
      "Create clear and detailed API documentation to guide developers.",
    priority: "High",
    member: "Admin",
    status: "To Do",
    labels: ["Research", "Design"],
    subtasks: [
      { id: 1, title: "Prepare API structure", completed: true },
      { id: 2, title: "Write endpoint documentation", completed: true },
      { id: 3, title: "Review documentation", completed: false },
    ],
    comments: [],
  },
  {
    id: "implement-search-function",
    title: "Implement Search Function",
    description: "Implement search functionality for tasks and projects.",
    priority: "Medium",
    member: "Admin",
    status: "To Do",
    labels: ["Development"],
    subtasks: [],
    comments: [],
  },
  {
    id: "deploy-to-production",
    title: "Deploy to Production",
    description: "Deploy the latest application build to production.",
    priority: "High",
    member: "Admin",
    status: "To Do",
    labels: ["Deployment"],
    subtasks: [],
    comments: [],
  },
  {
    id: "code-review-completed",
    title: "Code Review Completed",
    description: "Review and approve the latest code changes.",
    priority: "High",
    member: "Admin",
    status: "Doing",
    labels: ["Development"],
    subtasks: [],
    comments: [],
  },
  {
    id: "design-mockups-finalized",
    title: "Design Mockups Finalized",
    description: "Finalize the UI and UX design mockups.",
    priority: "Medium",
    member: "Admin",
    status: "Doing",
    labels: ["Design"],
    subtasks: [],
    comments: [],
  },
  {
    id: "feature-testing-passed",
    title: "Feature Testing Passed",
    description: "Complete testing for the latest feature.",
    priority: "Medium",
    member: "QA Team",
    status: "Completed",
    labels: ["Testing"],
    subtasks: [],
    comments: [],
  },
  {
    id: "ui-design-updated",
    title: "UI Design Updated",
    description:
      "Update the application interface according to the latest design.",
    priority: "Low",
    member: "Designer",
    status: "Completed",
    labels: ["Design"],
    subtasks: [],
    comments: [],
  },
  {
    id: "security-audit-scheduled",
    title: "Security Audit Scheduled",
    description: "Schedule the security audit for the application.",
    priority: "High",
    member: "Security",
    status: "Completed",
    labels: ["Testing"],
    subtasks: [],
    comments: [],
  },
  {
    id: "ui-review",
    title: "UI Review",
    description: "Review the current user interface.",
    priority: "Medium",
    member: "Design",
    status: "On Hold",
    labels: ["Design"],
    subtasks: [],
    comments: [],
  },
  {
    id: "backend-integration",
    title: "Backend Integration",
    description: "Integrate frontend features with the backend APIs.",
    priority: "High",
    member: "Dev Team",
    status: "On Hold",
    labels: ["Development"],
    subtasks: [],
    comments: [],
  },
  {
    id: "user-feedback",
    title: "User Feedback",
    description: "Collect and review user feedback.",
    priority: "Low",
    member: "Product",
    status: "On Hold",
    labels: ["Research"],
    subtasks: [],
    comments: [],
  },
];

const columns = ["To Do", "Doing", "Completed", "On Hold"];

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-red-50 text-red-700 border-red-200";

    case "High":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "Medium":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";

    case "Low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getPriorityDot(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-red-500";

    case "High":
      return "bg-orange-500";

    case "Medium":
      return "bg-yellow-500";

    case "Low":
      return "bg-emerald-500";

    default:
      return "bg-slate-400";
  }
}

function getColumnStyle(column: string) {
  switch (column) {
    case "To Do":
      return "bg-slate-100 text-slate-700";

    case "Doing":
      return "bg-[var(--accent-soft)] text-[var(--accent)]";

    case "Completed":
      return "bg-emerald-50 text-emerald-700";

    case "On Hold":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function TasksPage() {
  const router = useRouter();
  const accentTheme = useAccentTheme();
  const accentStyle = {
    "--accent": accentTheme.color,
    "--accent-soft": accentTheme.soft,
  } as CSSProperties;

  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [hydrated, setHydrated] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // Dropdown refs: clicking anywhere outside Fields/Filter closes the menu.
  const fieldsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [view, setView] = useState<"board" | "list">("board");

  const [filterPriority, setFilterPriority] = useState("All");
  const [filterMember, setFilterMember] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const [visibleFields, setVisibleFields] = useState({
    priority: true,
    members: true,
    labels: true,
    status: true,
  });

  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newMember, setNewMember] = useState("Admin");

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showFields && fieldsRef.current && !fieldsRef.current.contains(target)) {
        setShowFields(false);
      }

      if (showFilter && filterRef.current && !filterRef.current.contains(target)) {
        setShowFilter(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowFields(false);
        setShowFilter(false);
        setShowAddModal(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showFields, showFilter]);

  useEffect(() => {
    let cancelled = false;

    const loadTasks = async () => {
      try {
        const response = await fetch(`${API_URL}/tasks`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load tasks");
        }

        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.tasks ?? [];
        const normalized = list
          .map((item: ApiTask) => normalizeTask(item))
          .filter((item): item is Task => Boolean(item));

        if (!cancelled) {
          setTasks(normalized);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };

    loadTasks();

    return () => {
      cancelled = true;
    };
  }, []);

  const addTask = async () => {
    const title = newTitle.trim();

    // Never send an empty title to the backend.
    if (!title) {
      window.alert("Please enter a task title.");
      return;
    }

    const payload = {
      title,
      description: "Add task description here.",
      priority: newPriority || "Medium",
      member: newMember || "Admin",
      status: "To Do",
      labels: [] as string[],
      subtasks: [] as Subtask[],
      comments: [] as string[],
    };

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      let responseData: unknown = null;

      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = null;
        }
      }

      if (!response.ok) {
        const backendMessage =
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData
            ? String((responseData as { message?: unknown }).message)
            : `Request failed with status ${response.status}`;

        throw new Error(backendMessage);
      }

      const created = normalizeTask((responseData ?? {}) as ApiTask);

      if (!created) {
        throw new Error("Backend returned an invalid task.");
      }

      setTasks((previous) => {
        const withoutDuplicate = previous.filter(
          (item) => item.id !== created.id
        );
        return [...withoutDuplicate, created];
      });

      setNewTitle("");
      setNewPriority("Medium");
      setNewMember("Admin");
      setShowAddModal(false);
    } catch (error) {
      console.error("Failed to create task:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Unknown error while creating the task.";

      window.alert(`Could not create the task.\n\n${message}`);
    }
  };

  const filteredTasks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.member.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query) ||
        task.labels.some((label) =>
          label.toLowerCase().includes(query)
        );

      const matchesPriority =
        filterPriority === "All" || task.priority === filterPriority;

      const matchesMember =
        filterMember === "All" || task.member === filterMember;

      const matchesStatus =
        filterStatus === "All" || task.status === filterStatus;

      return (
        matchesSearch &&
        matchesPriority &&
        matchesMember &&
        matchesStatus
      );
    });
  }, [tasks, search, filterPriority, filterMember, filterStatus]);

  const members = Array.from(
    new Set(tasks.map((task) => task.member))
  );

  const toggleField = (field: keyof typeof visibleFields) => {
    setVisibleFields((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  return (
    <main style={accentStyle} className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-4 text-slate-800 dark:text-slate-100 md:p-6 lg:p-8">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tasks
          </h1>

          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage your tasks and projects
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          + Add Task
        </button>
      </div>

      {/* TOOLBAR */}
      <div className="relative mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm md:flex-row md:items-center md:justify-between">

        {/* SEARCH */}
        <div className="relative w-full md:max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 dark:text-slate-400">
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-4 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-white focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">

          {/* FIELDS */}
          <div ref={fieldsRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFields((previous) => !previous);
                setShowFilter(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                showFields
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              ▦ Fields
            </button>

            {showFields && (
              <div className="absolute right-0 top-12 z-40 max-h-[70vh] w-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl">

                <p className="mb-3 px-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 dark:text-slate-400">
                  Show fields
                </p>

                {[
                  ["priority", "Priority"],
                  ["members", "Members"],
                  ["labels", "Labels"],
                  ["status", "Status"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      toggleField(
                        key as keyof typeof visibleFields
                      )
                    }
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {label}

                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        visibleFields[
                          key as keyof typeof visibleFields
                        ]
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {visibleFields[
                        key as keyof typeof visibleFields
                      ]
                        ? "✓"
                        : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FILTER */}
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowFilter((previous) => !previous);
                setShowFields(false);
              }}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                showFilter
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              ☷ Filter
            </button>

            {showFilter && (
              <div className="absolute right-0 top-12 z-40 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl">

                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 dark:text-slate-400">
                  Filter tasks
                </p>

                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Priority
                </label>

                <select
                  value={filterPriority}
                  onChange={(e) =>
                    setFilterPriority(e.target.value)
                  }
                  className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-[var(--accent)]"
                >
                  <option>All</option>
                  <option>Urgent</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>

                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Member
                </label>

                <select
                  value={filterMember}
                  onChange={(e) =>
                    setFilterMember(e.target.value)
                  }
                  className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-[var(--accent)]"
                >
                  <option>All</option>

                  {members.map((member) => (
                    <option key={member}>{member}</option>
                  ))}
                </select>

                <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Status
                </label>

                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-[var(--accent)]"
                >
                  <option>All</option>
                  {columns.map((column) => (
                    <option key={column}>{column}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setFilterPriority("All");
                    setFilterMember("All");
                    setFilterStatus("All");
                  }}
                  className="mt-3 w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* VIEW */}
          <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">

            <button
              type="button"
              onClick={() => setView("list")}
              className={`px-3 py-2 text-sm font-semibold ${
                view === "list"
                  ? "bg-[var(--accent)] text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              ☰ List
            </button>

            <button
              type="button"
              onClick={() => setView("board")}
              className={`px-3 py-2 text-sm font-semibold ${
                view === "board"
                  ? "bg-[var(--accent)] text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              ▦ Board
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE SEARCH INFO */}
      {(search || filterPriority !== "All" || filterMember !== "All" || filterStatus !== "All") && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--accent)]">
            {filteredTasks.length} task
            {filteredTasks.length !== 1 ? "s" : ""} found
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterPriority("All");
              setFilterMember("All");
              setFilterStatus("All");
            }}
            className="text-xs font-bold text-[var(--accent)] hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-sm">

          <div className="hidden grid-cols-12 gap-4 border-b border-slate-200 bg-slate-50 dark:bg-slate-800 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <div className="col-span-4">Task</div>

            {visibleFields.priority && (
              <div className="col-span-2">Priority</div>
            )}

            {visibleFields.members && (
              <div className="col-span-2">Member</div>
            )}

            {visibleFields.status && (
              <div className="col-span-2">Status</div>
            )}

            {visibleFields.labels && (
              <div className="col-span-2">Labels</div>
            )}
          </div>

          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/tasks/${encodeURIComponent(task.id)}`)}
              className="grid cursor-pointer grid-cols-1 gap-3 border-b border-slate-100 dark:border-slate-800 px-5 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800 md:grid-cols-12 md:items-center md:gap-4"
            >
              <div className="md:col-span-4">
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {task.title}
                </p>

                <p className="mt-1 line-clamp-1 text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
                  {task.description}
                </p>
              </div>

              {visibleFields.priority && (
                <div className="md:col-span-2">
                  <PriorityBadge priority={task.priority} />
                </div>
              )}

              {visibleFields.members && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <MemberAvatar member={task.member} />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {task.member}
                  </span>
                </div>
              )}

              {visibleFields.status && (
                <div className="md:col-span-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getColumnStyle(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </div>
              )}

              {visibleFields.labels && (
                <div className="flex flex-wrap gap-1 md:col-span-2">
                  {task.labels.length > 0 ? (
                    task.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 dark:text-slate-400">
                      —
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <EmptyState />
          )}
        </div>
      )}

      {/* BOARD VIEW */}
      {view === "board" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

          {columns.map((column) => {
            const columnTasks = filteredTasks.filter(
              (task) => task.status === column
            );

            return (
              <section
                key={column}
                className="min-h-[320px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm"
              >

                {/* COLUMN HEADER */}
                <div className="mb-4 flex items-center justify-between">

                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        column === "To Do"
                          ? "bg-slate-400"
                          : column === "Doing"
                          ? "bg-[var(--accent)]"
                          : column === "Completed"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />

                    <h2 className="font-bold text-slate-800 dark:text-slate-100">
                      {column}
                    </h2>
                  </div>

                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-400 dark:text-slate-300 dark:text-slate-400">
                    {columnTasks.length}
                  </span>
                </div>

                {/* TASKS */}
                <div className="space-y-3">

                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      visibleFields={visibleFields}
                      onClick={() =>
                        router.push(`/tasks/${encodeURIComponent(task.id)}`)
                      }
                    />
                  ))}

                </div>

                {/* ADD TASK */}
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 w-full rounded-lg border border-dashed border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  + Add Task
                </button>
              </section>
            );
          })}
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Add Task
                </h2>

                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400">
                  Create a new task for your workspace
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* TITLE */}
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Task Title
            </label>

            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter task title"
              className="mb-5 w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-[var(--accent)] focus:bg-white focus:ring-2 focus:ring-[var(--accent-soft)]"
            />

            {/* PRIORITY */}
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Priority
            </label>

            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="mb-5 w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none focus:border-[var(--accent)]"
            >
              <option>No Priority</option>
              <option>Urgent</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>

            {/* MEMBER */}
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Member
            </label>

            <select
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              className="mb-6 w-full rounded-lg border border-slate-200 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-100 outline-none focus:border-[var(--accent)]"
            >
              <option>Admin</option>
              <option>Designer</option>
              <option>Developer</option>
              <option>QA Team</option>
              <option>Security</option>
              <option>Product</option>
            </select>

            <div className="flex justify-end gap-3">

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addTask}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                Create Task
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================
   TASK CARD
========================= */

function TaskCard({
  task,
  visibleFields,
  onClick,
}: {
  task: Task;
  visibleFields: {
    priority: boolean;
    members: boolean;
    labels: boolean;
    status: boolean;
  };
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >

      {/* TITLE */}
      <div className="flex items-start justify-between gap-3">

        <h3 className="text-sm font-bold leading-5 text-slate-800 dark:text-slate-100 group-hover:text-[var(--accent)]">
          {task.title}
        </h3>

        <span className="text-slate-300 dark:text-slate-600 transition group-hover:text-slate-500 dark:group-hover:text-slate-300 dark:text-slate-400">
          ⋯
        </span>
      </div>

      {/* MEMBER */}
      {visibleFields.members && (
        <div className="mt-4 flex items-center gap-2">
          <MemberAvatar member={task.member} />

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {task.member}
          </span>
        </div>
      )}

      {/* PRIORITY */}
      {visibleFields.priority && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">

          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 dark:text-slate-400">
            Priority
          </span>

          <PriorityBadge priority={task.priority} />
        </div>
      )}

      {/* STATUS */}
      {visibleFields.status && (
        <div className="mt-3">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${getColumnStyle(
              task.status
            )}`}
          >
            {task.status}
          </span>
        </div>
      )}

      {/* LABELS */}
      {visibleFields.labels && task.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {task.labels.map((label) => (
            <span
              key={label}
              className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-300"
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   PRIORITY BADGE
========================= */

function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getPriorityStyle(
        priority
      )}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${getPriorityDot(
          priority
        )}`}
      />

      {priority}
    </span>
  );
}

/* =========================
   MEMBER AVATAR
========================= */

function MemberAvatar({
  member,
}: {
  member: string;
}) {
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white shadow-sm">
      {member.charAt(0).toUpperCase()}
    </div>
  );
}

/* =========================
   EMPTY STATE
========================= */

function EmptyState() {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">

      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xl">
        🔎
      </div>

      <h3 className="font-bold text-slate-700">
        No tasks found
      </h3>

      <p className="mt-1 text-sm font-medium text-slate-400 dark:text-slate-500 dark:text-slate-400">
        Try changing your search or filters.
      </p>
    </div>
  );
}