"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addCustomFood,
  addEntry,
  deleteEntry,
  getEntriesForDate,
  getGoalsForDate,
  getHistorySummary,
  getProfile,
  getRecentFoods,
  restoreEntry,
  searchFoods,
  sumMacros,
  updateEntryQuantity,
  type AddEntryInput,
} from "@/lib/data/repository";
import type { FoodItem, FoodLogEntry } from "@/types/nutrical";

export function useProfile() {
  return useQuery({ queryKey: ["profile"], queryFn: getProfile });
}

export function useGoalsForDate(date: string) {
  return useQuery({ queryKey: ["goals", date], queryFn: () => getGoalsForDate(date) });
}

export function useEntriesForDate(date: string) {
  return useQuery({ queryKey: ["entries", date], queryFn: () => getEntriesForDate(date) });
}

export function useRecentFoods(limit = 8) {
  return useQuery({ queryKey: ["recentFoods"], queryFn: () => getRecentFoods(limit) });
}

export function useSearchFoods(query: string) {
  return useQuery({
    queryKey: ["foodSearch", query],
    queryFn: () => searchFoods(query),
  });
}

export function useDailyTotals(date: string) {
  const { data: entries = [] } = useEntriesForDate(date);
  return sumMacros(entries);
}

export function useAddEntry(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddEntryInput) => addEntry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", date] });
      queryClient.invalidateQueries({ queryKey: ["recentFoods"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useUpdateEntryQuantity(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, quantity }: { entryId: string; quantity: number }) =>
      updateEntryQuantity(entryId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", date] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useDeleteEntry(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => deleteEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", date] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useHistorySummary(days: number) {
  return useQuery({ queryKey: ["history", days], queryFn: () => getHistorySummary(days) });
}

export function useAddCustomFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (food: Omit<FoodItem, "id" | "isCustom">) => addCustomFood(food),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodSearch"] });
    },
  });
}

export function useRestoreEntry(date: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: FoodLogEntry) => restoreEntry(entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", date] });
      queryClient.invalidateQueries({ queryKey: ["recentFoods"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}
