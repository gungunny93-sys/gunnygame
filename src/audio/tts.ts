// Web Speech API 읽어주기 (ko-KR). 지원하지 않으면 조용히 무시.
export function ttsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function speak(text: string): void {
  try {
    if (!ttsSupported()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch { /* noop */ }
}

export function stopSpeaking(): void {
  try { if (ttsSupported()) window.speechSynthesis.cancel(); } catch { /* noop */ }
}
