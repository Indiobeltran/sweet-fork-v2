import { AdminAccountMenu } from "@/components/admin/admin-account-menu";
import { AdminShellChrome } from "@/components/admin/admin-shell-chrome";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdmin();

  return (
    <AdminShellChrome
      accountMenu={
        <AdminAccountMenu
          admin={{
            email: admin.email,
            fullName: admin.fullName,
            role: admin.role,
          }}
        />
      }
    >
      {children}
    </AdminShellChrome>
  );
}
