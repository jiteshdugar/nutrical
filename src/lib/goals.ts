import type { ActivityLevel, DailyGoals, GoalIntent, Sex } from "@/types/nutrical";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_INTENT_ADJUSTMENT: Record<GoalIntent, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

// Standard macro split, as a fraction of total calories.
const MACRO_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 };
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

export interface CalculateGoalsInput {
  sex: Sex;
  dateOfBirth: string; // ISO date
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalIntent: GoalIntent;
  today?: Date;
}

export function ageFromDateOfBirth(dateOfBirth: string, today = new Date()): number {
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export function calculateBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateGoals(
  input: CalculateGoalsInput,
): Pick<DailyGoals, "calorieTarget" | "proteinGTarget" | "carbsGTarget" | "fatGTarget"> {
  const age = ageFromDateOfBirth(input.dateOfBirth, input.today ?? new Date());
  const bmr = calculateBmr(input.sex, input.weightKg, input.heightCm, age);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activityLevel];
  const calorieTarget = Math.max(
    1200,
    Math.round(tdee + GOAL_INTENT_ADJUSTMENT[input.goalIntent]),
  );

  return {
    calorieTarget,
    proteinGTarget: Math.round((calorieTarget * MACRO_SPLIT.protein) / KCAL_PER_G.protein),
    carbsGTarget: Math.round((calorieTarget * MACRO_SPLIT.carbs) / KCAL_PER_G.carbs),
    fatGTarget: Math.round((calorieTarget * MACRO_SPLIT.fat) / KCAL_PER_G.fat),
  };
}
