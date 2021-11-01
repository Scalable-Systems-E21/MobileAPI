import { Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid';
import { webhdfs } from 'webhdfs'


const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS.split(',')
})

const hdfs = webhdfs.createClient({

})

const producer = kafka.producer({
    maxInFlightRequests: 1,
    idempotent: true,
    transactionalId: process.env.KAFKA_PRODUCER_ID
})

exports = {
// Returns request UUID.
    sendRequest: async function (lon: number, lat: number) {
        let id = uuidv4()
        let request = new LocationRequest(id, lon, lat);

        try {
            await producer.send({
                topic: process.env.KAFKA_TOPIC,
                messages: [ // This might be the wrong way to insert data. Must test, but that requires setting up kafka and I am exceptionally lazy.
                    {key: process.env.KAFKA_KEY, value: JSON.stringify(request)},
                ]
            })
            return id
        } catch (e) {
            console.log("Error while sending request to kafka:", e)
            throw e
        }
    },

    // So the idea is to send in a request, and then wait for it to be returned into kafka? 
    // If we have multiple of these mobile APIs running, how do we ensure the result is picked up by the one which is connected to a client? Persistant hashing? idk
    // Might make most sense for the API to simply poll the DFS occasionally. Would that however be properly scalable? Would it even matter? Does anything even matter?
    awaitResponse: async function (uuid: string) {
        // Create read stream

        // Request file based on UUID

        // If not found, wait and try again

        // If found, return relavant data.
    }
}