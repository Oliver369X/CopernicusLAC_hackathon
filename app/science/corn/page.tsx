import ScienceCropClient from '@/components/science/science-crop-client';
import { CORN_SCIENCE_PROFILE } from '@/lib/science/crops/corn';

export default function ScienceCornPage() {
  return <ScienceCropClient profile={CORN_SCIENCE_PROFILE} />;
}
