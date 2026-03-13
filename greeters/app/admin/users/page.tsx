import { UsersManager } from "@/components/admin/users/UsersManager";
import { listAdminUsers } from "@/lib/services/admin-users";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return <UsersManager initialUsers={users} />;
}