import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">My profile</h1>
        <p className="mt-1 text-sm text-stone-500">Your account details and password</p>
      </div>

      <Card className="mb-6">
        <CardHeader title="Account" bordered />
        <div className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Name</p>
            <p className="mt-1.5 text-sm font-semibold text-stone-800">{user.name}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Email</p>
            <p className="mt-1.5 truncate text-sm font-semibold text-stone-800">{user.email}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Role</p>
            <Badge className="mt-1.5 bg-brand-50 text-brand-700 ring-1 ring-brand-200">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400">Member since</p>
            <p className="mt-1.5 text-sm font-semibold text-stone-800">{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </Card>

      <ProfileForm currentName={user.name} currentPhone={user.phone} />
    </div>
  );
}
