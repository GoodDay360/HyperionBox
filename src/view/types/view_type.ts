export interface ManifestData {
    id: string,
    title: string,
    poster: string,
    banner: string,
    description: string,

    meta_data: string[],

    trailer?: {
        embed_url?: string,
        url?: string
    },

    // Required: Season -> Episodes Page -> Episodes
    episode_list?: {
        index: number,
        id: string,
        title: string
    }[][][],
}

export interface LinkPlugin {
    plugin_id?: string,
    id?: string

}

export interface ViewData {
    manifest_data?: ManifestData,
    link_plugin?: LinkPlugin,
    current_watch_season_index?: number,
    current_watch_episode_index?: number
}