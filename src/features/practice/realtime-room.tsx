"use client";

import { useEffect, useRef, useState } from "react";

import { PageHeader } from "@/components/page-header";
import {
  LiveMeetingPanel,
  type RealtimeRoomState,
  type TranscriptTurn,
} from "@/features/practice/live-meeting-panel";
import { MaterialNavigator } from "@/features/practice/material-navigator";
import {
  SmartSupportPanel,
  type SmartCue,
} from "@/features/practice/smart-support-panel";

type RealtimeRoomProps = {
  sessionId: string;
};

type RealtimeSessionResponse = {
  clientSecret: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  instructionsPreview: string;
};

const initialTranscript: TranscriptTurn[] = [
  {
    id: "turn_1",
    speaker: "ai_customer",
    text: "What business problem are you trying to solve with smart glasses?",
    timestamp: 0,
  },
  {
    id: "turn_2",
    speaker: "user",
    text: "We want to help international teams communicate more smoothly during meetings.",
    timestamp: 8,
  },
];

const cueResponses: Record<SmartCue, string> = {
  "Better Phrase":
    "Try: The key value is reducing communication friction in real time.",
  "Use Material Point":
    "Use this point: Rokid supports real-time translated captions for multilingual conversations.",
  "Ask a Discovery Question":
    "Ask: What does a successful pilot look like for your team?",
  "Shorten Answer": "Try a shorter structure: acknowledge, position, ask.",
  "Translate This":
    "Chinese meaning: 核心价值是实时降低跨语言会议中的沟通阻力。",
  "Challenge Me":
    "Challenge: Why should we choose Rokid instead of a phone translation app?",
};

function nextTurnId() {
  return `turn_${crypto.randomUUID()}`;
}

function isMockRealtimeCredential(clientSecret: string) {
  return clientSecret.startsWith("mock_realtime_client_secret_");
}

function eventText(event: Record<string, unknown>) {
  const transcript = event.transcript;
  const text = event.text;

  if (typeof transcript === "string") {
    return transcript.trim();
  }

  if (typeof text === "string") {
    return text.trim();
  }

  return "";
}

export function RealtimeRoom({ sessionId }: RealtimeRoomProps) {
  const [state, setState] = useState<RealtimeRoomState>("Ready");
  const [transcriptTurns, setTranscriptTurns] = useState(initialTranscript);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const transcriptTurnsRef = useRef(initialTranscript);

  useEffect(() => {
    return () => {
      closeRealtimeConnection();
    };
  }, []);

  function appendTurn(
    turn: Omit<TranscriptTurn, "id" | "timestamp"> & {
      timestamp?: number;
    },
  ) {
    const currentTurns = transcriptTurnsRef.current;
    const nextTurns: TranscriptTurn[] = [
      ...currentTurns,
      {
        id: nextTurnId(),
        timestamp: turn.timestamp ?? currentTurns.length * 8,
        speaker: turn.speaker,
        text: turn.text,
      },
    ];

    transcriptTurnsRef.current = nextTurns;
    setTranscriptTurns(nextTurns);
    return nextTurns;
  }

  function addSystemTurn(text: string) {
    return appendTurn({
      speaker: "system",
      text,
    });
  }

  function closeRealtimeConnection() {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    mediaStreamRef.current = null;
  }

  async function requestRealtimeSession() {
    const response = await fetch("/api/realtime/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        practiceSessionId: sessionId,
        personaId: "technical_lead",
        mode: "customer_qa",
        trainingFocus: ["business value", "privacy objection"],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create realtime session.");
    }

    return (await response.json()) as RealtimeSessionResponse;
  }

  function handleRealtimeEvent(message: MessageEvent<string>) {
    let event: Record<string, unknown>;

    try {
      event = JSON.parse(message.data) as Record<string, unknown>;
    } catch {
      return;
    }

    const type = event.type;
    const text = eventText(event);

    if (!text) {
      return;
    }

    if (type === "conversation.item.input_audio_transcription.completed") {
      appendTurn({
        speaker: "user",
        text,
      });
      return;
    }

    if (
      type === "response.audio_transcript.done" ||
      type === "response.text.done"
    ) {
      appendTurn({
        speaker: "ai_customer",
        text,
      });
    }
  }

  function sendDataChannelEvent(event: Record<string, unknown>) {
    const dataChannel = dataChannelRef.current;

    if (!dataChannel || dataChannel.readyState !== "open") {
      return;
    }

    dataChannel.send(JSON.stringify(event));
  }

  async function connectRealtimeWebRTC(
    stream: MediaStream,
    realtimeSession: RealtimeSessionResponse,
  ) {
    const PeerConnection = globalThis.RTCPeerConnection;

    if (
      isMockRealtimeCredential(realtimeSession.clientSecret) ||
      typeof PeerConnection === "undefined"
    ) {
      setState("Listening");
      addSystemTurn(`Mock Realtime session ${realtimeSession.sessionId} started.`);
      return;
    }

    const peerConnection = new PeerConnection();
    peerConnectionRef.current = peerConnection;

    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;

      if (audioRef.current && remoteStream) {
        audioRef.current.srcObject = remoteStream;
        void audioRef.current.play().catch(() => undefined);
      }
    };

    stream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, stream);
    });

    const dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannelRef.current = dataChannel;
    dataChannel.addEventListener("message", handleRealtimeEvent);
    dataChannel.addEventListener("open", () => {
      sendDataChannelEvent({
        type: "response.create",
        response: {
          instructions:
            "Start the roleplay by asking one concise customer discovery question about smart glasses in an overseas business meeting.",
        },
      });
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const sdpResponse = await fetch(
      "https://api.openai.com/v1/realtime/calls",
      {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${realtimeSession.clientSecret}`,
          "Content-Type": "application/sdp",
        },
      },
    );

    if (!sdpResponse.ok) {
      throw new Error("Failed to connect realtime audio.");
    }

    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: await sdpResponse.text(),
    });
    setState("Listening");
    addSystemTurn(`Realtime voice session ${realtimeSession.sessionId} connected.`);
  }

  async function handleStart() {
    if (state === "Listening" || state === "Speaking" || state === "Muted") {
      return;
    }

    setState("Reconnecting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("Mic Permission Required");
        addSystemTurn("Microphone access is not available in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const realtimeSession = await requestRealtimeSession();
      await connectRealtimeWebRTC(stream, realtimeSession);
    } catch {
      closeRealtimeConnection();
      setState("Mic Permission Required");
      addSystemTurn("Microphone permission is required to start voice practice.");
    }
  }

  async function saveTranscript(turns: TranscriptTurn[]) {
    const response = await fetch(
      `/api/practice-sessions/${sessionId}/transcript`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turns: turns.map((turn) => ({
            speaker: turn.speaker,
            text: turn.text,
            timestamp: turn.timestamp,
            metadata: {
              source: "realtime_room",
            },
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to save transcript.");
    }
  }

  async function handleEnd() {
    closeRealtimeConnection();
    setIsMuted(false);
    setState("Session Ended");
    const turnsToSave = addSystemTurn("Session ended. Saving transcript for review.");

    try {
      await saveTranscript(turnsToSave);
      addSystemTurn("Transcript saved for review.");
    } catch {
      addSystemTurn("Transcript could not be saved. Please try again later.");
    }
  }

  function handleMute() {
    const stream = mediaStreamRef.current;

    setIsMuted((currentMuted) => {
      const nextMuted = !currentMuted;
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
      setState(nextMuted ? "Muted" : "Listening");
      return nextMuted;
    });
  }

  function handleCue(cue: SmartCue) {
    setState(cue === "Challenge Me" ? "Speaking" : "Thinking");
    sendDataChannelEvent({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Live coaching cue: ${cue}. ${cueResponses[cue]}`,
          },
        ],
      },
    });
    sendDataChannelEvent({
      type: "response.create",
    });
    addSystemTurn(cueResponses[cue]);
  }

  return (
    <>
      <audio ref={audioRef} autoPlay className="hidden" />
      <PageHeader
        eyebrow="Realtime room"
        title="Live meeting practice"
        description="Practice a customer conversation with material guidance, live transcript, and smart support controls."
      />
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.35fr_0.85fr]">
        <MaterialNavigator />
        <LiveMeetingPanel
          state={state}
          transcriptTurns={transcriptTurns}
          onStart={handleStart}
          onMute={handleMute}
          onEnd={handleEnd}
          isMuted={isMuted}
        />
        <SmartSupportPanel onCue={handleCue} />
      </section>
    </>
  );
}
