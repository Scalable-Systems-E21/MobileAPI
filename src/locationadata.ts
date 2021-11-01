export class LocationData {
    longtitude: number;
    lattitude: number;
    waterNearby: boolean;
    // Maybe implement some sort of polygon that outlines water areas?

    constructor (lon: number, lat: number, waterNearby: boolean) {
        this.longtitude = lon;
        this.lattitude = lat;
        this.waterNearby = waterNearby;
    }
}