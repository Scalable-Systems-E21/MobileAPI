import { Kafka } from 'kafkajs'
import { GeoBounds } from './GeoBounds'
import hbase from 'hbase'
import GeoJSON from 'geojson'

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS.split(',')
})
const hb = hbase({
    host: process.env.HBASE_HOST,
    port: process.env.HBASE_PORT
})

export async function getResult(bounds: GeoBounds) {
    const tname = process.env.HBASE_TABLE
    const table = hb.table(tname)

    return new Promise(resolve => {

        try {
            table.exists((error: any, success: boolean) => {
                if (success) {
                    table.scan({
                        maxVersions: 1, // Might need to change if we want to query back in time.
                        filter: filter(bounds, 0, Date.now())
                    }, (err: any, rows: any) => {
                        if (err !== null) {
                            // tslint:disable-next-line:no-console
                            console.log(err)
                        } else {

                            var shapes = []
                            var toPrint = 100
                            for (let i: number; i < rows.length; i++) {
                                let row = rows[i]
                                if (row['column'] === 'shape.geojson') {
                                    shapes.push(JSON.parse(row['$']))
                                }
                                if (toPrint > 0) {
                                    // tslint:disable-next-line:no-console
                                    console.log(row)
                                }
                                toPrint--;
                            }
                            if (shapes.length > 0) {
                                // tslint:disable-next-line:no-console
                                console.log('Shapes! :D')
                                resolve(featureCollection(shapes))
                            } else {
                                // tslint:disable-next-line:no-console
                                console.log('No shapes :(')
                                resolve(null)
                            }
                        }
                    })
                } else {
                    // tslint:disable-next-line:no-console
                    console.log(error)
                }
                resolve (null)
            })
        } catch (error) {
            // tslint:disable-next-line:no-console
            console.log(error)
        }
    })
}

function polygon(coordinates) {
            return {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        coordinates
                    ]
                },
            }
        }

function featureCollection(features) {
            return {
                "type": "FeatureCollection",
                "features": features
            }
        }

function filter(bounds: GeoBounds, timestampMin: number, timestampMax: number) {
            return {
                'op': 'MUST_PASS_ALL', 'type': 'FilterList', 'filters': [
                    latMinFilter(bounds.minLat),
                    latMaxFilter(bounds.maxLat),
                    lonMinFilter(bounds.minLon),
                    lonMaxFilter(bounds.maxLon),
                    //timestampMinFilter(timestampMin),
                    //timestampMaxFilter(timestampMax) // Unsure how to implement
                ]
            }
        }

// This could be generified a lot but shut up. Might actually do it if it doesn't quickly work out and I have to tweak a bunch.
function latMinFilter(latMin: number) {
            return { 'op': 'GREATER', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'lat', 'comparator': { 'value': latMin.toString(), 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
        }

function latMaxFilter(latMax: number) {
            return { 'op': 'LESS', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'lat', 'comparator': { 'value': latMax.toString(), 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
        }

function lonMinFilter(lonMin: number) {
            return { 'op': 'GREATER', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'long', 'comparator': { 'value': lonMin.toString(), 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
        }

function lonMaxFilter(lonMax: number) {
            return { 'op': 'LESS', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'long', 'comparator': { 'value': lonMax.toString(), 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
        }

function timestampMinFilter(min: number) {
            return {}
        }

function timestampMaxFilter(max: number) {
            return {}
        }

function geoBoundsToGeoJson(bounds: GeoBounds) {
            const geojson = {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "properties": {},
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [[[bounds.minLon, bounds.maxLat], [bounds.maxLon, bounds.maxLat], [bounds.maxLon, bounds.minLat], [bounds.minLon, bounds.minLat], [bounds.minLon, bounds.maxLat]]]
                        }
                    }]
            }
            return geojson
        }

// Returns request UUID.
export async function sendRequest(bounds: GeoBounds) {

        const producer = kafka.producer({
            maxInFlightRequests: 1,
            idempotent: true,
            transactionalId: process.env.KAFKA_PRODUCER_ID
        })
        await producer.connect()

        let request = geoBoundsToGeoJson(bounds)

        try {
            await producer.send({
                topic: process.env.KAFKA_TOPIC,
                messages: [
                    { key: process.env.KAFKA_KEY, value: JSON.stringify(request) },
                ]
            })

            await producer.disconnect()
        } catch (e) {
            await producer.disconnect()
            throw e
        }
    }