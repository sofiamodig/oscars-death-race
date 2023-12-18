import { LeaderboardUser } from "@/pages/leaderboard";
import React, { createContext, useState, ReactNode, useContext } from "react";

type LeaderboardContextType = {
  leaderboardData?: LeaderboardUser[];
  setLeaderboardData: (data: LeaderboardUser[]) => void;
  updateOwnUser: (
    userId: string,
    percentage: number,
    completed?: string | null
  ) => void;
};

export const LeaderboardContext = createContext<LeaderboardContextType>({
  leaderboardData: undefined,
  setLeaderboardData: () => {},
  updateOwnUser: () => {},
});

export const useLeaderboardContext = () => useContext(LeaderboardContext);

interface LeaderboardProviderProps {
  children: ReactNode;
}

export const LeaderboardProvider: React.FC<LeaderboardProviderProps> = ({
  children,
}) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>();

  const updateOwnUser = (
    userId: string,
    percentage: number,
    completed?: string | null
  ) => {
    const user = leaderboardData?.find((user) => user.id === userId);
    if (!user) {
      return;
    }

    user.percentage = percentage;
    if (completed) {
      user.completed = completed;
    }
  };

  return (
    <LeaderboardContext.Provider
      value={{
        leaderboardData,
        setLeaderboardData,
        updateOwnUser,
      }}
    >
      {children}
    </LeaderboardContext.Provider>
  );
};
