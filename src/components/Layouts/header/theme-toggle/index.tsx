"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "./icons";

const THEMES = [
  {
    name: "light",
    Icon: Sun,
  },
  {
    name: "dark",
    Icon: Moon,
  },
];

export function ThemeToggleSwitch() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="group rounded-full bg-gray-200 p-1 text-gray-700 outline-1 outline-blue-500 focus-visible:outline dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
    >
      <span className="sr-only">
        Switch to {theme === "light" ? "dark" : "light"} mode
      </span>

      <span aria-hidden className="relative flex gap-1">
        {/* Indicator */}
        <span className="absolute w-8 h-8 rounded-full border border-gray-300 bg-white transition-all dark:translate-x-9 dark:border-gray-500 dark:bg-gray-800" />

        {THEMES.map(({ name, Icon }) => (
          <span
            key={name}
            className={cn(
              "relative grid w-8 h-8 place-items-center rounded-full z-10",
              name === "dark" && "dark:text-white",
            )}
          >
            <Icon className="w-4 h-4" />
          </span>
        ))}
      </span>
    </button>
  );
}
