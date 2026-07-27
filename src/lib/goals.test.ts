import { describe, expect, it } from "vitest";
import { ageFromDateOfBirth, calculateBmr, calculateGoals } from "./goals";

describe("ageFromDateOfBirth", () => {
  it("computes age when birthday has already passed this year", () => {
    expect(ageFromDateOfBirth("1990-01-01", new Date("2026-07-26"))).toBe(36);
  });

  it("computes age when birthday hasn't happened yet this year", () => {
    expect(ageFromDateOfBirth("1990-12-31", new Date("2026-07-26"))).toBe(35);
  });
});

describe("calculateBmr", () => {
  it("matches the Mifflin-St Jeor reference formula for males", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBmr("male", 80, 180, 30)).toBeCloseTo(1780);
  });

  it("matches the Mifflin-St Jeor reference formula for females", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calculateBmr("female", 60, 165, 25)).toBeCloseTo(1345.25);
  });
});

describe("calculateGoals", () => {
  it("produces a sane maintenance target for a moderately active adult", () => {
    const result = calculateGoals({
      sex: "male",
      dateOfBirth: "1994-07-26",
      heightCm: 180,
      weightKg: 80,
      activityLevel: "moderate",
      goalIntent: "maintain",
      today: new Date("2026-07-26"),
    });
    // age 32 (DOB 1994-07-26, "today" 2026-07-26) -> BMR = 1770, TDEE = 1770 * 1.55 = 2743.5 -> rounds to 2744
    expect(result.calorieTarget).toBe(2744);
    // Macros should reconstruct ~the same calorie total (protein/carbs @4kcal/g, fat @9kcal/g)
    const reconstructed =
      result.proteinGTarget * 4 + result.carbsGTarget * 4 + result.fatGTarget * 9;
    expect(reconstructed).toBeGreaterThan(result.calorieTarget - 15);
    expect(reconstructed).toBeLessThan(result.calorieTarget + 15);
  });

  it("applies a deficit for a lose-weight goal and never drops below the 1200 floor", () => {
    const result = calculateGoals({
      sex: "female",
      dateOfBirth: "1994-07-26",
      heightCm: 150,
      weightKg: 45,
      activityLevel: "sedentary",
      goalIntent: "lose",
      today: new Date("2026-07-26"),
    });
    expect(result.calorieTarget).toBeGreaterThanOrEqual(1200);
  });
});
