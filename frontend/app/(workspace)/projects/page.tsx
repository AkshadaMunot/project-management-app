"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

type Priority = "Urgent" | "High" | "Medium" | "Low";
type Status = "Planning" | "In Progress" | "Completed" | "On Hold";

type ApiProject = {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  progress?: number;
  lead?: string;
  dueDate?: string;
  labels?: string[];
};

type Project = {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  status: Status;
  progress: number;
  lead: string;
  dueDate: string;
  labels: string[];
};

const normalizeProject = (item: ApiProject): Project | null => {
  const id = String(item.id ?? item._id ?? "").trim();
  if (!id) return null;

  return {
    id,
    name: item.name ?? "Untitled Project",
    description: item.description ?? "No description added",
    priority: item.priority ?? "Medium",
    status: item.status ?? "Planning",
    progress: Math.max(0, Math.min(100, Number(item.progress ?? 0))),
    lead: item.lead?.trim() || "Unassigned",
    dueDate: item.dueDate ?? "",
    labels: Array.isArray(item.labels) ? item.labels : [],
  };
};

const uniqueProjects = (items: ApiProject[]): Project[] => {
  const map = new Map<string, Project>();

  for (const item of items) {
    const project = normalizeProject(item);
    if (project) map.set(project.id, project);
  }

  return Array.from(map.values());
};

const API_URL = "https://project-management-app-ctvj.onrender.com";

type AccentMode = "Amber" | "Blue" | "Pink" | "Rose" | "Emerald" | "Black";

const ACCENT_THEMES: Record<AccentMode, { color: string; soft: string }> = {
  Amber: { color: "#f59e0b", soft: "color-mix(in srgb, #f59e0b 16%, transparent)" },
  Blue: { color: "#3b82f6", soft: "color-mix(in srgb, #3b82f6 16%, transparent)" },
  Pink: { color: "#ec4899", soft: "color-mix(in srgb, #ec4899 16%, transparent)" },
  Rose: { color: "#f43f5e", soft: "color-mix(in srgb, #f43f5e 16%, transparent)" },
  Emerald: { color: "#10b981", soft: "color-mix(in srgb, #10b981 16%, transparent)" },
  Black: { color: "#111827", soft: "color-mix(in srgb, #111827 18%, transparent)" },
};

function getUserKey(): string {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) return "guest";

  try {
    const user = JSON.parse(storedUser);
    return user?.email || user?.name || "guest";
  } catch {
    return "guest";
  }
}

function readAccentMode(): AccentMode {
  const modes: AccentMode[] = [
    "Amber",
    "Blue",
    "Pink",
    "Rose",
    "Emerald",
    "Black",
  ];

  // ThemeToggle applies the selected color directly to <html>.
  // Always trust this value first.
  const htmlMode = document.documentElement.getAttribute("data-color-mode");

  if (htmlMode) {
    const normalized = htmlMode.trim().toLowerCase();
    const matched = modes.find(
      (mode) => mode.toLowerCase() === normalized
    );
    if (matched) return matched;
  }

  // ThemeToggle stores color per logged-in user.
  const userKey = getUserKey();
  const savedUserColor = localStorage.getItem(`colorMode_${userKey}`);

  if (savedUserColor) {
    const normalized = savedUserColor.trim().toLowerCase();
    const matched = modes.find(
      (mode) => mode.toLowerCase() === normalized
    );
    if (matched) return matched;
  }

  // Backward-compatible fallbacks.
  const fallbackValues = [
    localStorage.getItem("colorMode"),
    localStorage.getItem("color-mode"),
    localStorage.getItem("accentColor"),
    localStorage.getItem("accent-color"),
    document.documentElement.getAttribute("data-color"),
  ];

  for (const value of fallbackValues) {
    if (!value) continue;
    const normalized = value.trim().toLowerCase();
    const matched = modes.find(
      (mode) => mode.toLowerCase() === normalized
    );
    if (matched) return matched;
  }

  return "Blue";
}

function useAccentTheme() {
  const [mode, setMode] = useState<AccentMode>("Blue");

  useEffect(() => {
    const sync = () => {
      setMode(readAccentMode());
    };

    sync();

    const observer = new MutationObserver(sync);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "class",
        "data-color-mode",
        "data-color",
        "style",
      ],
    });

    const storage = (event: StorageEvent) => {
      if (
        [
          "colorMode",
          "color-mode",
          "accentColor",
          "accent-color",
        ].includes(event.key ?? "")
      ) {
        sync();
      }
    };

    window.addEventListener("storage", storage);
    window.addEventListener("color-mode-change", sync);
    window.addEventListener("accent-color-change", sync);

    return () => {
      observer.disconnect();

      window.removeEventListener("storage", storage);
      window.removeEventListener("color-mode-change", sync);
      window.removeEventListener("accent-color-change", sync);
    };
  }, []);

  return ACCENT_THEMES[mode];
}

const priorityStyles: Record<Priority, string> = {
  Urgent: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/40 dark:border-red-800",
  High: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/40 dark:border-orange-800",
  Medium: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-300 dark:bg-yellow-950/40 dark:border-yellow-800",
  Low: "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/40 dark:border-green-800",
};

const statusStyles: Record<Status, string> = {
  Planning: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800",
  "In Progress": "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/40 dark:border-purple-800",
  Completed: "text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/40 dark:border-green-800",
  "On Hold": "text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700",
};

const statusDotStyles: Record<Status, string> = {
  Planning: "bg-blue-500",
  "In Progress": "bg-purple-500",
  Completed: "bg-green-500",
  "On Hold": "bg-gray-400",
};

export default function ProjectsPage() {
  const router = useRouter();
  const accentTheme = useAccentTheme();
  const accentStyle = {
    "--accent": accentTheme.color,
    "--accent-soft": accentTheme.soft,
  } as CSSProperties;

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showFields, setShowFields] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const [openActionId, setOpenActionId] =
    useState<string | null>(null);

  const [view, setView] =
    useState<"list" | "board">("list");

  const [visibleFields, setVisibleFields] = useState({
    priority: true,
    lead: true,
    dueDate: true,
    status: true,
    progress: true,
  });

  const [filters, setFilters] = useState({
    priority: "All",
    status: "All",
  });

  const fieldsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    priority: "Medium" as Priority,
    status: "Planning" as Status,
    progress: 0,
    lead: "Dexter",
    dueDate: "",
  });

  // --------------------------------------------------
  // GET ALL PROJECTS
  // --------------------------------------------------

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/projects`);

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      const list = Array.isArray(data) ? data : data?.projects ?? [];

      setProjects(uniqueProjects(list));
    } catch (error) {
      console.error(error);
      setError(
        "Unable to load projects. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --------------------------------------------------
  // CLOSE DROPDOWNS / ACTIONS WHEN CLICKING OUTSIDE
  // --------------------------------------------------

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        fieldsRef.current &&
        !fieldsRef.current.contains(target)
      ) {
        setShowFields(false);
      }

      if (
        filtersRef.current &&
        !filtersRef.current.contains(target)
      ) {
        setShowFilters(false);
      }

      const actionMenu = (target as HTMLElement)?.closest(
        "[data-action-menu]"
      );

      if (!actionMenu) {
        setOpenActionId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // --------------------------------------------------
  // SEARCH + FILTER
  // --------------------------------------------------

  const filteredProjects = projects.filter((project) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      project.name
        .toLowerCase()
        .includes(searchText) ||
      project.description
        .toLowerCase()
        .includes(searchText) ||
      project.lead
        .toLowerCase()
        .includes(searchText);

    const matchesPriority =
      filters.priority === "All" ||
      project.priority === filters.priority;

    const matchesStatus =
      filters.status === "All" ||
      project.status === filters.status;

    return (
      matchesSearch &&
      matchesPriority &&
      matchesStatus
    );
  });

  // --------------------------------------------------
  // FIELD TOGGLE
  // --------------------------------------------------

  const toggleField = (
    field: keyof typeof visibleFields
  ) => {
    setVisibleFields((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  // --------------------------------------------------
  // ADD PROJECT
  // --------------------------------------------------

  const addProject = async () => {
    if (!newProject.name.trim()) {
      alert("Please enter project name.");
      return;
    }

    try {
      setError("");

      const projectData = {
        name: newProject.name.trim(),
        description:
          newProject.description.trim() ||
          "No description added",
        priority: newProject.priority,
        status: newProject.status,
        progress: Number(newProject.progress),
        lead:
          newProject.lead.trim() ||
          "Unassigned",
        dueDate: newProject.dueDate || "",
        labels: [],
      };

      const response = await fetch(
        `${API_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(
          () => null
        );

        throw new Error(
          errorData?.message ||
            "Failed to create project"
        );
      }

      const createdData = await response.json();
      const createdProject = normalizeProject(createdData);

      if (!createdProject) {
        throw new Error("Backend did not return a valid project id.");
      }

      setProjects((previous) => {
        const withoutSameId = previous.filter(
          (item) => item.id !== createdProject.id
        );
        return [...withoutSameId, createdProject];
      });

      setNewProject({
        name: "",
        description: "",
        priority: "Medium",
        status: "Planning",
        progress: 0,
        lead: "Dexter",
        dueDate: "",
      });

      setShowAddProject(false);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to create project."
      );
    }
  };

  // --------------------------------------------------
  // CLEAR FILTERS
  // --------------------------------------------------

  const clearFilters = () => {
    setFilters({
      priority: "All",
      status: "All",
    });
  };

  // --------------------------------------------------
  // VIEW PROJECT
  // --------------------------------------------------

  const handleViewProject = (id: string) => {
    setOpenActionId(null);
    router.push(`/projects/${id}`);
  };

  // --------------------------------------------------
  // EDIT PROJECT
  // --------------------------------------------------

  const handleEditProject = (id: string) => {
    setOpenActionId(null);
    router.push(`/projects/${id}`);
  };

  // --------------------------------------------------
  // DELETE PROJECT
  // --------------------------------------------------

  const handleDeleteProject = async (
    id: string
  ) => {
    const project = projects.find(
      (item) => item.id === id
    );

    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/projects/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete project"
        );
      }

      setProjects((previous) =>
        previous.filter(
          (item) => item.id !== id
        )
      );

      setOpenActionId(null);
    } catch (error) {
      console.error(error);

      alert(
        "Failed to delete project. Please try again."
      );
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main style={accentStyle} className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      {/* HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your projects, progress and team members
          </p>
        </div>

        <button
          onClick={() =>
            setShowAddProject(true)
          }
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
        >
          + Add Project
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {/* TOOLBAR */}

      <div className="relative mb-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

          {/* SEARCH */}

          <div className="relative w-full xl:max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search projects..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:text-slate-500 focus:border-[var(--accent)] focus:bg-white dark:bg-slate-900 focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
          </div>

          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap items-center gap-2">

            {/* FIELDS */}

            <div
              ref={fieldsRef}
              className="relative"
            >
              <button
                onClick={() => {
                  setShowFields(
                    (value) => !value
                  );
                  setShowFilters(false);
                  setOpenActionId(null);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  showFields
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                ▣ Fields
              </button>

              {showFields && (
                <div className="absolute right-0 z-40 mt-2 w-60 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Show Fields
                  </p>

                  {[
                    ["priority", "Priority"],
                    ["lead", "Lead"],
                    ["dueDate", "Due Date"],
                    ["status", "Status"],
                    ["progress", "Progress"],
                  ].map(([key, label]) => {
                    const field =
                      key as keyof typeof visibleFields;

                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span>{label}</span>

                        <input
                          type="checkbox"
                          checked={
                            visibleFields[field]
                          }
                          onChange={() =>
                            toggleField(field)
                          }
                          className="h-4 w-4 accent-[var(--accent)]"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FILTER */}

            <div
              ref={filtersRef}
              className="relative"
            >
              <button
                onClick={() => {
                  setShowFilters(
                    (value) => !value
                  );
                  setShowFields(false);
                  setOpenActionId(null);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  showFilters
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                ⚱ Filter
              </button>

              {showFilters && (
                <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-xl">

                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Filter Projects
                    </p>

                    <button
                      onClick={clearFilters}
                      className="text-xs font-semibold text-[var(--accent)] hover:opacity-80"
                    >
                      Clear
                    </button>
                  </div>

                  {/* PRIORITY */}

                  <div className="mb-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Priority
                    </label>

                    <select
                      value={filters.priority}
                      onChange={(e) =>
                        setFilters(
                          (previous) => ({
                            ...previous,
                            priority:
                              e.target.value,
                          })
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-[var(--accent)]"
                    >
                      <option>All</option>
                      <option>Urgent</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>

                  {/* STATUS */}

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Status
                    </label>

                    <select
                      value={filters.status}
                      onChange={(e) =>
                        setFilters(
                          (previous) => ({
                            ...previous,
                            status:
                              e.target.value,
                          })
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-[var(--accent)]"
                    >
                      <option>All</option>
                      <option>Planning</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                      <option>On Hold</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* LIST / BOARD */}

            <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <button
                onClick={() => {
                  setView("list");
                  setOpenActionId(null);
                }}
                className={`px-3 py-2 text-sm font-medium ${
                  view === "list"
                    ? "bg-[var(--accent)] text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                ☰ List
              </button>

              <button
                onClick={() => {
                  setView("board");
                  setOpenActionId(null);
                }}
                className={`px-3 py-2 text-sm font-medium ${
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
      </div>

      {/* LOADING */}

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center shadow-sm">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Loading projects...
          </p>
        </div>
      ) : (
        <>
          {/* LIST VIEW */}

          {view === "list" && (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[950px] w-full border-collapse">

                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-left">

                      <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Projects
                      </th>

                      {visibleFields.priority && (
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Priority
                        </th>
                      )}

                      {visibleFields.lead && (
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Lead
                        </th>
                      )}

                      {visibleFields.status && (
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Status
                        </th>
                      )}

                      {visibleFields.progress && (
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Progress
                        </th>
                      )}

                      {visibleFields.dueDate && (
                        <th className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Due Date
                        </th>
                      )}

                      <th className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProjects.map(
                      (project) => (
                        <tr
                          key={project.id}
                          onClick={() =>
                            router.push(`/projects/${project.id}`)
                          }
                          className="cursor-pointer border-b border-slate-100 dark:border-slate-800 transition hover:bg-[var(--accent-soft)]"
                        >

                          {/* PROJECT */}

                          <td className="px-5 py-4">
                            <div className="max-w-[350px]">

                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {project.name}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                                {project.description}
                              </p>

                              {project.labels?.length >
                                0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {project.labels.map(
                                    (label, index) => (
                                      <span
                                        key={`${project.id}-label-${index}-${label}`}
                                        className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                                      >
                                        {label}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* PRIORITY */}

                          {visibleFields.priority && (
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  priorityStyles[
                                    project.priority
                                  ]
                                }`}
                              >
                                <span>▰</span>
                                {project.priority}
                              </span>
                            </td>
                          )}

                          {/* LEAD */}

                          {visibleFields.lead && (
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                                  {project.lead ===
                                  "Unassigned"
                                    ? "+"
                                    : project.lead
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {project.lead}
                                </span>
                              </div>
                            </td>
                          )}

                          {/* STATUS */}

                          {visibleFields.status && (
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  statusStyles[
                                    project.status
                                  ]
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    statusDotStyles[
                                      project.status
                                    ]
                                  }`}
                                />

                                {project.status}
                              </span>
                            </td>
                          )}

                          {/* PROGRESS */}

                          {visibleFields.progress && (
                            <td className="px-4 py-4">
                              <div className="w-32">

                                <div className="mb-1 flex justify-between text-xs">
                                  <span className="font-medium text-slate-500 dark:text-slate-400">
                                    Progress
                                  </span>

                                  <span className="font-bold text-slate-700 dark:text-slate-200">
                                    {project.progress}%
                                  </span>
                                </div>

                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                  <div
                                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                                    style={{
                                      width: `${project.progress}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                          )}

                          {/* DUE DATE */}

                          {visibleFields.dueDate && (
                            <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                              📅{" "}
                              {project.dueDate
                                ? project.dueDate
                                : "Not set"}
                            </td>
                          )}

                          {/* ACTIONS */}

                          <td className="relative px-4 py-4 text-right">
                            <div
                              data-action-menu
                              className="relative inline-block"
                            >
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();

                                  setOpenActionId(
                                    (current) =>
                                      current ===
                                      project.id
                                        ? null
                                        : project.id
                                  );
                                }}
                                className={`rounded-lg px-3 py-1.5 text-lg font-bold transition ${
                                  openActionId ===
                                  project.id
                                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    : "text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:text-slate-100"
                                }`}
                                aria-label="Project actions"
                              >
                                ⋯
                              </button>

                              {openActionId ===
                                project.id && (
                                <div
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                  className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-left shadow-xl"
                                >

                                  <button
                                    onClick={() =>
                                      handleViewProject(
                                        project.id
                                      )
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <span>👁</span>
                                    <span>
                                      View Project
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleEditProject(
                                        project.id
                                      )
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  >
                                    <span>✏️</span>
                                    <span>
                                      Edit Project
                                    </span>
                                  </button>

                                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                                  <button
                                    onClick={() =>
                                      handleDeleteProject(
                                        project.id
                                      )
                                    }
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                  >
                                    <span>🗑</span>
                                    <span>
                                      Delete
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {/* EMPTY STATE */}

                {filteredProjects.length ===
                  0 && (
                  <div className="px-6 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xl">
                      🔍
                    </div>

                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                      No projects found
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Try changing your search or
                      filters.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() =>
                  setShowAddProject(true)
                }
                className="m-4 text-sm font-semibold text-[var(--accent)] hover:opacity-80"
              >
                + Add Project
              </button>
            </div>
          )}

          {/* BOARD VIEW */}

          {view === "board" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

              {(
                [
                  "Planning",
                  "In Progress",
                  "Completed",
                  "On Hold",
                ] as Status[]
              ).map((status) => {

                const statusProjects =
                  filteredProjects.filter(
                    (project) =>
                      project.status === status
                  );

                return (
                  <div
                    key={status}
                    className="min-h-[300px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm"
                  >

                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">

                        <span
                          className={`h-2 w-2 rounded-full ${
                            statusDotStyles[status]
                          }`}
                        />

                        <h2 className="font-bold text-slate-800 dark:text-slate-100">
                          {status}
                        </h2>
                      </div>

                      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {statusProjects.length}
                      </span>
                    </div>

                    <div className="space-y-3">

                      {statusProjects.map(
                        (project) => (
                          <div
                            key={project.id}
                            onClick={() =>
                              router.push(
                                `/projects/${encodeURIComponent(project.id)}`
                              )
                            }
                            className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                          >

                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                              {project.name}
                            </h3>

                            <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                              {project.description}
                            </p>

                            <div className="mt-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${
                                  priorityStyles[
                                    project.priority
                                  ]
                                }`}
                              >
                                {project.priority}
                              </span>
                            </div>

                            <div className="mt-4">

                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">
                                  Progress
                                </span>

                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                  {project.progress}%
                                </span>
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-[var(--accent)]"
                                  style={{
                                    width: `${project.progress}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>
                                👤 {project.lead}
                              </span>

                              <span>
                                📅{" "}
                                {project.dueDate ||
                                  "Not set"}
                              </span>
                            </div>
                          </div>
                        )
                      )}

                      {statusProjects.length ===
                        0 && (
                        <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                          No projects
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ADD PROJECT MODAL */}

      {showAddProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAddProject(false);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-2xl sm:p-6">

            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Add Project
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Create a new project for your
                  workspace.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddProject(false)
                }
                className="rounded-lg px-2 py-1 text-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-200 dark:text-slate-200"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">

              {/* NAME */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Project Name
                </label>

                <input
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject(
                      (previous) => ({
                        ...previous,
                        name: e.target.value,
                      })
                    )
                  }
                  placeholder="Enter project name"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:text-slate-500 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Description
                </label>

                <textarea
                  value={
                    newProject.description
                  }
                  onChange={(e) =>
                    setNewProject(
                      (previous) => ({
                        ...previous,
                        description:
                          e.target.value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Describe your project"
                  className="w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none transition placeholder:text-slate-400 dark:text-slate-500 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {/* PRIORITY + STATUS */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Priority
                  </label>

                  <select
                    value={
                      newProject.priority
                    }
                    onChange={(e) =>
                      setNewProject(
                        (previous) => ({
                          ...previous,
                          priority:
                            e.target
                              .value as Priority,
                        })
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  >
                    <option>Urgent</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Status
                  </label>

                  <select
                    value={
                      newProject.status
                    }
                    onChange={(e) =>
                      setNewProject(
                        (previous) => ({
                          ...previous,
                          status:
                            e.target
                              .value as Status,
                        })
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  >
                    <option>Planning</option>
                    <option>
                      In Progress
                    </option>
                    <option>Completed</option>
                    <option>On Hold</option>
                  </select>
                </div>
              </div>

              {/* LEAD + DATE */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Lead
                  </label>

                  <input
                    value={newProject.lead}
                    onChange={(e) =>
                      setNewProject(
                        (previous) => ({
                          ...previous,
                          lead: e.target.value,
                        })
                      )
                    }
                    placeholder="Lead name"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Due Date
                  </label>

                  <input
                    type="date"
                    min={
                      new Date()
                        .toISOString()
                        .split("T")[0]
                    }
                    value={newProject.dueDate}
                    onChange={(e) =>
                      setNewProject(
                        (previous) => ({
                          ...previous,
                          dueDate:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  />
                </div>
              </div>

              {/* PROGRESS */}

              <div>
                <div className="mb-1.5 flex justify-between">

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Progress
                  </label>

                  <span className="text-sm font-bold text-[var(--accent)]">
                    {newProject.progress}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={
                    newProject.progress
                  }
                  onChange={(e) =>
                    setNewProject(
                      (previous) => ({
                        ...previous,
                        progress:
                          Number(
                            e.target.value
                          ),
                      })
                    )
                  }
                  className="w-full accent-[var(--accent)]"
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                onClick={() =>
                  setShowAddProject(false)
                }
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                onClick={addProject}
                className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create Project
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}