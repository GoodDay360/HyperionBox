export interface RelevantContent {
    id: string,
    title: string,
    poster: string,
    banner: string,
    trailer?: {
        embed_url?: string,
        url?: string
    }
}

export interface ContentData {
    id: string,
    title?: string,
    poster?: string,
}

export interface Content {
    label: string,
    data: ContentData[]
}

export interface HomeData {
    relevant_content: RelevantContent[]; // Replace `any` with actual type if known
    content: Content[];
}