import { toEmbeddableUrl } from "@/lib/video-url";

const DIRECT_VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg"];

export function VideoPlayer({ videoUrl }: { videoUrl: string | null }) {
  if (!videoUrl) {
    return (
      <div className="mt-4 flex aspect-video items-center justify-center rounded-card border border-white/10 bg-navy-900/60 text-slate-500">
        لا يوجد فيديو لهذا الدرس بعد.
      </div>
    );
  }

  const isDirectVideoFile = DIRECT_VIDEO_EXTENSIONS.some((ext) =>
    videoUrl.toLowerCase().split("?")[0].endsWith(ext)
  );

  return (
    <div className="mt-4 aspect-video overflow-hidden rounded-card border border-white/10 bg-black">
      {isDirectVideoFile ? (
        <video src={videoUrl} controls className="h-full w-full">
          متصفحك لا يدعم تشغيل الفيديو.
        </video>
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
