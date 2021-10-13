class LocationData {
    longtitude: number;
    lattitude: number;
    waterNearby: boolean;

    constructor (lon: number, lat: number, waterNearby: boolean) {
        this.longtitude = lon;
        this.lattitude = lat;
        this.waterNearby = waterNearby;
    }
}