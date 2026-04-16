"use client";

import { useRef } from "react";

/**
 * Isolated Client Component so the <video> DOM node is never touched by React
 * during hydration or client-side navigations.
 *
 * Key points:
 * - suppressHydrationWarning on both wrapper and <video>: React skips
 *   reconciling these nodes against the server-rendered HTML, preventing
 *   the video from restarting on initial hydration.
 * - useRef keeps a stable reference; React won't swap the DOM node on re-renders.
 * - Being a named, stable Client Component means React can keep it mounted
 *   across navigations without ever unmounting/remounting it.
 */
export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      suppressHydrationWarning
      style={{ position: "fixed", inset: 0, zIndex: -1, backgroundColor: "#f0f4f8" }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        suppressHydrationWarning
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      >
        <source src="/wallpaper.webm" type="video/webm" />
      </video>
    </div>
  );
}
