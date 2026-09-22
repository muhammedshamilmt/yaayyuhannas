"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "./icons";

const notificationList = [
  {
    image: "/images/user/user-15.png",
    title: "Piter Joined the Team!",
    subTitle: "Congratulate him",
  },
  {
    image: "/images/user/user-03.png",
    title: "New message",
    subTitle: "Devid sent a new message",
  },
  {
    image: "/images/user/user-26.png",
    title: "New Payment received",
    subTitle: "Check your earnings",
  },
  {
    image: "/images/user/user-28.png",
    title: "Jolly completed tasks",
    subTitle: "Assign new task",
  },
  {
    image: "/images/user/user-27.png",
    title: "Roman Joined the Team!",
    subTitle: "Congratulate him",
  },
];

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(true);
  const isMobile = useIsMobile();

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);

        if (setIsDotVisible) setIsDotVisible(false);
      }}
    >
      <DropdownTrigger
        className="grid w-12 h-12 place-items-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 outline-none hover:text-blue-600 hover:bg-gray-100 focus-visible:border-blue-500 focus-visible:text-blue-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus-visible:border-blue-500 transition-colors duration-200"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute -right-1 -top-1 z-10 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-700",
              )}
            >
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-red-500 opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-gray-200 bg-white px-3.5 py-3 shadow-lg dark:border-gray-600 dark:bg-gray-800 min-[350px]:min-w-[20rem] rounded-lg"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-gray-900 dark:text-white">
            Notifications
          </span>
          <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
            5 new
          </span>
        </div>

        <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
          {notificationList.map((item, index) => (
            <li key={index} role="menuitem">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-100 focus-visible:bg-gray-100 dark:hover:bg-gray-700 dark:focus-visible:bg-gray-700 transition-colors duration-200"
              >
                <Image
                  src={item.image}
                  className="w-12 h-12 rounded-full object-cover"
                  width={48}
                  height={48}
                  alt="User"
                />

                <div>
                  <strong className="block text-sm font-medium text-gray-900 dark:text-white">
                    {item.title}
                  </strong>

                  <span className="truncate text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.subTitle}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="#"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-blue-600 p-2 text-center text-sm font-medium tracking-wide text-blue-600 outline-none transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:text-blue-600 focus-visible:border-blue-600 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-900 dark:hover:bg-opacity-20 dark:focus-visible:border-blue-500"
        >
          See all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
