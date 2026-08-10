import { useEffect, useRef } from "react";
import Hls from "hls.js";

export function VideoPlayer({
  src,
  poster,
}: {
  src: string;
  poster?: string | undefined;
}) {

  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    const isHls = src.includes(".m3u8");
    let hls: Hls | null = null;

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else {
      video.src = src;
    }

    return () => {
      hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      poster={poster}
      className="aspect-video w-full rounded-xl bg-black"
    />
  );
}
