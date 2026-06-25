'use client';

import * as React from 'react';

/* ============================================================
   Web Speech helpers — text-to-speech + speech recognition.
   Both feature-detect and degrade gracefully (SpeechRecognition
   is Chromium-only; synthesis is broadly supported).
   ============================================================ */

/** Speak Mari's replies aloud. */
export function useSpeech() {
  const [speaking, setSpeaking] = React.useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = React.useCallback(
    (text: string, locale?: string) => {
      if (!supported || !text) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        if (locale) u.lang = locale;
        const voices = window.speechSynthesis.getVoices();
        const pref = locale?.slice(0, 2).toLowerCase();
        const match = pref ? voices.find((v) => v.lang?.toLowerCase().startsWith(pref)) : undefined;
        if (match) u.voice = match;
        u.rate = 1.02;
        u.pitch = 1.05;
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u);
      } catch {
        setSpeaking(false);
      }
    },
    [supported],
  );

  const cancel = React.useCallback(() => {
    if (supported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
    }
    setSpeaking(false);
  }, [supported]);

  React.useEffect(
    () => () => {
      if (supported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          /* noop */
        }
      }
    },
    [supported],
  );

  return { speak, cancel, speaking, supported };
}

interface RecognitionOptions {
  locale?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
}

/** Listen to the user (dictation / meeting mode). */
export function useSpeechRecognition(options: RecognitionOptions = {}) {
  const SR =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : undefined;
  const supported = !!SR;
  const [listening, setListening] = React.useState(false);
  const recRef = React.useRef<any>(null);
  const optsRef = React.useRef(options);
  optsRef.current = options;

  const start = React.useCallback(() => {
    if (!supported) return;
    try {
      const rec = new SR();
      rec.lang = optsRef.current.locale ?? 'pt-BR';
      rec.continuous = optsRef.current.continuous ?? false;
      rec.interimResults = optsRef.current.interimResults ?? true;
      rec.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) final += r[0].transcript;
          else interim += r[0].transcript;
        }
        if (final) optsRef.current.onResult?.(final.trim(), true);
        else if (interim) optsRef.current.onResult?.(interim.trim(), false);
      };
      rec.onend = () => {
        setListening(false);
        optsRef.current.onEnd?.();
      };
      rec.onerror = () => setListening(false);
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [SR, supported]);

  const stop = React.useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  React.useEffect(
    () => () => {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    },
    [],
  );

  return { supported, listening, start, stop };
}
