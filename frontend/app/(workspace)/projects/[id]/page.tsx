"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";

type Priority = "Urgent" | "High" | "Medium" | "Low";
type Status = "Planning" | "In Progress" | "Completed" | "On Hold";

type ApiProject = {
  id?: string;
  _id?: string;
  name?: string;
  description?: string;
  priority?: Priority;
  lead?: string;
  status?: Status;
  progress?: number;
  dueDate?: string;
  labels?: string[];
};

type Project = {
  id: string;
  name: string;
  description: string;
  priority: Priority;
  lead: string;
  status: Status;
  progress: number;
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
    lead: item.lead?.trim() || "Unassigned",
    status: item.status ?? "Planning",
    progress: Math.max(0, Math.min(100, Number(item.progress ?? 0))),
    dueDate: item.dueDate ?? "",
    labels: Array.isArray(item.labels) ? item.labels : [],
  };
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

export default function ProjectDetailsPage() {
  const router = useRouter();
  const accentTheme = useAccentTheme();
  const accentStyle = {
    "--accent": accentTheme.color,
    "--accent-soft": accentTheme.soft,
  } as CSSProperties;
  const params = useParams();

  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);

  // Original saved project
  const [originalProject, setOriginalProject] =
    useState<Project | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------
  // GET SINGLE PROJECT
  // --------------------------------------------------

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/projects/${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Project not found.");
          }

          throw new Error("Failed to fetch project.");
        }

        const data = await response.json();
        const normalized = normalizeProject(data);

        if (!normalized) {
          throw new Error("Backend returned an invalid project.");
        }

        // Current editable data
        setProject(normalized);

        // Keep a separate copy for Cancel
        setOriginalProject(normalized);
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load project."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id]);

  // --------------------------------------------------
  // HANDLE CHANGE
  // --------------------------------------------------

  const handleChange = (
    field: keyof Project,
    value: string | number
  ) => {
    setProject((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        [field]: value,
      };
    });

    setSaved(false);
    setError("");
  };

  // --------------------------------------------------
  // CANCEL CHANGES
  // --------------------------------------------------

  const handleCancel = () => {
    if (!originalProject) return;

    // Restore last saved data
    setProject({ ...originalProject });

    setSaved(false);
    setError("");
  };

  // --------------------------------------------------
  // SAVE PROJECT
  // --------------------------------------------------

  const handleSave = async () => {
    if (!project) return;

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const response = await fetch(
        `${API_URL}/projects/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: project.name,
            description: project.description,
            priority: project.priority,
            lead: project.lead,
            status: project.status,
            progress: Number(project.progress),
            dueDate: project.dueDate,
            labels: project.labels || [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            "Failed to save project."
        );
      }

      const updatedProject: Project =
        await response.json();

      // Update both editable and original saved data
      setProject(updatedProject);
      setOriginalProject(updatedProject);

      setSaved(true);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // DELETE PROJECT
  // --------------------------------------------------

  const handleDelete = async () => {
    if (!project) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete project."
        );
      }

      router.push("/projects");
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete project."
      );

      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <main style={accentStyle} className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => router.push("/projects")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-[var(--accent)]"
          >
            ← Back to Projects
          </button>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center shadow-sm">
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Loading project...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // PROJECT NOT FOUND
  // --------------------------------------------------

  if (!project) {
    return (
      <main style={accentStyle} className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => router.push("/projects")}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-[var(--accent)]"
          >
            ← Back to Projects
          </button>

          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center">
            <p className="font-semibold text-red-700">
              {error || "Project not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main style={accentStyle} className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* BACK */}

        <button
          onClick={() => router.push("/projects")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-[var(--accent)]"
        >
          ← Back to Projects
        </button>

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              {project.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {project.description}
            </p>
          </div>

          {/* ACTION BUTTONS */}

          <div className="flex flex-wrap gap-3">

            {/* CANCEL */}

            <button
              onClick={handleCancel}
              disabled={saving || deleting}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            {/* SAVE */}

            <button
              onClick={handleSave}
              disabled={saving || deleting}
              className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {/* DELETE */}

            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="rounded-lg border border-red-200 bg-white dark:bg-slate-900 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* SAVED */}

        {saved && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            ✓ Project changes saved successfully.
          </div>
        )}

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* MAIN */}

          <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6 lg:col-span-2">

            <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-slate-100">
              Project Details
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* PROJECT NAME */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Project Name
                </label>

                <input
                  value={project.name}
                  onChange={(e) =>
                    handleChange(
                      "name",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {/* DESCRIPTION */}

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Description
                </label>

                <textarea
                  value={project.description}
                  onChange={(e) =>
                    handleChange(
                      "description",
                      e.target.value
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {/* PRIORITY */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Priority
                </label>

                <select
                  value={project.priority}
                  onChange={(e) =>
                    handleChange(
                      "priority",
                      e.target.value as Priority
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--accent)]"
                >
                  <option>Urgent</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Status
                </label>

                <select
                  value={project.status}
                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value as Status
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--accent)]"
                >
                  <option>Planning</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>On Hold</option>
                </select>
              </div>

              {/* LEAD */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Lead
                </label>

                <input
                  value={project.lead}
                  onChange={(e) =>
                    handleChange(
                      "lead",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[var(--accent)]"
                />
              </div>

              {/* DUE DATE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Due Date
                </label>

                <input
                  type="date"
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  value={project.dueDate || ""}
                  onChange={(e) =>
                    handleChange(
                      "dueDate",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                />
              </div>

              {/* PROGRESS */}

              <div className="sm:col-span-2">

                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Progress
                  </label>

                  <span className="text-sm font-bold text-[var(--accent)]">
                    {project.progress}%
                  </span>

                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  value={project.progress}
                  onChange={(e) =>
                    handleChange(
                      "progress",
                      Number(e.target.value)
                    )
                  }
                  className="w-full accent-[var(--accent)]"
                />

                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all"
                    style={{
                      width: `${project.progress}%`,
                    }}
                  />
                </div>

              </div>

              {/* LABELS */}

              <div className="sm:col-span-2">

                <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Labels
                </label>

                <div className="flex flex-wrap gap-2">

                  {project.labels?.length > 0 ? (
                    project.labels.map((label, index) => (
                      <span
                        key={`${project.id}-label-${index}-${label}`}
                        className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]"
                      >
                        {label}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-slate-500">
                      No labels
                    </span>
                  )}

                </div>

              </div>

            </div>
          </section>

          {/* SUMMARY */}

          <aside className="h-fit rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">

            <h2 className="mb-6 text-lg font-bold text-slate-900 dark:text-slate-100">
              Project Summary
            </h2>

            {/* STATUS */}

            <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-5">

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Status
              </p>

              <span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                project.status === "Planning"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : project.status === "In Progress"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  : project.status === "Completed"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
              }`}>
                {project.status}
              </span>

            </div>

            {/* PRIORITY */}

            <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-5">

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Priority
              </p>

              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
                  project.priority === "Urgent"
                    ? "bg-red-50 text-red-700"
                    : project.priority === "High"
                    ? "bg-orange-50 text-orange-700"
                    : project.priority === "Medium"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {project.priority}
              </span>

            </div>

            {/* LEAD */}

            <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-5">

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Lead
              </p>

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                  {project.lead
                    ? project.lead
                        .charAt(0)
                        .toUpperCase()
                    : "+"}
                </div>

                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {project.lead || "Unassigned"}
                </span>

              </div>

            </div>

            {/* DUE DATE */}

            <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-5">

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Due Date
              </p>

              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                📅 {project.dueDate || "Not set"}
              </p>

            </div>

            {/* PROGRESS */}

            <div>

              <div className="mb-2 flex items-center justify-between">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Progress
                </p>

                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {project.progress}%
                </span>

              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">

                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{
                    width: `${project.progress}%`,
                  }}
                />

              </div>

            </div>

          </aside>

        </div>
      </div>
    </main>
  );
}
