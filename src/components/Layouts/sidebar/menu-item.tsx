import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-lg px-3 font-medium transition-all duration-200",
  {
    variants: {
      isActive: {
        true: "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg",
        false: "text-gray-600 hover:bg-gray-900 hover:text-white dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        // Close sidebar on clicking link if it's mobile
        onClick={() => isMobile && toggleSidebar()}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative block py-2.5",
          }),
          props.className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: "flex w-full items-center gap-3 py-2.5",
      })}
    >
      {props.children}
    </button>
  );
}
