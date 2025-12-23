import { getUsers } from "@/actions/users/admin";
import { constructMetadata } from "@/lib/metadata";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { Suspense } from "react";
import { columns } from "./Columns";
import { DataTable } from "./DataTable";

export async function generateMetadata(): Promise<Metadata> {
  return constructMetadata({
    page: "Users",
    title: "Users",
    description: "View all users.",
    path: `/dashboard/users`,
  });
}

const PAGE_SIZE = 20;

async function UsersTable() {
  const initialData = await getUsers({ pageIndex: 0, pageSize: PAGE_SIZE });

  return (
    <DataTable
      columns={columns}
      initialData={initialData.data?.users || []}
      initialPageCount={Math.ceil(
        initialData.data?.totalCount || 0 / PAGE_SIZE,
      )}
      pageSize={PAGE_SIZE}
    />
  );
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <UsersTable />
      </Suspense>
    </div>
  );
}
