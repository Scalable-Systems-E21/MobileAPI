import { Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid';
import { LocationData } from './locationadata'
import { LocationRequest } from './request';

const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS.split(',')
})

export async function getResult (uuid: string) {
    // TODO: Round to some nearest?
    await new Promise(f => setTimeout(f, 1000))

    if (false) {
        return new LocationData(10, 50, true)
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
        throw e
    }

}