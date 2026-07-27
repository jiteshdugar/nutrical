"use client";

import { Button } from "@/components/ui/button";
import { useProfile, useGoalsForDate } from "@/lib/data/queries";
import { todayIsoDate } from "@/lib/data/repository";
import { logout } from "@/server/actions/auth";

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: goals } = useGoalsForDate(todayIsoDate());

  return (
    <div className="flex flex-col gap-6 pb-20">
      <h1 className="text-xl font-semibold">Profile</h1>

      <div className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Stats</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Sex</dt>
          <dd className="text-right capitalize">{profile?.sex ?? "—"}</dd>
          <dt className="text-muted-foreground">Height</dt>
          <dd className="text-right">{profile?.heightCm ? `${profile.heightCm} cm` : "—"}</dd>
          <dt className="text-muted-foreground">Weight</dt>
          <dd className="text-right">{profile?.weightKg ? `${profile.weightKg} kg` : "—"}</dd>
          <dt className="text-muted-foreground">Activity level</dt>
          <dd className="text-right capitalize">
            {profile?.activityLevel?.replace("_", " ") ?? "—"}
          </dd>
        </dl>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Daily targets</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Calories</dt>
          <dd className="text-right">{goals?.calorieTarget ?? "—"}</dd>
          <dt className="text-muted-foreground">Protein</dt>
          <dd className="text-right">{goals?.proteinGTarget ?? "—"}g</dd>
          <dt className="text-muted-foreground">Carbs</dt>
          <dd className="text-right">{goals?.carbsGTarget ?? "—"}g</dd>
          <dt className="text-muted-foreground">Fat</dt>
          <dd className="text-right">{goals?.fatGTarget ?? "—"}g</dd>
        </dl>
      </div>

      <a href="/onboarding" className="text-center text-sm text-primary underline underline-offset-4">
        Redo onboarding
      </a>

      <form action={logout}>
        <Button type="submit" variant="outline" className="w-full">
          Log out
        </Button>
      </form>
    </div>
  );
}
