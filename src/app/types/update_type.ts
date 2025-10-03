export interface Update {
    version: string;
    notes: string;
}

export interface CheckUpdate{
    state: boolean,
    version: string,
    notes: string
}