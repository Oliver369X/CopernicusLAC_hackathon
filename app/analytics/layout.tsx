import { CooperativeExperienceGuard } from '@/components/layout/cooperative-experience-guard';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <CooperativeExperienceGuard>{children}</CooperativeExperienceGuard>;
}
