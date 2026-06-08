import { PlainExperienceGuard } from '@/components/layout/plain-experience-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <PlainExperienceGuard>{children}</PlainExperienceGuard>;
}
