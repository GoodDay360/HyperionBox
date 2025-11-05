export interface Configs {
    plugin_dir: string,
    storage_dir: string,
    cache_dir: string,
    hypersync_server: string,
    hypersync_token?: string,
    selected_source_id: string,
    download_worker_threads: number
}