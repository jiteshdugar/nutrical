"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/data/repository";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getProfile().then((profile) => {
      if (cancelled) return;
      router.replace(profile.onboardingCompletedAt ? "/today" : "/onboarding");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
