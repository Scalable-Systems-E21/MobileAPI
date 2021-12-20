export class GeoBounds {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;

    constructor (minLat: number, maxLat: number, minLon: number, maxLon: number) {
        this.minLat = minLat;
        this.maxLat = maxLat;
        this.minLon = minLon;
        this.maxLat = maxLon;
    }
}