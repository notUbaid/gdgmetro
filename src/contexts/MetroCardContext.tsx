import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MetroCardContextType {
  hasMetroCard: boolean;
  setHasMetroCard: (value: boolean) => void;
  dailySpent: number;
  dailyCap: number;
  isCapReached: boolean;
  hasUnlimitedDayPass: boolean;
  setHasUnlimitedDayPass: (value: boolean) => void;
  addTripExpense: (amount: number) => void;
  resetDailySpend: () => void;
  getDiscountedFare: (fare: number) => number;
}

const MetroCardContext = createContext<MetroCardContextType | undefined>(undefined);

const getTodayDateKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const readMetroCardFromStorage = (): boolean => {
  try {
    return localStorage.getItem('hasMetroCard') === 'true';
  } catch {
    return false;
  }
};

const readDayPassFromStorage = (): boolean => {
  try {
    const stored = localStorage.getItem('ek_safar_day_pass');
    if (!stored) return false;
    const parsed = JSON.parse(stored);
    return parsed.date === getTodayDateKey() && parsed.active === true;
  } catch {
    return false;
  }
};

const readDailySpendFromStorage = (): number => {
  try {
    const stored = localStorage.getItem('ek_safar_daily_spend');
    if (!stored) return 0;
    const parsed = JSON.parse(stored);
    if (parsed.date === getTodayDateKey()) {
      return typeof parsed.amount === 'number' ? parsed.amount : 0;
    }
    return 0;
  } catch {
    return 0;
  }
};

export const MetroCardProvider = ({ children }: { children: ReactNode }) => {
  const [hasMetroCard, setHasMetroCard] = useState<boolean>(() => readMetroCardFromStorage());
  const [hasUnlimitedDayPass, setHasUnlimitedDayPassState] = useState<boolean>(() => readDayPassFromStorage());
  const [dailySpent, setDailySpent] = useState<number>(() => readDailySpendFromStorage());
  const dailyCap = 50; // ₹50 Daily Ceiling across Metro + BRTS + AMTS

  useEffect(() => {
    try {
      localStorage.setItem('hasMetroCard', hasMetroCard.toString());
    } catch {
      // Ignore storage failures
    }
  }, [hasMetroCard]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'ek_safar_day_pass',
        JSON.stringify({ date: getTodayDateKey(), active: hasUnlimitedDayPass })
      );
    } catch {
      // Ignore storage failures
    }
  }, [hasUnlimitedDayPass]);

  useEffect(() => {
    try {
      localStorage.setItem(
        'ek_safar_daily_spend',
        JSON.stringify({ date: getTodayDateKey(), amount: dailySpent })
      );
    } catch {
      // Ignore storage failures
    }
  }, [dailySpent]);

  const setHasUnlimitedDayPass = (value: boolean) => {
    setHasUnlimitedDayPassState(value);
    if (value) {
      setDailySpent(dailyCap);
    }
  };

  const addTripExpense = (amount: number) => {
    setDailySpent((prev) => Math.min(dailyCap, prev + Math.max(0, amount)));
  };

  const resetDailySpend = () => {
    setDailySpent(0);
    setHasUnlimitedDayPassState(false);
  };

  const isCapReached = hasUnlimitedDayPass || dailySpent >= dailyCap;

  const getDiscountedFare = (fare: number): number => {
    if (isCapReached) return 0;
    if (hasMetroCard) {
      const discounted = Math.round(fare * 0.9 * 10) / 10; // 10% RuPay NCMC contactless discount
      const remainingCap = Math.max(0, dailyCap - dailySpent);
      return Math.min(discounted, remainingCap);
    }
    return fare;
  };

  return (
    <MetroCardContext.Provider
      value={{
        hasMetroCard,
        setHasMetroCard,
        dailySpent,
        dailyCap,
        isCapReached,
        hasUnlimitedDayPass,
        setHasUnlimitedDayPass,
        addTripExpense,
        resetDailySpend,
        getDiscountedFare,
      }}
    >
      {children}
    </MetroCardContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMetroCard = () => {
  const context = useContext(MetroCardContext);
  if (!context) {
    throw new Error('useMetroCard must be used within a MetroCardProvider');
  }
  return context;
};
