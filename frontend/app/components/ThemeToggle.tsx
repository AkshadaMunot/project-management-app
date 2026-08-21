"use client";

import { useEffect, useState } from "react";

type Mode = "light" | "dark";

type Color =
  | "amber"
  | "blue"
  | "pink"
  | "rose"
  | "emerald"
  | "black";

const colors: {
  id: Color;
  label: string;
  dot: string;
}[] = [
  {
    id: "amber",
    label: "Amber",
    dot: "#f59e0b",
  },
  {
    id: "blue",
    label: "Blue",
    dot: "#2563eb",
  },
  {
    id: "pink",
    label: "Pink",
    dot: "#ec4899",
  },
  {
    id: "rose",
    label: "Rose",
    dot: "#f43f5e",
  },
  {
    id: "emerald",
    label: "Emerald",
    dot: "#10b981",
  },
  {
    id: "black",
    label: "Black",
    dot: "#111827",
  },
];

export default function ThemeToggle() {
  /*
   * Default values for a new user
   *
   * New user:
   * Light + Blue
   */
  const [mode, setMode] = useState<Mode>("light");

  const [color, setColor] =
    useState<Color>("blue");

  const [open, setOpen] =
    useState(false);

  /*
   * Get a unique key for the currently
   * logged-in user.
   *
   * Example:
   *
   * theme_user@gmail.com
   * colorMode_user@gmail.com
   */
  const getUserKey = () => {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return "guest";
    }

    try {
      const user = JSON.parse(storedUser);

      /*
       * Email is the best unique identifier
       * for Google users.
       *
       * For Guest users, email is also stored.
       */
      return (
        user?.email ||
        user?.name ||
        "guest"
      );
    } catch {
      return "guest";
    }
  };

  /*
   * Load theme when component mounts.
   */
  useEffect(() => {
    const userKey = getUserKey();

    const themeKey =
      `theme_${userKey}`;

    const colorKey =
      `colorMode_${userKey}`;

    const savedMode =
      localStorage.getItem(
        themeKey
      ) as Mode | null;

    const savedColor =
      localStorage.getItem(
        colorKey
      ) as Color | null;

    /*
     * If the user has never selected
     * a theme:
     *
     * Light + Blue
     */
    const nextMode: Mode =
      savedMode === "dark"
        ? "dark"
        : "light";

    const nextColor: Color =
      colors.some(
        (item) =>
          item.id === savedColor
      )
        ? savedColor!
        : "blue";

    setMode(nextMode);
    setColor(nextColor);

    /*
     * Apply mode to <html>
     */
    document.documentElement.classList.toggle(
      "dark",
      nextMode === "dark"
    );

    /*
     * Apply color to <html>
     */
    document.documentElement.dataset.colorMode =
      nextColor;
  }, []);

  /*
   * Change Light / Dark mode
   */
  const changeMode = (next: Mode) => {
    const userKey = getUserKey();

    const themeKey =
      `theme_${userKey}`;

    setMode(next);

    /*
     * Save theme for THIS USER only
     */
    localStorage.setItem(
      themeKey,
      next
    );

    /*
     * Apply immediately
     */
    document.documentElement.classList.toggle(
      "dark",
      next === "dark"
    );
  };

  /*
   * Change Accent Color
   */
  const changeColor = (next: Color) => {
    const userKey = getUserKey();

    const colorKey =
      `colorMode_${userKey}`;

    setColor(next);

    /*
     * Save color for THIS USER only
     */
    localStorage.setItem(
      colorKey,
      next
    );

    /*
     * Apply immediately
     */
    document.documentElement.dataset.colorMode =
      next;
  };

  return (
    <div className="relative">

      {/* =========================
          THEME BUTTON
      ========================= */}

      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="
          flex
          w-full
          items-center
          justify-between
          rounded-lg
          px-4
          py-2.5
          text-left
          text-sm
          font-medium
          text-slate-600
          transition
          hover:bg-slate-100
          hover:text-slate-900
          dark:text-slate-300
          dark:hover:bg-slate-800
          dark:hover:text-white
        "
      >
        <span>
          Theme
        </span>

        <span className="text-xs">
          {mode === "dark"
            ? "Dark"
            : "Light"}{" "}
          ·{" "}
          {
            colors.find(
              (item) =>
                item.id === color
            )?.label
          }
        </span>
      </button>

      {/* =========================
          THEME MENU
      ========================= */}

      {open && (
        <div
          className="
            absolute
            bottom-full
            left-0
            z-50
            mb-2
            w-56
            rounded-xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-xl
            dark:border-slate-700
            dark:bg-slate-900
          "
        >

          {/* =====================
              CHANGE THEME
          ===================== */}

          <p
            className="
              mb-2
              px-2
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Change Theme
          </p>

          <div className="grid grid-cols-2 gap-2">

            {/* LIGHT */}

            <button
              type="button"
              onClick={() =>
                changeMode("light")
              }
              className={`
                rounded-lg
                px-3
                py-2
                text-sm
                transition
                ${
                  mode === "light"
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }
              `}
            >
              Light
            </button>

            {/* DARK */}

            <button
              type="button"
              onClick={() =>
                changeMode("dark")
              }
              className={`
                rounded-lg
                px-3
                py-2
                text-sm
                transition
                ${
                  mode === "dark"
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                }
              `}
            >
              Dark
            </button>

          </div>

          {/* =====================
              COLOR MODE
          ===================== */}

          <p
            className="
              mb-2
              mt-4
              px-2
              text-xs
              font-bold
              uppercase
              tracking-wide
              text-slate-400
            "
          >
            Color Mode
          </p>

          <div className="space-y-1">

            {colors.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  changeColor(item.id)
                }
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-2
                  text-sm
                  transition
                  ${
                    color === item.id
                      ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)]"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                `}
              >

                {/* COLOR DOT */}

                <span
  className="h-3 w-3 rounded-full"
  style={{
    backgroundColor: item.dot,
  }}
/>
                {/* COLOR NAME */}

                <span>
                  {item.label}
                </span>

                {/* SELECTED */}

                {color === item.id && (
                  <span className="ml-auto">
                    ✓
                  </span>
                )}

              </button>
            ))}

          </div>

        </div>
      )}

    </div>
  );
}