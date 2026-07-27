export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type GoalIntent = "lose" | "maintain" | "gain";

export type GoalMode = "calculated" | "manual";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type UnitSystem = "metric" | "imperial";

export interface Profile {
  displayName: string | null;
  dateOfBirth: string | null; // ISO date, e.g. "1994-03-12"
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goalIntent: GoalIntent;
  goalMode: GoalMode;
  onboardingCompletedAt: string | null; // ISO datetime
}

export interface DailyGoals {
  effectiveDate: string; // ISO date, applies from this date forward
  calorieTarget: number;
  proteinGTarget: number;
  carbsGTarget: number;
  fatGTarget: number;
  source: GoalMode;
}

export type FoodCategory =
  | "protein"
  | "carb"
  | "vegetable"
  | "fruit"
  | "dairy"
  | "snack"
  | "beverage"
  | "condiment";

export interface FoodItem {
  id: string;
  name: string;
  brand: string | null;
  category: FoodCategory;
  servingSize: number;
  servingUnit: string; // 'g' | 'ml' | 'piece' | 'slice' | 'cup' | 'tbsp'
  servingLabel: string; // human label, e.g. "1 medium banana (118g)"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  isCustom?: boolean;
}

export interface FoodLogEntry {
  id: string;
  foodId: string;
  foodName: string; // denormalized for display even if the food is later removed
  loggedAt: string; // ISO datetime
  logDate: string; // ISO date (local calendar day this entry counts toward)
  mealType: MealType;
  quantity: number; // multiplier on the food's serving size
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number | null;
  sugarG: number | null;
}

export interface MacroTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
