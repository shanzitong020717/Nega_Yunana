import { PracticeView } from "@/features/practice/practice-view";

type PracticePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PracticePage({ searchParams }: PracticePageProps) {
  return <PracticeView searchParams={(await searchParams) ?? {}} />;
}
