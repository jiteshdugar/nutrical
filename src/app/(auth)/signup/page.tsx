"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup, type AuthActionState } from "@/server/actions/auth";

const initialState: AuthActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  if (state.error === "CHECK_EMAIL") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link — click it, then come back and log in.
        </p>
        <Link href="/login" className="mt-2 text-sm text-primary underline underline-offset-4">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Create your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Start tracking in under a minute.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="email" className="mb-2 block">
            Email
          </Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password" className="mb-2 block">
            Password
          </Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} />
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  );
}
