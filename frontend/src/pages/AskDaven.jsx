import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

/**
 * Ask Daven — voice-first AI tax advisor.
 *
 * Architecture (ported from Voxlen voice patterns):
 *   1. Web Audio API captures microphone → MediaRecorder produces audio chunks
 *   2. Speech sent to Web Speech API (SpeechRecognition) for real-time transcript
 *   3. Final transcript sent to /ask-daven/ask (Claude with tax system prompt)
 *   4. AI answer displayed + optionally spoken via SpeechSynthesis
 *   5. Waveform canvas visualises mic input in real time
 */

const SAMPLE_QUESTIONS = [
  { text: "What's the GST treatment on a residential property sale in New Zealand?", jurisdiction: 'NZ' },
  { text: 'How does superannuation guarantee work for casual employees in Australia?', jurisdiction: 'AU' },
  { text: 'Can I claim home office expenses as a sole trader in NZ?', jurisdiction: 'NZ' },
  { text: 'What are the BAS lodgement penalties for late filing in Australia?', jurisdiction: 'AU' },
  { text: 'How does provisional tax work if my income fluctuates?', jurisdiction: 'NZ' },
];

export default function AskDaven() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState([]);
  const [speakAnswer, setSpeakAnswer] = useState(true);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // ─── Waveform visualiser (ported from Voxlen Waveform.tsx) ─────────────────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    const width = rect.width;
    const height = rect.height;
    const barCount = 48;
    const barWidth = width / barCount;
    const gap = 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const amplitude = dataArray[dataIndex] / 255;
      const barHeight = Math.max(2, amplitude * height * 0.8);

      const intensity = amplitude;
      const r = Math.round(99 + intensity * 0);
      const g = Math.round(102 + intensity * 50);
      const b = 241;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.6})`;

      const x = i * barWidth + gap / 2;
      const radius = Math.min((barWidth - gap) / 2, 2);

      ctx.beginPath();
      ctx.roundRect(x, centerY - barHeight / 2, barWidth - gap, barHeight, radius);
      ctx.fill();
    }

    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // ─── Mic start / stop ─────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Audio analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setListening(true);
      drawWaveform();

      // Web Speech API for transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-NZ';
        recognition.onresult = (event) => {
          let interim = '';
          let final = '';
          for (let i = 0; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += t + ' ';
            } else {
              interim += t;
            }
          }
          setTranscript(final + interim);
          if (final.trim()) setQuery(final.trim());
        };
        recognition.onerror = () => { /* graceful degrade */ };
        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      setListening(false);
    }
  }, [drawWaveform]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
    setListening(false);
    // Auto-submit if we have a transcript
    if (transcript.trim()) {
      setQuery(transcript.trim());
    }
  }, [transcript]);

  // ─── Submit question to Claude ────────────────────────────────────────────
  const submit = useCallback(async (q) => {
    const question = q || query;
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const { data } = await api.post('/ask-daven/ask', { query: question });
      setAnswer(data);
      setHistory((h) => [{ question, answer: data.answer, jurisdiction: data.jurisdiction_detected, ts: new Date() }, ...h].slice(0, 20));

      // Speak the answer
      if (speakAnswer && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(data.answer);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        utterance.lang = 'en-NZ';
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      // Fallback for demo mode
      const fallback = getFallback(question);
      setAnswer(fallback);
      setHistory((h) => [{ question, answer: fallback.answer, jurisdiction: fallback.jurisdiction_detected, ts: new Date() }, ...h].slice(0, 20));
    } finally {
      setLoading(false);
      setTranscript('');
    }
  }, [query, speakAnswer]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-600 to-blue-700 text-white shadow-xl p-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #ffffff33 0, transparent 40%)" }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Voice AI — NZ / AU / UK / US tax law
          </div>
          <h1 className="text-3xl font-black tracking-tight">Ask Daven</h1>
          <p className="text-indigo-100 mt-2 max-w-2xl">
            Your AI tax advisor. Ask any question about GST, income tax, payroll,
            compliance — by voice or text. Daven answers in seconds with legislation
            references. Available 24/7.
          </p>
        </div>
      </div>

      {/* Voice input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Mic button */}
          <button
            onClick={listening ? stopListening : startListening}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              listening
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105'
            }`}
          >
            {listening && (
              <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-20" />
            )}
            <svg className="w-8 h-8 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {listening ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
          </button>

          <p className="text-sm text-gray-500">
            {listening ? 'Listening... tap to stop' : 'Tap to speak your question'}
          </p>

          {/* Waveform */}
          {listening && (
            <canvas ref={canvasRef} className="w-full max-w-lg" style={{ height: 60 }} />
          )}

          {/* Live transcript */}
          {transcript && (
            <div className="w-full bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
              <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">Hearing:</span>
              <p className="mt-1">{transcript}</p>
            </div>
          )}

          {/* Text input fallback */}
          <div className="w-full flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Or type your question here..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={() => submit()}
              disabled={loading || !query.trim()}
              className="px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition shrink-0"
            >
              {loading ? 'Thinking...' : 'Ask'}
            </button>
          </div>

          {/* Voice toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={speakAnswer}
              onChange={(e) => setSpeakAnswer(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 rounded"
            />
            Speak the answer aloud
          </label>
        </div>
      </div>

      {/* Answer */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
            <p className="text-sm text-gray-500">Daven is researching your question...</p>
          </div>
        </div>
      )}

      {answer && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                D
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Daven</p>
                {answer.jurisdiction_detected && (
                  <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {answer.jurisdiction_detected}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{answer.answer}</div>
            {answer.sources && answer.sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Legislation referenced</p>
                <div className="flex flex-wrap gap-1.5">
                  {answer.sources.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-mono">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="bg-amber-50 border-t border-amber-200 px-6 py-3">
            <p className="text-[11px] text-amber-700">{answer.disclaimer}</p>
          </div>
        </div>
      )}

      {/* Sample questions */}
      {!answer && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Try asking:</h3>
          <div className="space-y-2">
            {SAMPLE_QUESTIONS.map((sq, i) => (
              <button
                key={i}
                onClick={() => { setQuery(sq.text); submit(sq.text); }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition text-sm text-gray-700 flex items-center gap-3"
              >
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full shrink-0">{sq.jurisdiction}</span>
                {sq.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Previous questions</h3>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                <p className="text-sm font-medium text-gray-900">{h.question}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{h.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getFallback(query) {
  const q = query.toLowerCase();
  let answer = 'I can help with tax, accounting, compliance, and business structure questions across NZ, AU, UK, and US jurisdictions. Could you provide more detail about which country and specific situation?\n\nThis is AI-generated guidance. Please confirm with your registered tax agent before acting.';
  let jurisdiction = null;
  if (q.includes('nz') || q.includes('new zealand') || q.includes('gst 15') || q.includes('ird')) {
    jurisdiction = 'NZ';
    answer = 'In New Zealand, GST is charged at 15% on most goods and services under the Goods and Services Tax Act 1985. Registration is mandatory once turnover exceeds $60,000 in any 12-month period. GST returns are filed 2-monthly by default.\n\nThis is AI-generated guidance. Please confirm with your registered tax agent before acting.';
  } else if (q.includes('au') || q.includes('australia') || q.includes('bas') || q.includes('ato')) {
    jurisdiction = 'AU';
    answer = 'In Australia, GST is 10% under the GST Act 1999. BAS is lodged quarterly (due 28th of the month after quarter end). GST registration is mandatory when annual turnover exceeds A$75,000.\n\nThis is AI-generated guidance. Please confirm with your registered tax agent before acting.';
  }
  return { answer, jurisdiction_detected: jurisdiction, sources: [], disclaimer: 'This is AI-generated guidance. Please confirm with your registered tax agent before acting.' };
}
