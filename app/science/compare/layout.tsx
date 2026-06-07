import { CooperativeExperienceGuard } from '@/components/layout/cooperative-experience-guard';

export default function ScienceCompareLayout({ children }: { children: React.ReactNode }) {
  return <CooperativeExperienceGuard redirectTo="/science">{children}</CooperativeExperienceGuard>;
}
