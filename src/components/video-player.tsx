import { useCallback, useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Loader2,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { proxied, type MediaSource } from "@/lib/media";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function fmt(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return h ? `${h}:${mm}:${String(s).padStart(2, "0")}` : `${mm}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({
  source,
  sources,
  onSelectSource,
  poster,
}: {
  source: MediaSource;
  sources: MediaSource[];
  onSelectSource: (s: MediaSource) => void;
  poster?: string | undefined;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [visible, setVisible] = useState(true);

  const src = proxied(source.url);

  /* ---------------- source loading ---------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setWaiting(true);
    let hls: Hls | null = null;

    const isHls = source.kind === "hls" || src.includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        // Buffer generously so playback stays smooth on weak networks.
        maxBufferLength: 60,
        maxMaxBufferLength: 180,
        backBufferLength: 30,
        fragLoadingMaxRetry: 8,
        manifestLoadingMaxRetry: 6,
        levelLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 800,
        startLevel: -1,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError();
        } else {
          setError("Playback failed. Doosri quality try karein.");
          setWaiting(false);
        }
      });
    } else {
      video.src = src;
    }

    video.playbackRate = speed;

    return () => {
      hls?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  /* ---------------- video events ---------------- */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTime = () => {
      setCurrent(video.currentTime);
      if (video.buffered.length) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onMeta = () => setDuration(video.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onWaiting = () => setWaiting(true);
    const onPlaying = () => {
      setWaiting(false);
      setError(null);
    };
    const onErr = () => {
      setWaiting(false);
      setError("Ye link load nahi hua. Doosri quality choose karein.");
    };
    const onVol = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("progress", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", onPlaying);
    video.addEventListener("error", onErr);
    video.addEventListener("volumechange", onVol);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("progress", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", onPlaying);
      video.removeEventListener("error", onErr);
      video.removeEventListener("volumechange", onVol);
    };
  }, []);

  useEffect(() => {
    const onFs = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* ---------------- controls ---------------- */
  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min((video.duration || 0) - 0.5, video.currentTime + delta),
    );
  }, []);

  const showControls = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3200);
  }, []);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [showControls]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") seekBy(10);
      else if (e.key === "ArrowLeft") seekBy(-10);
      else if (e.key === "f") void toggleFullscreen();
      else if (e.key === "m" && videoRef.current)
        videoRef.current.muted = !videoRef.current.muted;
      showControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggle, seekBy, showControls]);

  async function toggleFullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await el.requestFullscreen().catch(() => undefined);
  }

  function applySpeed(value: number) {
    setSpeed(value);
    if (videoRef.current) videoRef.current.playbackRate = value;
  }

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      onMouseMove={showControls}
      onTouchStart={showControls}
      className="group relative aspect-video w-full overflow-hidden rounded-xl bg-black select-none"
    >
      <video
        ref={videoRef}
        playsInline
        poster={poster}
        preload="auto"
        onClick={toggle}
        className="h-full w-full bg-black"
      />

      {waiting && !error && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 px-6 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{error}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {sources.map((s) => (
                <button
                  key={s.url}
                  onClick={() => onSelectSource(s)}
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!playing && !waiting && !error && (
        <button
          onClick={toggle}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center bg-black/25"
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
            <Play className="ml-0.5 h-7 w-7" />
          </span>
        </button>
      )}

      {/* controls */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200 ${
          visible || !playing ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="relative h-4 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            if (videoRef.current && duration)
              videoRef.current.currentTime = ratio * duration;
          }}
        >
          <div className="absolute top-1.5 h-1 w-full rounded-full bg-white/25" />
          <div
            className="absolute top-1.5 h-1 rounded-full bg-white/40"
            style={{ width: `${bufPct}%` }}
          />
          <div
            className="absolute top-1.5 h-1 rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-0.5 h-3 w-3 -translate-x-1/2 rounded-full bg-primary shadow"
            style={{ left: `${pct}%` }}
          />
        </div>

        <div className="mt-1 flex items-center gap-3 text-primary-foreground">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button onClick={() => seekBy(-10)} aria-label="Back 10s">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => seekBy(10)} aria-label="Forward 10s">
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => {
                if (videoRef.current)
                  videoRef.current.muted = !videoRef.current.muted;
              }}
            >
              {muted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (videoRef.current) {
                  videoRef.current.volume = v;
                  videoRef.current.muted = v === 0;
                }
              }}
              className="h-1 w-20 accent-primary"
              aria-label="Volume"
            />
          </div>

          <span className="ml-auto text-[11px] font-medium tabular-nums opacity-90">
            {fmt(current)} / {fmt(duration)}
          </span>

          <div className="relative">
            <button
              onClick={() => setMenu((m) => !m)}
              aria-label="Settings"
              className="flex items-center gap-1 text-[11px] font-semibold"
            >
              <Settings className="h-4 w-4" />
              {source.label}
            </button>
            {menu && (
              <div className="absolute bottom-8 right-0 w-44 rounded-lg border border-border bg-card/95 p-2 text-foreground shadow-xl backdrop-blur">
                <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Quality
                </p>
                {sources.map((s) => (
                  <button
                    key={s.url}
                    onClick={() => {
                      onSelectSource(s);
                      setMenu(false);
                    }}
                    className={`block w-full rounded-md px-2 py-1.5 text-left text-xs ${
                      s.url === source.url
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <p className="px-1 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Speed
                </p>
                <div className="flex flex-wrap gap-1">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => applySpeed(s)}
                      className={`rounded-md px-2 py-1 text-xs ${
                        s === speed
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => void toggleFullscreen()} aria-label="Fullscreen">
            {fullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
