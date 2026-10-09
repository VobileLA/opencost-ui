import { createContext, useContext, useState, useCallback } from "react";
import {
  initialAllocationFilters,
  type AllocationFilterValues,
} from "./scoped-views";

interface AllocationFiltersContextValue {
  filters: AllocationFilterValues;
  setFilters: (
    f:
      | AllocationFilterValues
      | ((prev: AllocationFilterValues) => AllocationFilterValues),
  ) => void;
}

const AllocationFiltersContext =
  createContext<AllocationFiltersContextValue | null>(null);

export function useAllocationFilters(
  useShared: boolean,
): [
  AllocationFilterValues,
  (
    f:
      | AllocationFilterValues
      | ((prev: AllocationFilterValues) => AllocationFilterValues),
  ) => void,
] {
  const ctx = useContext(AllocationFiltersContext);
  const [localFilters, setLocalFilters] = useState<AllocationFilterValues>(
    initialAllocationFilters,
  );

  if (useShared && ctx) {
    return [ctx.filters, ctx.setFilters];
  }
  return [localFilters, setLocalFilters];
}

interface AllocationFiltersProviderProps {
  children: React.ReactNode;
}

export function AllocationFiltersProvider({
  children,
}: AllocationFiltersProviderProps) {
  const [filters, setFilters] = useState<AllocationFilterValues>(
    initialAllocationFilters,
  );

  const setFiltersStable = useCallback(
    (
      updater:
        | AllocationFilterValues
        | ((prev: AllocationFilterValues) => AllocationFilterValues),
    ) => {
      setFilters((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  return (
    <AllocationFiltersContext.Provider
      value={{ filters, setFilters: setFiltersStable }}
    >
      {children}
    </AllocationFiltersContext.Provider>
  );
}
