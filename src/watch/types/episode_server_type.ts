export interface EpisodeServer {
    index: number,
    id: string,
    title: string,
} 

export type EpisodeServerData = Record<string, EpisodeServer[]>