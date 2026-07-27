"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Flame, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepDots } from "@/components/onboarding/step-dots";
import { OptionCard } from "@/components/onboarding/option-card";
import { calculateGoals } from "@/lib/goals";
import { cmToFeetInches, feetInchesToCm, kgToLb, lbToKg } from "@/lib/units";
import { saveGoals, saveProfile, todayIsoDate } from "@/lib/data/repository";
import type {
  ActivityLevel,
  GoalIntent,
  GoalMode,
  Sex,
  UnitSystem,
} from "@/types/nutrical";

const ACTIVITY_OPTIONS: { value: ActivityLevel; title: string; description: string }[] = [
  { value: "sedentary", title: "Sedentary", description: "Little to no exercise, desk job" },
  { value: "light", title: "Lightly active", description: "Light exercise 1-3 days/week" },
  { value: "moderate", title: "Moderately active", description: "Moderate exercise 3-5 days/week" },
  { value: "active", title: "Active", description: "Hard exercise 6-7 days/week" },
  { value: "very_active", title: "Very active", description: "Physical job or training twice a day" },
];

const GOAL_INTENT_OPTIONS: { value: GoalIntent; title: string; description: string; icon: typeof TrendingDown }[] = [
  { value: "lose", title: "Lose weight", description: "A moderate calorie deficit", icon: TrendingDown },
  { value: "maintain", title: "Maintain weight", description: "Eat around your maintenance calories", icon: Minus },
  { value: "gain", title: "Gain weight", description: "A moderate calorie surplus", icon: TrendingUp },
];

const TOTAL_STEPS = 5;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [sex, setSex] = useState<Sex | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [feet, setFeet] = useState<number | null>(null);
  const [inches, setInches] = useState<number | null>(null);
  const [weightLb, setWeightLb] = useState<number | null>(null);

  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);
  const [goalIntent, setGoalIntent] = useState<GoalIntent | null>(null);

  const [goalMode, setGoalMode] = useState<GoalMode>("calculated");
  const [manualCalories, setManualCalories] = useState<number | null>(null);
  const [manualProtein, setManualProtein] = useState<number | null>(null);
  const [manualCarbs, setManualCarbs] = useState<number | null>(null);
  const [manualFat, setManualFat] = useState<number | null>(null);

  const [statsError, setStatsError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  const calculated = useMemo(() => {
    if (!sex || !dateOfBirth || !heightCm || !weightKg || !activityLevel || !goalIntent) {
      return null;
    }
    return calculateGoals({ sex, dateOfBirth, heightCm, weightKg, activityLevel, goalIntent });
  }, [sex, dateOfBirth, heightCm, weightKg, activityLevel, goalIntent]);

  function handleUnitToggle(next: UnitSystem) {
    setUnitSystem(next);
    if (next === "imperial" && heightCm && weightKg) {
      const { feet: f, inches: i } = cmToFeetInches(heightCm);
      setFeet(f);
      setInches(i);
      setWeightLb(kgToLb(weightKg));
    }
    if (next === "metric" && feet != null && inches != null && weightLb != null) {
      setHeightCm(feetInchesToCm(feet, inches));
      setWeightKg(lbToKg(weightLb));
    }
  }

  function handleImperialHeightChange(f: number | null, i: number | null) {
    setFeet(f);
    setInches(i);
    if (f != null && i != null) setHeightCm(feetInchesToCm(f, i));
  }

  function handleImperialWeightChange(lb: number | null) {
    setWeightLb(lb);
    if (lb != null) setWeightKg(lbToKg(lb));
  }

  function validateStats(): boolean {
    if (!sex) return fail("Choose a sex to continue — it's used for the calorie formula.");
    if (!dateOfBirth) return fail("Enter your date of birth.");
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    if (age < 13 || age > 100) return fail("Enter a valid date of birth.");
    if (!heightCm || heightCm < 100 || heightCm > 250) return fail("Enter a valid height.");
    if (!weightKg || weightKg < 30 || weightKg > 300) return fail("Enter a valid weight.");
    setStatsError(null);
    return true;
  }

  function fail(message: string): false {
    setStatsError(message);
    return false;
  }

  function goNext() {
    if (step === 1 && !validateStats()) return;
    if (step === 2 && !activityLevel) return;
    if (step === 3 && !goalIntent) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    const targets =
      goalMode === "manual"
        ? {
            calorieTarget: manualCalories ?? 2000,
            proteinGTarget: manualProtein ?? 150,
            carbsGTarget: manualCarbs ?? 200,
            fatGTarget: manualFat ?? 65,
          }
        : calculated ?? { calorieTarget: 2000, proteinGTarget: 150, carbsGTarget: 200, fatGTarget: 65 };

    setIsFinishing(true);
    setFinishError(null);
    try {
      await saveProfile({
        displayName: null,
        dateOfBirth,
        sex,
        heightCm,
        weightKg,
        activityLevel,
        goalIntent: goalIntent ?? "maintain",
        goalMode,
        onboardingCompletedAt: new Date().toISOString(),
      });

      await saveGoals({
        effectiveDate: todayIsoDate(),
        source: goalMode,
        ...targets,
      });

      router.push("/today");
    } catch (err) {
      setIsFinishing(false);
      setFinishError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-8">
      {step > 0 ? (
        <div className="mb-8">
          <StepDots total={TOTAL_STEPS} current={step} />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col">
        {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}

        {step === 1 && (
          <StatsStep
            unitSystem={unitSystem}
            onUnitToggle={handleUnitToggle}
            sex={sex}
            onSexChange={setSex}
            dateOfBirth={dateOfBirth}
            onDateOfBirthChange={setDateOfBirth}
            heightCm={heightCm}
            onHeightCmChange={setHeightCm}
            weightKg={weightKg}
            onWeightKgChange={setWeightKg}
            feet={feet}
            inches={inches}
            onImperialHeightChange={handleImperialHeightChange}
            weightLb={weightLb}
            onImperialWeightChange={handleImperialWeightChange}
            error={statsError}
          />
        )}

        {step === 2 && (
          <ActivityStep activityLevel={activityLevel} onChange={setActivityLevel} />
        )}

        {step === 3 && <GoalIntentStep goalIntent={goalIntent} onChange={setGoalIntent} />}

        {step === 4 && (
          <ResultStep
            calculated={calculated}
            goalMode={goalMode}
            onGoalModeChange={setGoalMode}
            manualCalories={manualCalories}
            onManualCaloriesChange={setManualCalories}
            manualProtein={manualProtein}
            onManualProteinChange={setManualProtein}
            manualCarbs={manualCarbs}
            onManualCarbsChange={setManualCarbs}
            manualFat={manualFat}
            onManualFatChange={setManualFat}
          />
        )}
      </div>

      {step > 0 && step < TOTAL_STEPS - 1 && (
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={goBack}>
            Back
          </Button>
          <Button className="flex-1" onClick={goNext}>
            Continue
          </Button>
        </div>
      )}

      {step === TOTAL_STEPS - 1 && (
        <div className="mt-8 flex flex-col gap-3">
          {finishError ? <p className="text-center text-sm text-destructive">{finishError}</p> : null}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={goBack} disabled={isFinishing}>
              Back
            </Button>
            <Button className="flex-1" onClick={finish} disabled={isFinishing}>
              {isFinishing ? "Saving…" : "Start tracking"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Flame className="size-8" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome to Nutrical</h1>
      <p className="mt-3 max-w-xs text-muted-foreground">
        A few quick questions to set your calorie and macro targets. Takes about a minute.
      </p>
      <Button className="mt-10 w-full max-w-xs" size="lg" onClick={onNext}>
        Get started
      </Button>
    </div>
  );
}

interface StatsStepProps {
  unitSystem: UnitSystem;
  onUnitToggle: (u: UnitSystem) => void;
  sex: Sex | null;
  onSexChange: (s: Sex) => void;
  dateOfBirth: string;
  onDateOfBirthChange: (d: string) => void;
  heightCm: number | null;
  onHeightCmChange: (n: number | null) => void;
  weightKg: number | null;
  onWeightKgChange: (n: number | null) => void;
  feet: number | null;
  inches: number | null;
  onImperialHeightChange: (feet: number | null, inches: number | null) => void;
  weightLb: number | null;
  onImperialWeightChange: (lb: number | null) => void;
  error: string | null;
}

function StatsStep(props: StatsStepProps) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-semibold tracking-tight">Tell us about you</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Used to estimate your daily calorie needs.
      </p>

      <div className="mt-6 flex gap-2">
        <Button
          type="button"
          variant={props.unitSystem === "metric" ? "default" : "outline"}
          size="sm"
          onClick={() => props.onUnitToggle("metric")}
        >
          Metric
        </Button>
        <Button
          type="button"
          variant={props.unitSystem === "imperial" ? "default" : "outline"}
          size="sm"
          onClick={() => props.onUnitToggle("imperial")}
        >
          Imperial
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <Label className="mb-2 block">Sex</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={props.sex === "female" ? "default" : "outline"}
              onClick={() => props.onSexChange("female")}
            >
              Female
            </Button>
            <Button
              type="button"
              variant={props.sex === "male" ? "default" : "outline"}
              onClick={() => props.onSexChange("male")}
            >
              Male
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="dob" className="mb-2 block">
            Date of birth
          </Label>
          <Input
            id="dob"
            type="date"
            value={props.dateOfBirth}
            onChange={(e) => props.onDateOfBirthChange(e.target.value)}
          />
        </div>

        {props.unitSystem === "metric" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="height" className="mb-2 block">
                Height (cm)
              </Label>
              <Input
                id="height"
                type="number"
                inputMode="numeric"
                value={props.heightCm ?? ""}
                onChange={(e) => props.onHeightCmChange(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
            <div>
              <Label htmlFor="weight" className="mb-2 block">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                value={props.weightKg ?? ""}
                onChange={(e) => props.onWeightKgChange(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">Height</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="ft"
                  value={props.feet ?? ""}
                  onChange={(e) =>
                    props.onImperialHeightChange(
                      e.target.value ? Number(e.target.value) : null,
                      props.inches,
                    )
                  }
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="in"
                  value={props.inches ?? ""}
                  onChange={(e) =>
                    props.onImperialHeightChange(
                      props.feet,
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="weight-lb" className="mb-2 block">
                Weight (lb)
              </Label>
              <Input
                id="weight-lb"
                type="number"
                inputMode="decimal"
                value={props.weightLb ?? ""}
                onChange={(e) =>
                  props.onImperialWeightChange(e.target.value ? Number(e.target.value) : null)
                }
              />
            </div>
          </div>
        )}
      </div>

      {props.error ? <p className="mt-4 text-sm text-destructive">{props.error}</p> : null}
    </div>
  );
}

function ActivityStep({
  activityLevel,
  onChange,
}: {
  activityLevel: ActivityLevel | null;
  onChange: (a: ActivityLevel) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-semibold tracking-tight">Activity level</h2>
      <p className="mt-1 text-sm text-muted-foreground">How active are you on a typical week?</p>
      <div className="mt-6 space-y-2.5">
        {ACTIVITY_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            title={opt.title}
            description={opt.description}
            icon={Activity}
            selected={activityLevel === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

function GoalIntentStep({
  goalIntent,
  onChange,
}: {
  goalIntent: GoalIntent | null;
  onChange: (g: GoalIntent) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-semibold tracking-tight">What&rsquo;s your goal?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This adjusts your daily calorie target.
      </p>
      <div className="mt-6 space-y-2.5">
        {GOAL_INTENT_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            title={opt.title}
            description={opt.description}
            icon={opt.icon}
            selected={goalIntent === opt.value}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

interface ResultStepProps {
  calculated: ReturnType<typeof calculateGoals> | null;
  goalMode: GoalMode;
  onGoalModeChange: (m: GoalMode) => void;
  manualCalories: number | null;
  onManualCaloriesChange: (n: number | null) => void;
  manualProtein: number | null;
  onManualProteinChange: (n: number | null) => void;
  manualCarbs: number | null;
  onManualCarbsChange: (n: number | null) => void;
  manualFat: number | null;
  onManualFatChange: (n: number | null) => void;
}

function ResultStep(props: ResultStepProps) {
  if (props.goalMode === "calculated") {
    return (
      <div className="flex flex-1 flex-col">
        <h2 className="text-2xl font-semibold tracking-tight">Your daily targets</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your stats and goal, calculated with the Mifflin-St Jeor formula.
        </p>

        <div className="mt-6 rounded-2xl border bg-card p-6 text-center">
          <div className="text-5xl font-semibold tabular-nums text-primary">
            {props.calculated?.calorieTarget ?? "—"}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">calories / day</div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <MacroPreview label="Protein" value={props.calculated?.proteinGTarget} />
            <MacroPreview label="Carbs" value={props.calculated?.carbsGTarget} />
            <MacroPreview label="Fat" value={props.calculated?.fatGTarget} />
          </div>
        </div>

        <button
          type="button"
          className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          onClick={() => {
            props.onGoalModeChange("manual");
            props.onManualCaloriesChange(props.calculated?.calorieTarget ?? 2000);
            props.onManualProteinChange(props.calculated?.proteinGTarget ?? 150);
            props.onManualCarbsChange(props.calculated?.carbsGTarget ?? 200);
            props.onManualFatChange(props.calculated?.fatGTarget ?? 65);
          }}
        >
          Customize these numbers instead
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-semibold tracking-tight">Set your own targets</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter the numbers you&rsquo;d like to hit daily.</p>

      <div className="mt-6 space-y-4">
        <div>
          <Label htmlFor="manual-cal" className="mb-2 block">
            Calories
          </Label>
          <Input
            id="manual-cal"
            type="number"
            inputMode="numeric"
            value={props.manualCalories ?? ""}
            onChange={(e) => props.onManualCaloriesChange(e.target.value ? Number(e.target.value) : null)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="manual-protein" className="mb-2 block">
              Protein (g)
            </Label>
            <Input
              id="manual-protein"
              type="number"
              inputMode="numeric"
              value={props.manualProtein ?? ""}
              onChange={(e) => props.onManualProteinChange(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="manual-carbs" className="mb-2 block">
              Carbs (g)
            </Label>
            <Input
              id="manual-carbs"
              type="number"
              inputMode="numeric"
              value={props.manualCarbs ?? ""}
              onChange={(e) => props.onManualCarbsChange(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div>
            <Label htmlFor="manual-fat" className="mb-2 block">
              Fat (g)
            </Label>
            <Input
              id="manual-fat"
              type="number"
              inputMode="numeric"
              value={props.manualFat ?? ""}
              onChange={(e) => props.onManualFatChange(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        onClick={() => props.onGoalModeChange("calculated")}
      >
        Use the calculated targets instead
      </button>
    </div>
  );
}

function MacroPreview({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="text-lg font-semibold tabular-nums">{value ?? "—"}g</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
