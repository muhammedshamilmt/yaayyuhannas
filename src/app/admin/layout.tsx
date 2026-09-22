import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { PropsWithChildren } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex min-h-screen bg-gray-50 font-poppins"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}>

        <Sidebar />
        <div className="w-full bg-transparent">
          <Header />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[calc(100vh-200px)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}