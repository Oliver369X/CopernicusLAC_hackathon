import ScienceCropClient from '@/components/science/science-crop-client';
import { COFFEE_SCIENCE_PROFILE } from '@/lib/science/crops/coffee';

export default function ScienceCoffeePage() {
  return <ScienceCropClient profile={COFFEE_SCIENCE_PROFILE} />;
}
