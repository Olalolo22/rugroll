"use client";

import React, { useState, useEffect } from "react";
import { soundEngine } from "@/lib/audio";

export default function SoundToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(soundEngine.enabled);
  }, []);

  const handleToggle = () => {
    const next = soundEngine.toggle();
    setEnabled(next);
    if (next) soundEngine.playClick();
  };

  return (
    <button
      type="button"
      className={`sound-toggle-btn ${enabled ? "sound-on" : "sound-off"}`}
      onClick={handleToggle}
      title={enabled ? "Mute Game Audio" : "Enable Game Audio"}
      aria-label="Toggle game audio"
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
