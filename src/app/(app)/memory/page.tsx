import type { Metadata } from "next";

import { MemoryCenterView } from "@/features/memory/memory-center-view";
import { listMemories } from "@/lib/memory/memory-store";

export const metadata: Metadata = {
  title: "我的记忆 | Rokid Coach",
};

export default function MemoryPage() {
  return <MemoryCenterView initialMemories={listMemories()} />;
}
