import { Sidebar } from '@/modules/dashboard/ui';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-zinc-200">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
