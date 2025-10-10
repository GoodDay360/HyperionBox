export interface CheckPluginUpdate {
    state: boolean,
    source?: string,
    pluginId?: string,
    pluginManifest?: {
        title: string, 
        manifest: string
    }
}