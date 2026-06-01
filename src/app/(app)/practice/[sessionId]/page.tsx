import { RealtimeRoom } from "@/features/practice/realtime-room";
import { getPracticeSessionRecord } from "@/lib/practice/practice-session-store";

type PracticeSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function PracticeSessionPage({
  params,
}: PracticeSessionPageProps) {
  const { sessionId } = await params;
  const practiceSession = getPracticeSessionRecord(sessionId);

  return (
    <RealtimeRoom
      initialPracticeSession={practiceSession}
      sessionId={sessionId}
    />
  );
}
