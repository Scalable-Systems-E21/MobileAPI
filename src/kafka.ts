import { Kafka } from 'kafkajs'
import { GeoBounds } from './GeoBounds'
const GeoJSON = require('geojson')
const hbase = require('hbase')

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS.split(',')
})
const hb = hbase({
    host: process.env.HBASE_HOST,
    port: process.env.HBASE_PORT
})

export async function getResult (bounds: GeoBounds) {
    const tname = process.env.HBASE_TABLE
    const table = hb.table(tname)

    table.exists(function (error: any, success: boolean) {
        if (success) {
            const scanner = table.scan({
                maxVersions: 1, // Might need to change if we want to query back in time.
                filter: filter(bounds, 0, Date.now())
            })

            const rows: any[] = []
            var chunk

            scanner.on('readable', () => { 
                while(chunk = scanner.read())
                  rows.push(chunk)
              })
              scanner.on('error', (err: any) => {
                throw err
              })
              scanner.on('end', () =>
                console.info(rows)
              )

              return rows
        }else{
            throw 'Table ' + tname + ' not defined in HBASE.'
        }
    })
}

function filter (bounds: GeoBounds, timestampMin: number, timestampMax: number) {
    return {'op': 'MUST_PASS_ALL', 'type': 'FILTER_LIST', 'filters': [
        latMinFilter(bounds.minLat),
        latMaxFilter(bounds.maxLat),
        lonMinFilter(bounds.minLon),
        lonMaxFilter(bounds.maxLon),
        //timestampMinFilter(timestampMin),
        //timestampMaxFilter(timestampMax) // Unsure how to implement
    ]}
}

// This could be generified a lot but shut up. Might actually do it if it doesn't quickly work out and I have to tweak a bunch.
function latMinFilter (latMin: number) {
    return {'op': 'GREATER', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'lat', 'comparator': { 'value': latMin, 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
}

function latMaxFilter (latMax: number) {
    return {'op': 'LESS', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'lat', 'comparator': { 'value': latMax, 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
}

function lonMinFilter (lonMin: number) {
    return {'op': 'GREATER', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'long', 'comparator': { 'value': lonMin, 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
}

function lonMaxFilter (lonMax: number) {
    return {'op': 'LESS', 'type': 'SingleColumnValueFilter', 'family': 'shape', 'qualifier': 'long', 'comparator': { 'value': lonMax, 'type': 'BinaryComparator' }, 'filterIfColumnMissing': 'true' }
}
 
function timestampMinFilter (min: number) {
    return {}
}

function timestampMaxFilter (max: number) {
    return {}
}

function geoBoundsToGeoJson (bounds: GeoBounds) {
    const data = [{
          Polygon: [
              [ [bounds.maxLat, bounds.minLon], [bounds.maxLat, bounds.maxLon], [bounds.minLat, bounds.maxLon], [bounds.minLat, bounds.minLon] ]
          ],
        }];
    return GeoJSON.parse(data)
}

// Returns request UUID.
export async function sendRequest (bounds: GeoBounds) {

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
                {key: process.env.KAFKA_KEY, value: JSON.stringify(request)},
            ]
        })

        await producer.disconnect()
    } catch (e) {
        await producer.disconnect()
        throw e
    }
}