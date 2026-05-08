import { RealtimeRoom } from "@/features/practice/realtime-room";

type PracticeSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function PracticeSessionPage({
  params,
}: PracticeSessionPageProps) {
  const { sessionId } = await params;

  return <RealtimeRoom sessionId={sessionId} />;
}
