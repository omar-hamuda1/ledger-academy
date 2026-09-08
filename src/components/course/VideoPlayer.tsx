"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toEmbeddableUrl, videoKind, youTubeId } from "@/lib/video-url";

// Auto-tracks how much of a lesson video the student has watched: reports
// `watchedSec` to /api/progress (throttled, monotonic server-side) and, at
// ≥90% watched, marks the lesson complete without the button. Also resumes
// playback where they left off. Works for direct files (<video>) and YouTube
// (via the IFrame API); other embeds render untracked.

type YTPlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};
type YTNamespace = { Player: new (el: Element, opts: unknown) => YTPlayer };

let ytApiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  const w = window as unknown as {
    YT?: YTNamespace & { Player?: unknown };
    onYouTubeIframeAPIReady?: () => void;
  };
  if (w.YT?.Player) return Promise.resolve(w.YT as YTNamespace);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT as YTNamespace);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return ytApiPromise;
}

export function VideoPlayer({
  videoUrl,
  lessonId,
  initialSec = 0,
  initialCompleted = false,
}: {
  videoUrl: string | null;
  lessonId?: string;
  initialSec?: number;
  initialCompleted?: boolean;
}) {
  const router = useRouter();
  const kind = videoUrl ? videoKind(videoUrl) : "none";

  const lastSentAt = useRef(0);
  const highWater = useRef(Math.floor(initialSec));
  const doneReported = useRef(initialCompleted);

  const report = useCallback(
    (watchedSec: number, duration: number, force = false) => {
      if (!lessonId || !Number.isFinite(watchedSec) || watchedSec < 0) return;
      const sec = Math.floor(watchedSec);
      const complete = duration > 0 && sec / duration >= 0.9;
      const now = Date.now();
      if (!force && !complete && (now - lastSentAt.current < 12_000 || sec <= highWater.current)) {
        return;
      }
      lastSentAt.current = now;
      highWater.current = Math.max(highWater.current, sec);

      const payload: Record<string, unknown> = { lessonId, watchedSec: sec };
      const markingDone = complete && !doneReported.current;
      if (markingDone) payload.completed = true;

      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});

      if (markingDone) {
        doneReported.current = true;
        router.refresh();
      }
    },
    [lessonId, router],
  );

  // --- direct file ---
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (kind !== "file") return;
    const v = videoRef.current;
    if (!v) return;
    let seeked = false;
    const onMeta = () => {
      if (!seeked && !initialCompleted && initialSec > 10 && initialSec < v.duration - 20) {
        v.currentTime = initialSec;
      }
      seeked = true;
    };
    const onTime = () => report(v.currentTime, v.duration);
    const flush = () => report(v.currentTime, v.duration, true);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("pause", flush);
    v.addEventListener("ended", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("pause", flush);
      v.removeEventListener("ended", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [kind, report, initialSec, initialCompleted]);

  // --- youtube ---
  const ytRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (kind !== "youtube" || !videoUrl) return;
    const id = youTubeId(videoUrl);
    if (!id) return;

    let player: YTPlayer | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const stopPoll = () => {
      if (poll) clearInterval(poll);
      poll = null;
    };
    const startPoll = () => {
      if (poll) return;
      poll = setInterval(() => {
        if (player) report(player.getCurrentTime(), player.getDuration());
      }, 5000);
    };

    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytRef.current) return;
      player = new YT.Player(ytRef.current, {
        videoId: id,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: !initialCompleted && initialSec > 10 ? Math.floor(initialSec) : 0,
        },
        events: {
          onStateChange: (e: { data: number }) => {
            // YT.PlayerState: 1 playing, 2 paused, 0 ended
            if (e.data === 1) startPoll();
            else stopPoll();
            if ((e.data === 2 || e.data === 0) && player) {
              report(player.getCurrentTime(), player.getDuration(), true);
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      stopPoll();
      try {
        player?.destroy();
      } catch {
        /* already gone */
      }
    };
  }, [kind, videoUrl, report, initialSec, initialCompleted]);

  if (!videoUrl) {
    return (
      <div className="mt-4 flex aspect-video items-center justify-center rounded-card border border-white/10 bg-navy-900/60 text-slate-400">
        لا يوجد فيديو لهذا الدرس بعد.
      </div>
    );
  }

  return (
    <div className="mt-4 aspect-video overflow-hidden rounded-card border border-white/10 bg-black">
      {kind === "file" ? (
        <video ref={videoRef} src={videoUrl} controls playsInline className="h-full w-full">
          متصفحك لا يدعم تشغيل الفيديو.
        </video>
      ) : kind === "youtube" ? (
        <div ref={ytRef} className="h-full w-full" />
      ) : (
        <iframe
          src={toEmbeddableUrl(videoUrl)}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
