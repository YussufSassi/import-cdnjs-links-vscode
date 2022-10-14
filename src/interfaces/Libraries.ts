export interface Libraries {
    results: Array<Library>;
    total: number;
    available: number
}
export interface Library {
    name: string;
    latest: string;
}