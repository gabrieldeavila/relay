import { useEffect, useState } from "react";

/** The second being previewed; stays inside the video when it gets shorter. */
export const usePlayhead = (duration: number) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (time >= duration) setTime(Math.max(0, duration - 0.01));
  }, [duration, time]);

  return { time, setTime };
};
