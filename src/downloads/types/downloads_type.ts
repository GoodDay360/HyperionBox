

export interface Episode {
    error: boolean,
    done: boolean,
}

export interface GetDownload {
    source: string,
    id: string,
    title: string,
    poster: string,
    seasons: Record<number, Record<number, Episode>>, // Season Index -> Record<Episode Index, Episode>
    pause: boolean,
    max: number,
    finished: number,
}

export interface CurrentDownloadStatus {
    source: string,
    id: string,
    season_index: number,
    episode_index: number,
    current: number,
    total: number,
}