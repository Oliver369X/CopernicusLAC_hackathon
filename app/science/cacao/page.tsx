import ScienceCropClient from '@/components/science/science-crop-client';
import { CACAO_SCIENCE_PROFILE } from '@/lib/science/crops/cacao';

export default function ScienceCacaoPage() {
  return <ScienceCropClient profile={CACAO_SCIENCE_PROFILE} />;
}
