"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type MediaVisualProps = {
  alt: string;
  className?: string;
  fit?: "contain" | "cover";
  posterSrc: string;
  priority?: boolean;
  sizes: string;
  videoSrc?: string;
};

export function MediaVisual({
  alt,
  className = "",
  fit = "contain",
  posterSrc,
  priority = false,
  sizes,
  videoSrc,
}: MediaVisualProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [canPlay, setCanPlay] = useState(priority);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || priority) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCanPlay(entry.isIntersecting),
      { rootMargin: "260px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [priority]);

  const mediaStyle = { objectFit: fit } as const;

  return (
    <div ref={rootRef} className={className}>
      <Image
        src={posterSrc}
        alt={alt}
        fill
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        sizes={sizes}
        style={mediaStyle}
      />
      {videoSrc && canPlay && !reducedMotion && !videoFailed ? (
        <video
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          poster={posterSrc}
          preload={priority ? "metadata" : "none"}
          onError={() => setVideoFailed(true)}
          style={mediaStyle}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
