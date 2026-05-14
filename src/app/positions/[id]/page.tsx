import { PositionDetailPage } from '@/components/pages/PositionDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PositionDetailPage positionId={id} />;
}
