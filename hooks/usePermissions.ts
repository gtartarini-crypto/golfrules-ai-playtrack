import { useMemo } from 'react';
import { ClubData, SubscriptionTier } from '../types';

// Added missing 'advanced' property to tierOrder to fix TypeScript error (Property 'advanced' is missing but required)
const tierOrder: Record<SubscriptionTier, number> = {
  base: 1,
  premium: 2,
  advanced: 3,
};

export interface Permissions {
  tier: SubscriptionTier;
  active: boolean;
  isPremium: boolean;
}

export const usePermissions = (clubData?: ClubData | null): Permissions => {
  return useMemo(() => {
    const sub = clubData?.subscription;
    const tier = sub?.tier ?? 'base';

    const expiry = sub?.expiryDate ? new Date(sub.expiryDate).getTime() : 0;
    const now = Date.now();
    const active = sub?.status === 'active' && expiry > now;

    return {
      tier,
      active,
      isPremium: active && tier === 'premium',
    };
  }, [clubData]);
};