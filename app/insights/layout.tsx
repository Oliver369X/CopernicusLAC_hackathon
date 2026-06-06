import { CooperativeExperienceGuard } from '@/components/layout/cooperative-experience-guard';

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <CooperativeExperienceGuard redirectTo="/monitor">{children}</CooperativeExperienceGuard>;
}
