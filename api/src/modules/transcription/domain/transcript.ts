/** A spoken word and when it is said, in seconds. */
export interface TimedWord {
  text: string;
  start: number;
  end: number;
}

/** Every word heard in a media file, in seconds of that file. */
export interface Transcript {
  language: string;
  words: TimedWord[];
}
