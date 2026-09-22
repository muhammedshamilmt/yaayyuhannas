import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PropsType = {
  title: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function ShowcaseSection({ title, children, className, id }: PropsType) {
  const getSectionIcon = (title: string) => {
    if (title.toLowerCase().includes('team')) return '👥';
    if (title.toLowerCase().includes('candidate')) return '🎓';
    if (title.toLowerCase().includes('result')) return '🏆';
    if (title.toLowerCase().includes('search')) return '🔍';
    if (title.toLowerCase().includes('gallery')) return '📸';
    if (title.toLowerCase().includes('print')) return '🖨️';
    if (title.toLowerCase().includes('setting')) return '⚙️';
    if (title.toLowerCase().includes('form')) return '📝';
    if (title.toLowerCase().includes('report')) return '📊';
    if (title.toLowerCase().includes('management')) return '🎯';
    return '📋';
  };

  const getGradientColors = (title: string) => {
    if (title.toLowerCase().includes('team')) return 'from-green-400 to-emerald-500';
    if (title.toLowerCase().includes('candidate')) return 'from-blue-400 to-cyan-500';
    if (title.toLowerCase().includes('result')) return 'from-red-400 to-rose-500';
    if (title.toLowerCase().includes('search')) return 'from-purple-400 to-pink-500';
    if (title.toLowerCase().includes('gallery')) return 'from-orange-400 to-yellow-500';
    if (title.toLowerCase().includes('print')) return 'from-gray-400 to-gray-600';
    if (title.toLowerCase().includes('setting')) return 'from-indigo-400 to-purple-500';
    if (title.toLowerCase().includes('form')) return 'from-teal-400 to-cyan-500';
    if (title.toLowerCase().includes('report')) return 'from-emerald-400 to-green-500';
    if (title.toLowerCase().includes('management')) return 'from-violet-400 to-purple-500';
    return 'from-blue-500 to-purple-600';
  };

  return (
    <div id={id} className="rounded-xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-xl">
        <h2 className="font-bold text-gray-900 flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-r ${getGradientColors(title)} rounded-lg flex items-center justify-center shadow-sm`}>
            <span className="text-white text-lg">{getSectionIcon(title)}</span>
          </div>
          <span className="text-xl">{title}</span>
        </h2>
      </div>

      <div className={cn("p-6", className)}>{children}</div>
    </div>
  );
}
