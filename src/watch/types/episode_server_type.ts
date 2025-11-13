export interface EpisodeServer {
    index: number,
    id: string,
    title: string,
    verify_url: string|null
} 

export type EpisodeServerData = Record<string, EpisodeServer[]>