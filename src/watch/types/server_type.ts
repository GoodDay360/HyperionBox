export interface Timeline {
  start: number;
  end: number;
}

export interface SourceInfo {
  file: string;
  type: string; // maps from Rust's `_type` with serde rename
}

export interface TrackInfo {
  file: string;
  label?: string;
  kind: string;
}

export interface Config {
  host: string;
  origin: string;
  referer: string;
  playlist_base_url: string;
  segment_base_url: string;
}

export interface Data {
  intro?: Timeline;
  outro?: Timeline;
  sources: SourceInfo[];
  tracks: TrackInfo[];
}

export interface ServerData {
  data: Data;
  config: Config;
}
