declare module 'node-webvtt' {
  const webvtt: {
    parse: (input: string, options?: { strict?: boolean; meta?: boolean }) => {
      valid: boolean;
      cues: Array<{
        identifier: string;
        start: number;
        end: number;
        text: string;
        styles: string;
      }>;
      errors?: any[];
      meta?: Record<string, string> | null;
    };
    compile: (input: any) => string;
    hls: {
      hlsSegmentPlaylist: (input: string, segmentDuration?: number) => string;
      hlsSegment: (
        input: string,
        segmentDuration?: number,
        startOffset?: number
      ) => Array<{ filename: string; content: string }>;
    };
  };
  export default webvtt;
}
