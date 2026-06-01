import { PageHeader } from "@/components/page-header";
import { personas } from "@/data/personas";
import { generatePracticeReview } from "@/lib/ai/review";
import { requireAuthContext } from "@/lib/auth/require-user";
import {
  ensurePracticeSessionRecord,
  getReviewRecordAsync,
} from "@/lib/practice/practice-session-store";
import { ReviewView } from "@/features/reviews/review-view";

type ReviewPageProps = {
  params: Promise<{
    reviewId: string;
  }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { reviewId } = await params;
  const authContext = await requireAuthContext();
  const storedReview = await getReviewRecordAsync(reviewId, {
    userId: authContext.profileId,
  });
  const fallbackSession = ensurePracticeSessionRecord("session_preview");
  const fallbackReview = storedReview
    ? null
    : await generatePracticeReview({
        practiceSession: fallbackSession,
        transcriptTurns: [],
        persona:
          personas.find((persona) => persona.id === fallbackSession.personaId) ??
          personas[0],
        mockMode: true,
      });
  const review = storedReview ?? fallbackReview!;

  return (
    <>
      <PageHeader
        eyebrow="复盘"
        title="练习复盘"
        description="Review meeting outcome, sentence upgrades, material coverage, and recommended next-session drills."
      />
      <ReviewView
        reviewId={reviewId}
        sessionId={storedReview?.sessionId ?? fallbackSession.id}
        review={review}
      />
    </>
  );
}
