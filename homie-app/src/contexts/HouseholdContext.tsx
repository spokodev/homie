import React, { createContext, useContext, ReactNode } from 'react';
import { useCurrentHousehold } from '@/hooks/useHouseholds';
import { useCurrentMember } from '@/hooks/useMembers';
import type { Household } from '@/hooks/useHouseholds';
import type { Member } from '@/hooks/useMembers';

interface HouseholdContextType {
  household: Household | null;
  member: Member | null;
  loading: boolean;
  error: Error | null;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

interface HouseholdProviderProps {
  children: ReactNode;
}

export function HouseholdProvider({ children }: HouseholdProviderProps) {
  const {
    data: household,
    isLoading: householdLoading,
    error: householdError,
  } = useCurrentHousehold();

  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useCurrentMember(household?.id);

  const value = {
    household: household || null,
    member: member || null,
    loading: householdLoading || memberLoading,
    error: (householdError || memberError) as Error | null,
  };

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}
