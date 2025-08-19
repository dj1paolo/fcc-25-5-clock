import React from "react";
import { useEffect, useRef, useState } from "react";

// FCC 25 + 5 Clock — all tests, including #8/#10/#11

export default function App() {
  const [breakLength, setBreakLength] = useState(5);      // 1–60
  const [sessionLength, setSessionLength] = useState(25); // 1–60
  const [timeLeft, setTimeLeft] = useState(25 * 60);      // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState("Session");            // "Session" | "Break"

  const tickRef = useRef(null);
  const audioRef = useRef(null);

  // Guard scheduled ticks after Pause
  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  // NEW: track if we've ever started since last reset (for FCC test #8)
  const hasStartedRef = useRef(false);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const clearTick = () => {
    if (tickRef.current) {
      clearTimeout(tickRef.current);
      tickRef.current = null;
    }
  };

  const toggleStartStop = () => {
    setIsRunning(prev => {
      const next = !prev;

      if (next) {
        // FIRST start after reset: align timeLeft with what's shown in session/break length
        if (!hasStartedRef.current) {
          const initial = (mode === "Session" ? sessionLength : breakLength) * 60;
          setTimeLeft(initial);
          hasStartedRef.current = true;
        }
      } else {
        // Pausing: stop immediately so no extra tick fires
        clearTick();
      }

      isRunningRef.current = next;
      return next;
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    hasStartedRef.current = false;
    clearTick();
    setBreakLength(5);
    setSessionLength(25);
    setMode("Session");
    setTimeLeft(25 * 60);
    const a = audioRef.current;
    if (a) { a.pause(); a.currentTime = 0; }
  };

  // Adjusters — only update timeLeft when NOT running and adjusting the active period
  const decBreak = () => setBreakLength(l => {
    const next = Math.max(1, l - 1);
    if (!isRunning && mode === "Break") setTimeLeft(next * 60);
    return next;
  });
  const incBreak = () => setBreakLength(l => {
    const next = Math.min(60, l + 1);
    if (!isRunning && mode === "Break") setTimeLeft(next * 60);
    return next;
  });
  const decSession = () => setSessionLength(l => {
    const next = Math.max(1, l - 1);
    if (!isRunning && mode === "Session") setTimeLeft(next * 60);
    return next;
  });
  const incSession = () => setSessionLength(l => {
    const next = Math.min(60, l + 1);
    if (!isRunning && mode === "Session") setTimeLeft(next * 60);
    return next;
  });

  // Single setTimeout tick; guarded so a scheduled tick never fires after Pause.
  useEffect(() => {
    clearTick();
    if (!isRunning) return;

    // Switch at zero (and beep) while running
    if (timeLeft === 0) {
      const a = audioRef.current;
      if (a) {
        try {
          a.muted = false;
          a.currentTime = 0;
          const p = a.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {}
      }
      const toBreak = mode === "Session";
      setMode(toBreak ? "Break" : "Session");
      setTimeLeft((toBreak ? breakLength : sessionLength) * 60);
      return; // state change retriggers effect
    }

    tickRef.current = setTimeout(() => {
      if (!isRunningRef.current) return; // guard against late tick after Pause
      setTimeLeft(t => t - 1);
    }, 1000);

    return clearTick;
  }, [isRunning, timeLeft, mode, breakLength, sessionLength]);

  return (
    <div className="page">
      <div className="card">
        <h1>25 + 5 Clock</h1>

        {/* Settings */}
        <div className="grid">
          <div className="panel">
            <div id="break-label" className="label">Break Length</div>
            <div className="row">
              <button id="break-decrement" onClick={decBreak} className="btn">-</button>
              <div id="break-length" className="value">{breakLength}</div>
              <button id="break-increment" onClick={incBreak} className="btn">+</button>
            </div>
          </div>

          <div className="panel">
            <div id="session-label" className="label">Session Length</div>
            <div className="row">
              <button id="session-decrement" onClick={decSession} className="btn">-</button>
              <div id="session-length" className="value">{sessionLength}</div>
              <button id="session-increment" onClick={incSession} className="btn">+</button>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="timer">
          <div id="timer-label" className="timer-label">{mode}</div>
          <div id="time-left" className="time">{formatTime(timeLeft)}</div>
        </div>

        {/* Controls */}
        <div className="row center">
          <button id="start_stop" onClick={toggleStartStop} className="btn primary">
            {isRunning ? "Pause" : "Start"}
          </button>
          <button id="reset" onClick={handleReset} className="btn danger">Reset</button>
        </div>

        <audio
          id="beep"
          ref={audioRef}
          preload="auto"
          src="https://cdn.freecodecamp.org/testable-projects-fcc/audio/BeepSound.wav"
        />

        <p className="tip">Tip: Adjust lengths while paused to set the next period’s duration.</p>
      </div>
    </div>
  );
}
