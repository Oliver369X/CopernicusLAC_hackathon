import ScienceCropClient from '@/components/science/science-crop-client';
import { SOYBEAN_SCIENCE_PROFILE } from '@/lib/science/crops/soybean';

export default function ScienceSoybeanPage() {
  return <ScienceCropClient profile={SOYBEAN_SCIENCE_PROFILE} />;
}
