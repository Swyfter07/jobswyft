import { useCallback } from "react";
import { useStorage } from "./use-storage";

export interface UseAppCounterReturn {
  count: number;
  motivation: string;
  increment: () => void;
  reset: () => void;
}

function getMotivation(count: number): string {
  if (count >= 50) return "Legendary Grind!";
  if (count >= 20) return "Unstoppable!";
  if (count >= 10) return "JobSwyft Pilot!";
  if (count >= 5) return "You're on fire!";
  if (count > 0) return "Great start! Keep going!";
  return "Let's get this bread!";
}

export function useAppCounter(): UseAppCounterReturn {
  const [count, setCount] = useStorage("job_jet_counter", 0);

  const increment = useCallback(() => {
    setCount(count + 1);
  }, [count, setCount]);

  const reset = useCallback(() => {
    setCount(0);
  }, [setCount]);

  return {
    count,
    motivation: getMotivation(count),
    increment,
    reset,
  };
}
