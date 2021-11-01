import { Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid';
import { LocationData } from './locationadata'
import { LocationRequest } from './request';

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS.split(',')
})
console.log(process.env.KAFKA_BROKERS)

export async function getResult (lon: number, lat: number) {
    // TODO: Round to some nearest?
    await new Promise(f => setTimeout(f, 1000))

    if (false) {
        return new LocationData(lon, lat, true)
    }else{
        return null;
    }
}

// Returns request UUID.
export async function sendRequest (lon: number, lat: number) {

    const producer = kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionalId: process.env.KAFKA_PRODUCER_ID
    })
    await producer.connect()

    let id = uuidv4()
    let request = new LocationRequest(id, lon, lat);

    try {
        await producer.send({
            topic: process.env.KAFKA_TOPIC,
            messages: [
                {key: process.env.KAFKA_KEY, value: JSON.stringify(request)},
            ]
        })

        await producer.disconnect()
        return id
    } catch (e) {
        await producer.disconnect()
        console.log("Error while sending request to kafka:", e)
        throw e
    }

}

// So the idea is to send in a request, and then wait for it to be returned into kafka? 
// If we have multiple of these mobile APIs running, how do we ensure the result is picked up by the one which is connected to a client? Persistant hashing? idk
// Might make most sense for the API to simply poll the DFS occasionally. Would that however be properly scalable? Would it even matter? Does anything even matter?
export async function awaitResult (uuid: string) {
    // Create read stream

    // Request file based on UUID

    // If not found, wait and try again

    // If found, return relavant data.
}