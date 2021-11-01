export class LocationRequest {
    id: string;
    longtitude: number;
    lattitude: number;

    constructor (id: string, lon: number, lat: number) {
        this.id = id;
        this.longtitude = lon;
        this.lattitude = lat;
    }
}