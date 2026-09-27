import { requireRole, getHallForUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Building2 } from "lucide-react";
import { HallSettingsForm } from "@/components/dashboard/hall-settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Venue profile" };

export default async function HallSettingsPage() {
  const user = await requireRole(["HALL_OWNER"]);
  const hall = await getHallForUser(user);
  if (!hall) {
    return (
      <Card>
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No venue found" description="Register your venue to edit its profile." />
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-stone-900">Venue profile</h1>
        <p className="mt-1 text-sm text-stone-500">Everything couples see on your public venue page</p>
      </div>
      <HallSettingsForm
        hall={{
          slug: hall.slug,
          name: hall.name,
          description: hall.description,
          address: hall.address,
          city: hall.city,
          state: hall.state,
          pincode: hall.pincode,
          contactPhone: hall.contactPhone,
          contactEmail: hall.contactEmail,
          capacity: hall.capacity,
          hallCount: hall.hallCount,
          rooms: hall.rooms,
          parking: hall.parking,
          baseRent: hall.baseRent,
          vegPlate: hall.vegPlate,
          nonvegPlate: hall.nonvegPlate,
          checkIn: hall.checkIn,
          checkOut: hall.checkOut,
          amenities: hall.amenities,
          images: hall.images,
        }}
      />
    </div>
  );
}
