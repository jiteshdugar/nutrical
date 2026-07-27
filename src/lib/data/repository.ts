import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type {
  DailyGoals,
  FoodItem,
  FoodLogEntry,
  MacroTotals,
  MealType,
  Profile,
} from "@/types/nutrical";

/**
 * Supabase-backed implementation of the app's data access layer.
 *
 * Function names/signatures mirror the original localStorage-backed version
 * so call sites (React Query hooks, components) didn't need to change when
 * this was swapped over.
 */

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type DailyGoalsRow = Database["public"]["Tables"]["daily_goals"]["Row"];
type FoodRow = Database["public"]["Tables"]["foods"]["Row"];
type EntryRow = Database["public"]["Tables"]["food_log_entries"]["Row"];

async function requireUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

export function todayIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateId(): string {
  return crypto.randomUUID();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---- Profile ----

function mapProfileRow(row: ProfileRow): Profile {
  return {
    displayName: row.display_name,
    dateOfBirth: row.date_of_birth,
    sex: row.sex as Profile["sex"],
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    activityLevel: row.activity_level as Profile["activityLevel"],
    goalIntent: row.goal_intent as Profile["goalIntent"],
    goalMode: row.goal_mode as Profile["goalMode"],
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export async function getProfile(): Promise<Profile> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;

  if (!data) {
    return {
      displayName: null,
      dateOfBirth: null,
      sex: null,
      heightCm: null,
      weightKg: null,
      activityLevel: null,
      goalIntent: "maintain",
      goalMode: "calculated",
      onboardingCompletedAt: null,
    };
  }
  return mapProfileRow(data);
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      display_name: profile.displayName,
      date_of_birth: profile.dateOfBirth,
      sex: profile.sex,
      height_cm: profile.heightCm,
      weight_kg: profile.weightKg,
      activity_level: profile.activityLevel,
      goal_intent: profile.goalIntent,
      goal_mode: profile.goalMode,
      onboarding_completed_at: profile.onboardingCompletedAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapProfileRow(data);
}

// ---- Goals ----

function mapGoalsRow(row: DailyGoalsRow): DailyGoals {
  return {
    effectiveDate: row.effective_date,
    calorieTarget: row.calorie_target,
    proteinGTarget: row.protein_g_target,
    carbsGTarget: row.carbs_g_target,
    fatGTarget: row.fat_g_target,
    source: row.source as DailyGoals["source"],
  };
}

/** Returns the goal in effect on the given date (the latest goal with effectiveDate <= date). */
export async function getGoalsForDate(date: string): Promise<DailyGoals | null> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_goals")
    .select("*")
    .eq("user_id", userId)
    .lte("effective_date", date)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapGoalsRow(data) : null;
}

export async function saveGoals(goals: DailyGoals): Promise<DailyGoals> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_goals")
    .upsert(
      {
        user_id: userId,
        effective_date: goals.effectiveDate,
        calorie_target: goals.calorieTarget,
        protein_g_target: goals.proteinGTarget,
        carbs_g_target: goals.carbsGTarget,
        fat_g_target: goals.fatGTarget,
        source: goals.source,
      },
      { onConflict: "user_id,effective_date" },
    )
    .select()
    .single();
  if (error) throw error;
  return mapGoalsRow(data);
}

// ---- Foods ----

function mapFoodRow(row: FoodRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as FoodItem["category"],
    servingSize: row.serving_size,
    servingUnit: row.serving_unit,
    servingLabel: row.serving_label,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
    sodiumMg: row.sodium_mg,
    isCustom: row.is_custom,
  };
}

export async function getFoodById(id: string): Promise<FoodItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("foods").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapFoodRow(data) : null;
}

export async function searchFoods(query: string, limit = 20): Promise<FoodItem[]> {
  const supabase = createClient();
  const q = query.trim();

  let request = supabase.from("foods").select("*").limit(limit);
  if (q) {
    request = request.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
  }
  const { data, error } = await request.order("name");
  if (error) throw error;
  return (data ?? []).map(mapFoodRow);
}

export async function addCustomFood(
  food: Omit<FoodItem, "id" | "isCustom">,
): Promise<FoodItem> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("foods")
    .insert({
      id: `custom-${generateId()}`,
      name: food.name,
      brand: food.brand,
      category: food.category,
      serving_size: food.servingSize,
      serving_unit: food.servingUnit,
      serving_label: food.servingLabel,
      calories: food.calories,
      protein_g: food.proteinG,
      carbs_g: food.carbsG,
      fat_g: food.fatG,
      fiber_g: food.fiberG,
      sugar_g: food.sugarG,
      sodium_mg: food.sodiumMg,
      is_custom: true,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return mapFoodRow(data);
}

// ---- Log entries ----

function mapEntryRow(row: EntryRow, foodName: string): FoodLogEntry {
  return {
    id: row.id,
    foodId: row.food_id,
    foodName,
    loggedAt: row.logged_at,
    logDate: row.log_date,
    mealType: row.meal_type as MealType,
    quantity: row.quantity,
    calories: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    sugarG: row.sugar_g,
  };
}

export async function getEntriesForDate(date: string): Promise<FoodLogEntry[]> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_log_entries")
    .select("*, foods(name)")
    .eq("user_id", userId)
    .eq("log_date", date)
    .order("logged_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapEntryRow(row, (row.foods as { name: string } | null)?.name ?? "Unknown food"));
}

export async function getRecentFoods(limit = 8): Promise<FoodItem[]> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_log_entries")
    .select("food_id, logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const seen: string[] = [];
  for (const row of data ?? []) {
    if (!seen.includes(row.food_id)) seen.push(row.food_id);
    if (seen.length >= limit) break;
  }
  if (seen.length === 0) return [];

  const { data: foods, error: foodsError } = await supabase
    .from("foods")
    .select("*")
    .in("id", seen);
  if (foodsError) throw foodsError;

  const byId = new Map((foods ?? []).map((f) => [f.id, mapFoodRow(f)]));
  return seen.map((id) => byId.get(id)).filter((f): f is FoodItem => Boolean(f));
}

export interface AddEntryInput {
  foodId: string;
  logDate: string;
  mealType: MealType;
  quantity: number;
}

export async function addEntry(input: AddEntryInput): Promise<FoodLogEntry> {
  const userId = await requireUserId();
  const food = await getFoodById(input.foodId);
  if (!food) throw new Error(`Unknown food: ${input.foodId}`);

  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_log_entries")
    .insert({
      user_id: userId,
      food_id: food.id,
      log_date: input.logDate,
      meal_type: input.mealType,
      quantity: input.quantity,
      calories: round1(food.calories * input.quantity),
      protein_g: round1(food.proteinG * input.quantity),
      carbs_g: round1(food.carbsG * input.quantity),
      fat_g: round1(food.fatG * input.quantity),
      fiber_g: food.fiberG != null ? round1(food.fiberG * input.quantity) : null,
      sugar_g: food.sugarG != null ? round1(food.sugarG * input.quantity) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEntryRow(data, food.name);
}

export async function updateEntryQuantity(
  entryId: string,
  quantity: number,
): Promise<FoodLogEntry | null> {
  const supabase = createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("food_log_entries")
    .select("*, foods(name, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g)")
    .eq("id", entryId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) return null;

  const food = existing.foods as {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number | null;
    sugar_g: number | null;
  } | null;

  const perUnit = food
    ? {
        calories: food.calories,
        proteinG: food.protein_g,
        carbsG: food.carbs_g,
        fatG: food.fat_g,
        fiberG: food.fiber_g,
        sugarG: food.sugar_g,
      }
    : {
        calories: existing.calories / existing.quantity,
        proteinG: existing.protein_g / existing.quantity,
        carbsG: existing.carbs_g / existing.quantity,
        fatG: existing.fat_g / existing.quantity,
        fiberG: existing.fiber_g != null ? existing.fiber_g / existing.quantity : null,
        sugarG: existing.sugar_g != null ? existing.sugar_g / existing.quantity : null,
      };

  const { data, error } = await supabase
    .from("food_log_entries")
    .update({
      quantity,
      calories: round1(perUnit.calories * quantity),
      protein_g: round1(perUnit.proteinG * quantity),
      carbs_g: round1(perUnit.carbsG * quantity),
      fat_g: round1(perUnit.fatG * quantity),
      fiber_g: perUnit.fiberG != null ? round1(perUnit.fiberG * quantity) : null,
      sugar_g: perUnit.sugarG != null ? round1(perUnit.sugarG * quantity) : null,
    })
    .eq("id", entryId)
    .select()
    .single();
  if (error) throw error;
  return mapEntryRow(data, food?.name ?? "Unknown food");
}

export async function deleteEntry(entryId: string): Promise<FoodLogEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_log_entries")
    .delete()
    .eq("id", entryId)
    .select("*, foods(name)")
    .maybeSingle();
  if (error) throw error;
  return data ? mapEntryRow(data, (data.foods as { name: string } | null)?.name ?? "Unknown food") : null;
}

/** Re-insert a previously-deleted entry verbatim (used for the undo toast). */
export async function restoreEntry(entry: FoodLogEntry): Promise<FoodLogEntry> {
  const userId = await requireUserId();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_log_entries")
    .insert({
      id: entry.id,
      user_id: userId,
      food_id: entry.foodId,
      logged_at: entry.loggedAt,
      log_date: entry.logDate,
      meal_type: entry.mealType,
      quantity: entry.quantity,
      calories: entry.calories,
      protein_g: entry.proteinG,
      carbs_g: entry.carbsG,
      fat_g: entry.fatG,
      fiber_g: entry.fiberG,
      sugar_g: entry.sugarG,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEntryRow(data, entry.foodName);
}

export interface DaySummary {
  date: string; // ISO date
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  calorieTarget: number;
  hasEntries: boolean;
}

/** Summaries for the `days` calendar days ending today (oldest first). */
export async function getHistorySummary(days: number): Promise<DaySummary[]> {
  const userId = await requireUserId();
  const supabase = createClient();
  const today = todayIsoDate();
  const startDate = addDaysToIsoDate(today, -(days - 1));

  const [{ data: entries, error: entriesError }, { data: goals, error: goalsError }] =
    await Promise.all([
      supabase
        .from("food_log_entries")
        .select("log_date, calories, protein_g, carbs_g, fat_g")
        .eq("user_id", userId)
        .gte("log_date", startDate)
        .lte("log_date", today),
      supabase
        .from("daily_goals")
        .select("effective_date, calorie_target")
        .eq("user_id", userId)
        .lte("effective_date", today)
        .order("effective_date", { ascending: true }),
    ]);
  if (entriesError) throw entriesError;
  if (goalsError) throw goalsError;

  const entriesByDate = new Map<string, { calories: number; proteinG: number; carbsG: number; fatG: number }[]>();
  for (const row of entries ?? []) {
    const list = entriesByDate.get(row.log_date) ?? [];
    list.push({
      calories: row.calories,
      proteinG: row.protein_g,
      carbsG: row.carbs_g,
      fatG: row.fat_g,
    });
    entriesByDate.set(row.log_date, list);
  }

  const sortedGoals = goals ?? [];

  const summaries: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysToIsoDate(today, -i);
    const dayEntries = entriesByDate.get(date) ?? [];
    const totals = dayEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        proteinG: acc.proteinG + e.proteinG,
        carbsG: acc.carbsG + e.carbsG,
        fatG: acc.fatG + e.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
    const applicableGoal = [...sortedGoals].reverse().find((g) => g.effective_date <= date);

    summaries.push({
      date,
      calories: totals.calories,
      proteinG: totals.proteinG,
      carbsG: totals.carbsG,
      fatG: totals.fatG,
      calorieTarget: applicableGoal?.calorie_target ?? 0,
      hasEntries: dayEntries.length > 0,
    });
  }
  return summaries;
}

function addDaysToIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayIsoDate(d);
}

/** Consecutive days ending today with at least one logged entry. */
export function computeStreak(summaries: DaySummary[]): number {
  let streak = 0;
  for (let i = summaries.length - 1; i >= 0; i--) {
    if (summaries[i].hasEntries) streak++;
    else break;
  }
  return streak;
}

export function sumMacros(entries: FoodLogEntry[]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (totals, e) => ({
      calories: totals.calories + e.calories,
      proteinG: totals.proteinG + e.proteinG,
      carbsG: totals.carbsG + e.carbsG,
      fatG: totals.fatG + e.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}
