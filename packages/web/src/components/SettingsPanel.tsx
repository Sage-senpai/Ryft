"use client";

import { useEffect, useState, useCallback } from "react";

interface RyftSettings {
  sfx: boolean;
  music: boolean;
  sfxVolume: number;
  musicVolume: number;
}

const STORAGE_KEY = "ryft-settings";

const DEFAULT_SETTINGS: RyftSettings = {
  sfx: true,
  music: true,
  sfxVolume: 80,
  musicVolume: 60,
};

function loadSettings(): RyftSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: RyftSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function broadcastSettings(s: RyftSettings) {
  window.dispatchEvent(
    new CustomEvent("ryft-settings", {
      detail: {
        sfx: s.sfx,
        music: s.music,
        sfxVolume: s.sfxVolume,
        musicVolume: s.musicVolume,
      },
    })
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState<RyftSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = useCallback(
    (patch: Partial<RyftSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveSettings(next);
        broadcastSettings(next);
        return next;
      });
    },
    []
  );

  return (
    <div className="ryft-settings-overlay" onClick={onClose}>
      <div
        className="ryft-settings-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ryft-settings-header">
          <h2 className="ryft-settings-title">Settings</h2>
          <button className="ryft-settings-close" onClick={onClose}>
            &#x2715;
          </button>
        </div>

        <div className="ryft-settings-body">
          {/* SFX Toggle */}
          <div className="ryft-settings-row">
            <label className="ryft-settings-label">Sound Effects</label>
            <button
              className={`ryft-settings-toggle ${settings.sfx ? "active" : ""}`}
              onClick={() => update({ sfx: !settings.sfx })}
            >
              {settings.sfx ? "ON" : "OFF"}
            </button>
          </div>

          {/* SFX Volume */}
          <div className="ryft-settings-row">
            <label className="ryft-settings-label">SFX Volume</label>
            <div className="ryft-settings-slider-wrap">
              <input
                type="range"
                min={0}
                max={100}
                value={settings.sfxVolume}
                onChange={(e) =>
                  update({ sfxVolume: Number(e.target.value) })
                }
                className="ryft-settings-slider"
                disabled={!settings.sfx}
              />
              <span className="ryft-settings-slider-val">
                {settings.sfxVolume}
              </span>
            </div>
          </div>

          {/* Music Toggle */}
          <div className="ryft-settings-row">
            <label className="ryft-settings-label">Music</label>
            <button
              className={`ryft-settings-toggle ${settings.music ? "active" : ""}`}
              onClick={() => update({ music: !settings.music })}
            >
              {settings.music ? "ON" : "OFF"}
            </button>
          </div>

          {/* Music Volume */}
          <div className="ryft-settings-row">
            <label className="ryft-settings-label">Music Volume</label>
            <div className="ryft-settings-slider-wrap">
              <input
                type="range"
                min={0}
                max={100}
                value={settings.musicVolume}
                onChange={(e) =>
                  update({ musicVolume: Number(e.target.value) })
                }
                className="ryft-settings-slider"
                disabled={!settings.music}
              />
              <span className="ryft-settings-slider-val">
                {settings.musicVolume}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
