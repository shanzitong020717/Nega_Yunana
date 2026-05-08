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
import {
  decodePCM16Base64ToFloat32,
  encodeFloat32AudioToPCM16Base64,
} from "@/lib/audio/pcm";

type RealtimeRoomProps = {
  sessionId: string;
};

type BrowserAudioContextConstructor = typeof AudioContext;

type RealtimeWebRTCSessionResponse = {
  transport?: "webrtc";
  clientSecret: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  instructionsPreview: string;
};

type RealtimeRelaySessionResponse = {
  transport: "websocket_relay";
  relayUrl: string;
  relayToken: string;
  sessionId: string;
  expiresAt: string;
  model: string;
  instructionsPreview: string;
};

type RealtimeSessionResponse =
  | RealtimeWebRTCSessionResponse
  | RealtimeRelaySessionResponse;

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
const REALTIME_AUDIO_SAMPLE_RATE = 24_000;
const INPUT_AUDIO_BUFFER_SIZE = 4096;
const RELAY_READY_TIMEOUT_MS = 45_000;

function nextTurnId() {
  return `turn_${crypto.randomUUID()}`;
}

function isMockRealtimeCredential(clientSecret: string) {
  return clientSecret.startsWith("mock_realtime_client_secret_");
}

function isRelayRealtimeCredential(
  realtimeSession: RealtimeSessionResponse,
): realtimeSession is RealtimeRelaySessionResponse {
  return realtimeSession.transport === "websocket_relay";
}

function getBrowserAudioContext() {
  const browserGlobal = globalThis as typeof globalThis & {
    webkitAudioContext?: BrowserAudioContextConstructor;
  };

  return browserGlobal.AudioContext ?? browserGlobal.webkitAudioContext;
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
  const relayInputAudioContextRef = useRef<AudioContext | null>(null);
  const relayInputAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(
    null,
  );
  const relayInputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const relayOutputAudioContextRef = useRef<AudioContext | null>(null);
  const relayOutputTimeRef = useRef(0);
  const relaySocketRef = useRef<WebSocket | null>(null);
  const isMutedRef = useRef(false);
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
    relaySocketRef.current?.close();
    relaySocketRef.current = null;
    relayInputProcessorRef.current?.disconnect();
    relayInputProcessorRef.current = null;
    relayInputAudioSourceRef.current?.disconnect();
    relayInputAudioSourceRef.current = null;
    void relayInputAudioContextRef.current?.close();
    relayInputAudioContextRef.current = null;
    relayOutputTimeRef.current = 0;
    void relayOutputAudioContextRef.current?.close();
    relayOutputAudioContextRef.current = null;
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
      throw new Error("实时会话创建失败。");
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
    const audioDelta = event.delta;

    if (type === "response.audio.delta" && typeof audioDelta === "string") {
      playPCM16AudioDelta(audioDelta);
    }

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

  function parseRealtimeEvent(message: MessageEvent<string>) {
    try {
      return JSON.parse(message.data) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  function playPCM16AudioDelta(base64Audio: string) {
    const AudioContextConstructor = getBrowserAudioContext();

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext =
      relayOutputAudioContextRef.current ?? new AudioContextConstructor();
    relayOutputAudioContextRef.current = audioContext;

    const samples = decodePCM16Base64ToFloat32(base64Audio);
    const audioBuffer = audioContext.createBuffer(
      1,
      samples.length,
      REALTIME_AUDIO_SAMPLE_RATE,
    );
    audioBuffer.copyToChannel(samples, 0);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    const startAt = Math.max(audioContext.currentTime, relayOutputTimeRef.current);
    source.start(startAt);
    relayOutputTimeRef.current = startAt + audioBuffer.duration;
  }

  function sendRealtimeEvent(event: Record<string, unknown>) {
    const serializedEvent = JSON.stringify(event);
    const dataChannel = dataChannelRef.current;

    if (dataChannel?.readyState === "open") {
      dataChannel.send(serializedEvent);
      return;
    }

    const relaySocket = relaySocketRef.current;

    if (relaySocket?.readyState === WebSocket.OPEN) {
      relaySocket.send(serializedEvent);
    }
  }

  async function startRelayMicrophoneStreaming(stream: MediaStream) {
    const AudioContextConstructor = getBrowserAudioContext();

    if (!AudioContextConstructor) {
      throw new Error("当前浏览器无法初始化实时音频。");
    }

    const audioContext = new AudioContextConstructor();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(
      INPUT_AUDIO_BUFFER_SIZE,
      1,
      1,
    );

    processor.onaudioprocess = (event) => {
      const output = event.outputBuffer.getChannelData(0);
      output.fill(0);

      const relaySocket = relaySocketRef.current;

      if (
        !relaySocket ||
        relaySocket.readyState !== WebSocket.OPEN ||
        isMutedRef.current
      ) {
        return;
      }

      const audio = encodeFloat32AudioToPCM16Base64(
        event.inputBuffer.getChannelData(0),
        {
          inputSampleRate: audioContext.sampleRate,
          outputSampleRate: REALTIME_AUDIO_SAMPLE_RATE,
        },
      );

      relaySocket.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio,
        }),
      );
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
    relayInputAudioContextRef.current = audioContext;
    relayInputAudioSourceRef.current = source;
    relayInputProcessorRef.current = processor;
  }

  async function connectRealtimeWebSocketRelay(
    stream: MediaStream,
    realtimeSession: RealtimeRelaySessionResponse,
  ) {
    const relayUrl = new URL(realtimeSession.relayUrl);
    relayUrl.searchParams.set("token", realtimeSession.relayToken);

    const relaySocket = new WebSocket(relayUrl);
    relaySocketRef.current = relaySocket;

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeout = window.setTimeout(() => {
        settle(() => {
          reject(new Error("实时 Relay 连接超时。"));
        });
      }, RELAY_READY_TIMEOUT_MS);

      function settle(callback: () => void) {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeout);
        callback();
      }
      const startRelaySession = () => {
        setState("Listening");
        addSystemTurn(`实时 Relay 会话 ${realtimeSession.sessionId} 已连接。`);
        void startRelayMicrophoneStreaming(stream).catch(() => {
          addSystemTurn("实时音频初始化失败，请检查浏览器音频权限。");
        });
        sendRealtimeEvent({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            instructions:
              "Start the roleplay by asking one concise customer discovery question about smart glasses in an overseas business meeting.",
          },
        });
      };

      relaySocket.addEventListener("message", handleRealtimeEvent);
      relaySocket.addEventListener("message", (message) => {
        const event = parseRealtimeEvent(message);

        if (event?.type === "relay.ready") {
          settle(() => {
            startRelaySession();
            resolve();
          });
          return;
        }

        if (event?.type === "relay.error") {
          settle(() => {
            reject(new Error("实时 Relay 无法连接到模型服务。"));
          });
        }
      });
      relaySocket.addEventListener(
        "open",
        () => {
          addSystemTurn("实时 Relay 已连接，正在等待模型服务就绪。");
        },
        { once: true },
      );
      relaySocket.addEventListener(
        "error",
        () => {
          settle(() => {
            reject(
              new Error(
                "实时 Relay 连接失败，请确认当前网址已加入 Relay 白名单。",
              ),
            );
          });
        },
        { once: true },
      );
      relaySocket.addEventListener(
        "close",
        () => {
          settle(() => {
            reject(new Error("实时 Relay 连接已关闭。"));
          });
        },
        { once: true },
      );
    });
  }

  async function connectRealtimeWebRTC(
    stream: MediaStream,
    realtimeSession: RealtimeSessionResponse,
  ) {
    if (isRelayRealtimeCredential(realtimeSession)) {
      await connectRealtimeWebSocketRelay(stream, realtimeSession);
      return;
    }

    const PeerConnection = globalThis.RTCPeerConnection;

    if (
      isMockRealtimeCredential(realtimeSession.clientSecret) ||
      typeof PeerConnection === "undefined"
    ) {
      setState("Listening");
      addSystemTurn(`模拟实时会话 ${realtimeSession.sessionId} 已开始。`);
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
      sendRealtimeEvent({
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
      throw new Error("实时语音连接失败。");
    }

    await peerConnection.setRemoteDescription({
      type: "answer",
      sdp: await sdpResponse.text(),
    });
    setState("Listening");
    addSystemTurn(`实时语音会话 ${realtimeSession.sessionId} 已连接。`);
  }

  async function handleStart() {
    if (state === "Listening" || state === "Speaking" || state === "Muted") {
      return;
    }

    setState("Reconnecting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("Mic Permission Required");
        addSystemTurn("当前浏览器无法使用麦克风。");
        return;
      }

      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        setState("Mic Permission Required");
        addSystemTurn("开始语音练习需要麦克风权限。");
        return;
      }

      mediaStreamRef.current = stream;
      const realtimeSession = await requestRealtimeSession();
      await connectRealtimeWebRTC(stream, realtimeSession);
    } catch (error) {
      closeRealtimeConnection();
      setState("Connection Error");
      addSystemTurn(
        error instanceof Error
          ? error.message
          : "实时连接失败，请稍后重试。",
      );
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
      throw new Error("保存转写失败。");
    }
  }

  async function handleEnd() {
    closeRealtimeConnection();
    setIsMuted(false);
    setState("Session Ended");
    const turnsToSave = addSystemTurn("会话已结束，正在保存转写用于复盘。");

    try {
      await saveTranscript(turnsToSave);
      addSystemTurn("转写已保存，可用于复盘。");
    } catch {
      addSystemTurn("转写暂时无法保存，请稍后重试。");
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
      isMutedRef.current = nextMuted;
      return nextMuted;
    });
  }

  function handleCue(cue: SmartCue) {
    setState(cue === "Challenge Me" ? "Speaking" : "Thinking");
    sendRealtimeEvent({
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
    sendRealtimeEvent({
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
      },
    });
    addSystemTurn(cueResponses[cue]);
  }

  return (
    <>
      <audio ref={audioRef} autoPlay className="hidden" />
      <PageHeader
        eyebrow="实时练习室"
        title="实时会议练习"
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
