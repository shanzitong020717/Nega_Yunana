import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  ConversationTranscriptPanel,
  type TranscriptTurn,
} from "@/features/practice/conversation-transcript-panel";

const turns: TranscriptTurn[] = [
  {
    id: "turn_1",
    speaker: "ai_customer",
    text: "What business problem are you trying to solve with smart glasses?",
    translationZh: "你想用智能眼镜解决什么业务问题？",
    timestamp: 0,
  },
  {
    id: "turn_2",
    speaker: "user",
    text: "We want to reduce language friction in meetings.",
    timestamp: 8,
  },
  {
    id: "turn_3",
    speaker: "ai_customer",
    text: "How would you measure success in a pilot?",
    translationZh: "你们会如何衡量试点是否成功？",
    timestamp: 16,
  },
];

const turnsWithSystemMessages: TranscriptTurn[] = [
  ...turns,
  {
    id: "turn_system",
    speaker: "system",
    text: "实时 Relay 已连接，正在等待模型服务就绪。",
    timestamp: 20,
  },
  {
    id: "turn_4",
    speaker: "ai_customer",
    text: "Could you define the product use case first?",
    timestamp: 24,
  },
];

const longConversationTurns: TranscriptTurn[] = [
  {
    id: "turn_1",
    speaker: "ai_customer",
    text: "First question about the use case.",
    timestamp: 0,
  },
  {
    id: "turn_2",
    speaker: "user",
    text: "First learner answer.",
    timestamp: 8,
  },
  {
    id: "turn_3",
    speaker: "ai_customer",
    text: "Second question about deployment.",
    timestamp: 16,
  },
  {
    id: "turn_4",
    speaker: "user",
    text: "Second learner answer.",
    timestamp: 24,
  },
  {
    id: "turn_5",
    speaker: "ai_customer",
    text: "Third question about ROI.",
    timestamp: 32,
  },
];

const turnsWithMalformedTranslation: TranscriptTurn[] = [
  {
    id: "turn_1",
    speaker: "ai_customer",
    text: "I understand you might want to chat about something different.",
    translationZh: '{ "translationZh":',
    timestamp: 0,
  },
];

describe("ConversationTranscriptPanel", () => {
  it("shows recent English transcript by default without Chinese translations", () => {
    render(<ConversationTranscriptPanel turns={turns} />);

    const panel = screen.getByRole("button", { name: /实时字幕/ });
    expect(within(panel).getByText("实时字幕")).toBeInTheDocument();
    expect(
      within(panel).getByText("How would you measure success in a pilot?"),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText("We want to reduce language friction in meetings."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("你们会如何衡量试点是否成功？"),
    ).not.toBeInTheDocument();
  });

  it("expands to full transcript with AI Chinese translation and user English", () => {
    render(<ConversationTranscriptPanel turns={turns} />);

    fireEvent.click(screen.getByRole("button", { name: /实时字幕/ }));

    expect(screen.getByRole("heading", { name: "完整字幕" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "折叠" })).toBeInTheDocument();
    expect(
      screen.getByText("What business problem are you trying to solve with smart glasses?"),
    ).toBeInTheDocument();
    expect(screen.getByText("你想用智能眼镜解决什么业务问题？")).toBeInTheDocument();
    expect(
      screen.getByText("We want to reduce language friction in meetings."),
    ).toBeInTheDocument();
  });

  it("stays expanded until the learner clicks collapse", () => {
    render(<ConversationTranscriptPanel turns={turns} />);

    fireEvent.click(screen.getByRole("button", { name: /实时字幕/ }));
    expect(screen.getByRole("heading", { name: "完整字幕" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "折叠" }));

    expect(screen.getByRole("button", { name: /实时字幕/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "完整字幕" })).not.toBeInTheDocument();
  });

  it("keeps system notices out of both subtitle modes", () => {
    render(<ConversationTranscriptPanel turns={turnsWithSystemMessages} />);

    expect(screen.queryByText("系统")).not.toBeInTheDocument();
    expect(
      screen.queryByText("实时 Relay 已连接，正在等待模型服务就绪。"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /实时字幕/ }));

    expect(screen.getByRole("heading", { name: "完整字幕" })).toBeInTheDocument();
    expect(screen.queryByText("系统")).not.toBeInTheDocument();
    expect(
      screen.queryByText("实时 Relay 已连接，正在等待模型服务就绪。"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Could you define the product use case first?"),
    ).toBeInTheDocument();
    expect(screen.queryByText("中文翻译生成中。")).not.toBeInTheDocument();
  });

  it("shows only the recent three conversation turns after the complete transcript is opened", () => {
    render(<ConversationTranscriptPanel turns={longConversationTurns} />);

    const collapsedPanel = screen.getByRole("button", { name: /实时字幕/ });
    expect(within(collapsedPanel).queryByText("First question about the use case.")).not.toBeInTheDocument();

    fireEvent.click(collapsedPanel);

    expect(screen.getByText("最近 3 轮")).toBeInTheDocument();
    expect(screen.queryByText("First question about the use case.")).not.toBeInTheDocument();
    expect(screen.queryByText("First learner answer.")).not.toBeInTheDocument();
    expect(screen.getByText("Second question about deployment.")).toBeInTheDocument();
    expect(screen.getByText("Second learner answer.")).toBeInTheDocument();
    expect(screen.getByText("Third question about ROI.")).toBeInTheDocument();
  });

  it("does not show malformed JSON fragments as Chinese translations", () => {
    render(<ConversationTranscriptPanel turns={turnsWithMalformedTranslation} />);

    fireEvent.click(screen.getByRole("button", { name: /实时字幕/ }));

    expect(screen.getByText("I understand you might want to chat about something different.")).toBeInTheDocument();
    expect(screen.queryByText('{ "translationZh":')).not.toBeInTheDocument();
  });
});
