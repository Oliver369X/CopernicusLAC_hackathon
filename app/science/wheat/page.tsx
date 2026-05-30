import ScienceCropClient from '@/components/science/science-crop-client';
import { WHEAT_SCIENCE_PROFILE } from '@/lib/science/crops/wheat';

export default function ScienceWheatPage() {
  return <ScienceCropClient profile={WHEAT_SCIENCE_PROFILE} />;
}
