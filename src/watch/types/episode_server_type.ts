export interface EpisodeServer {
    id: string,
    title: string,
} 

export type EpisodeServerData = Record<string, EpisodeServer[]>