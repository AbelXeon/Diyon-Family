import { requireUser } from "@/lib/auth";
import { SidebarShell } from "@/components/sidebar-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  return (
    <SidebarShell user={{ name: u.name, username: u.username, role: u.role, avatarUrl: u.avatarUrl }}>
      {children}
    </SidebarShell>
  );
}