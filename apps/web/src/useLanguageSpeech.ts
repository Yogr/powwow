import { useCallback, useEffect, useRef, useState } from "react";

// SpeechRecognition is not yet included in every browser or TypeScript DOM lib.
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: { readonly transcript: string };
}

interface RecognitionEvent {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly [index: number]: RecognitionResult;
  };
}

interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type RecognitionConstructor = new () => BrowserRecognition;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const browser = window as SpeechWindow;
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

function hasSpeechSynthesis(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis?.speak === "function" &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}

function recognitionError(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access was not allowed. Enable it in your browser settings, or type your reply.";
    case "audio-capture":
      return "No microphone is available. Check your microphone connection, or type your reply.";
    case "network":
      return "The browser could not reach its speech service. Check your connection, or type your reply.";
    case "no-speech":
      return "No speech was heard. Try again when you are ready, or type your reply.";
    case "language-not-supported":
      return "Your browser does not support speech input for this language. You can still type your reply.";
    case "aborted":
      return "";
    default:
      return "Speech input stopped. Try again, or type your reply.";
  }
}

/** Browser voice input fills the draft only. Callers choose when to send it. */
export function useLanguageSpeech({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [recognitionSupported] = useState(() =>
    Boolean(recognitionConstructor()),
  );
  const [speechSupported] = useState(hasSpeechSynthesis);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const transcriptCallback = useRef(onTranscript);
  const recognition = useRef<BrowserRecognition | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackTimer = useRef<number | undefined>(undefined);
  const playbackVersion = useRef(0);

  useEffect(() => {
    transcriptCallback.current = onTranscript;
  }, [onTranscript]);

  const discardRecognition = useCallback(() => {
    const active = recognition.current;
    recognition.current = null;
    if (active) {
      active.onresult = null;
      active.onerror = null;
      active.onend = null;
      try {
        active.abort();
      } catch {
        /* The browser may have already stopped. */
      }
    }
    if (mounted.current) setListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    playbackVersion.current += 1;
    window.clearTimeout(playbackTimer.current);
    const active = utterance.current;
    utterance.current = null;
    if (active) {
      active.onend = null;
      active.onerror = null;
      active.onstart = null;
      if (hasSpeechSynthesis()) window.speechSynthesis.cancel();
    }
    if (mounted.current) setSpeaking(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    // Trigger asynchronous voice discovery before the first Listen click.
    if (hasSpeechSynthesis()) window.speechSynthesis.getVoices();
    return () => {
      mounted.current = false;
      discardRecognition();
      stopSpeaking();
    };
  }, [discardRecognition, stopSpeaking]);

  const startListening = useCallback(
    (locale: string, continuous = false) => {
      if (!mounted.current || recognition.current) return;
      const Constructor = recognitionConstructor();
      if (!Constructor) {
        setError(
          "Speech input is unavailable in this browser. You can still type your reply.",
        );
        return;
      }
      stopSpeaking();
      setError("");
      try {
        const active = new Constructor();
        recognition.current = active;
        active.lang = locale;
        active.continuous = continuous;
        active.interimResults = false;
        active.maxAlternatives = 1;
        const delivered = new Set<number>();
        active.onresult = (event) => {
          if (!mounted.current || recognition.current !== active) return;
          for (
            let index = event.resultIndex;
            index < event.results.length;
            index += 1
          ) {
            const result = event.results[index];
            if (!result.isFinal || delivered.has(index)) continue;
            delivered.add(index);
            const text = result[0]?.transcript.trim();
            if (text) transcriptCallback.current(text);
          }
        };
        active.onerror = (event) => {
          if (!mounted.current || recognition.current !== active) return;
          setError(recognitionError(event.error));
          discardRecognition();
        };
        active.onend = () => {
          if (!mounted.current || recognition.current !== active) return;
          recognition.current = null;
          active.onresult = null;
          active.onerror = null;
          active.onend = null;
          setListening(false);
        };
        // Includes the permission prompt so a second click cannot start twice.
        setListening(true);
        active.start();
      } catch {
        discardRecognition();
        setError(
          "Speech input could not start. Check microphone access, or type your reply.",
        );
      }
    },
    [discardRecognition, stopSpeaking],
  );

  const stopListening = useCallback(() => {
    const active = recognition.current;
    if (!active) return;
    // Unlike abort(), stop() lets the browser deliver the words captured so far.
    try {
      active.stop();
    } catch {
      discardRecognition();
    }
  }, [discardRecognition]);

  const speak = useCallback(
    (text: string, locale: string, slow = false) => {
      if (!mounted.current || !text.trim()) return;
      if (!hasSpeechSynthesis()) {
        setError(
          "Read aloud is unavailable in this browser. The lesson text is still available.",
        );
        return;
      }
      discardRecognition();
      stopSpeaking();
      setError("");
      try {
        const synth = window.speechSynthesis;
        const voices = synth.getVoices();
        const language = locale.toLowerCase().replaceAll("_", "-");
        const baseLanguage = language.split("-")[0];
        const voice =
          voices.find(
            (item) => item.lang.toLowerCase().replaceAll("_", "-") === language,
          ) ??
          voices.find(
            (item) =>
              item.lang.toLowerCase().replaceAll("_", "-").split("-")[0] ===
              baseLanguage,
          );
        if (voices.length && !voice) {
          setError(
            "A voice for this language is not installed. Add it in your device language settings to use read aloud.",
          );
          return;
        }
        // Short phrases plus pauses make Slow useful even with voices whose rate
        // range is limited. This uses the same installed voice, with no AI call.
        const chunks = slow
          ? text.match(/[^.!?。！？]+[.!?。！？]*/gu) || [text]
          : [text];
        const version = playbackVersion.current;
        let index = 0;
        const play = () => {
          try {
            if (!mounted.current || playbackVersion.current !== version) return;
            const next = new window.SpeechSynthesisUtterance(chunks[index++]);
            next.lang = locale;
            next.rate = slow ? 0.6 : 0.95;
            if (voice) next.voice = voice;
            utterance.current = next;
            next.onend = () => {
              if (!mounted.current || utterance.current !== next) return;
              window.clearTimeout(playbackTimer.current);
              if (index < chunks.length) {
                playbackTimer.current = window.setTimeout(play, slow ? 300 : 0);
                return;
              }
              utterance.current = null;
              setSpeaking(false);
            };
            next.onerror = (event) => {
              if (!mounted.current || utterance.current !== next) return;
              window.clearTimeout(playbackTimer.current);
              utterance.current = null;
              setSpeaking(false);
              if (event.error !== "canceled" && event.error !== "interrupted") {
                setError(
                  "Read aloud could not play. Check that a voice for this language is installed, then try again.",
                );
              }
            };
            setSpeaking(true);
            next.onstart = () => window.clearTimeout(playbackTimer.current);
            playbackTimer.current = window.setTimeout(() => {
              if (utterance.current !== next) return;
              stopSpeaking();
              setError(
                "Audio did not start. Check that a voice for this language is installed in your device settings.",
              );
            }, 5000);
            // Empty voice lists can mean discovery is pending; lang lets the browser
            // resolve its voice when speaking starts. Unsupported languages error above.
            synth.speak(next);
            if (synth.paused) synth.resume();
          } catch {
            stopSpeaking();
            setError(
              "Read aloud could not start. Try again, or continue with the lesson text.",
            );
          }
        };
        play();
      } catch {
        stopSpeaking();
        setError(
          "Read aloud could not start. Try again, or continue with the lesson text.",
        );
      }
    },
    [discardRecognition, stopSpeaking],
  );

  const clearError = useCallback(() => {
    setError("");
  }, []);

  return {
    recognitionSupported,
    listening,
    speechSupported,
    speaking,
    error,
    startListening,
    stopListening,
    abortListening: discardRecognition,
    speak,
    stopSpeaking,
    clearError,
  };
}
