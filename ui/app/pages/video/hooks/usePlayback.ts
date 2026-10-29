import { useCallback, useEffect, useRef, useState } from "react";

import { playStart } from "../domain/play-start";
import type { VideoPreview } from "../domain/types";

type Playhead = { time: number; setTime: (time: number) => void };

/**
 * Play/pause over the preview video, with the playhead following it.
 * Pressing play before the preview exists asks for it and plays once ready.
 */
export const usePlayback = (
  preview: VideoPreview | null,
  request: () => void,
  playhead: Playhead,
  duration: number,
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setPlaying] = useState(false);
  const [isWaiting, setWaiting] = useState(false);
  const url = preview?.url ?? null;
  const { time, setTime } = playhead;
  const timeRef = useRef(time);
  timeRef.current = time;
  // The frame shown while paused; frozen during playback so it isn't refetched.
  const stillRef = useRef(time);
  if (!isPlaying) stillRef.current = time;

  useEffect(() => {
    if (isWaiting && url) setPlaying(true);
    if (url || preview?.status === "failed") setWaiting(false);
  }, [isWaiting, url, preview?.status]);

  useEffect(() => {
    if (!url) setPlaying(false);
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!isPlaying || !video) return;
    video.currentTime = playStart(timeRef.current, duration);
    video.play().catch(() => setPlaying(false));
    let frame = requestAnimationFrame(function follow() {
      setTime(video.currentTime);
      frame = requestAnimationFrame(follow);
    });
    return () => {
      cancelAnimationFrame(frame);
      video.pause();
    };
  }, [isPlaying, url, duration, setTime]);

  const toggle = useCallback(() => {
    if (isPlaying) return setPlaying(false);
    if (url) return setPlaying(true);
    setWaiting(true);
    request();
  }, [isPlaying, url, request]);

  const seek = useCallback(
    (to: number) => {
      setTime(to);
      if (isPlaying && videoRef.current) videoRef.current.currentTime = to;
    },
    [isPlaying, setTime],
  );

  const onEnded = useCallback(() => setPlaying(false), []);

  return {
    videoRef,
    url,
    isPlaying,
    isWaiting,
    stillTime: stillRef.current,
    toggle,
    seek,
    onEnded,
  };
};
