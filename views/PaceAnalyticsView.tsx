import React from 'react';
import { PaceAnalytics } from '../components/admin/PaceAnalytics';
import { UserProfile, LocalRulesData, Language } from '../types';

interface Props {
  user: UserProfile | null;
  localRulesData: LocalRulesData;
  onBack: () => void;
  lang: Language;
}

export const PaceAnalyticsView: React.FC<Props> = (props) => {
  return <PaceAnalytics {...props} />;
};