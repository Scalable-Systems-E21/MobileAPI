import dotenv from 'dotenv'
dotenv.config({ path: './process.env' })
import express, { json } from "express"
import { getResult, sendRequest } from './kafka'
import { GeoBounds } from './GeoBounds'

const app = express();
const port = 8090; // default port to listen
const geoboundsMargin = 0.1; // About 11 kilometers.

app.get("/", (req, res) => { // Some types of controllers need this for heartbeats.
    res.sendStatus(200);
})

// define a route handler for the default home page
app.post( "/request", async (req, res) => {

    if (req.query.longtitude === undefined || req.query.lattitude === undefined) {
        res.status(400).send() // Bad request
    } 

    const lon = Number(req.query.longtitude)
    const lat = Number(req.query.lattitude)
    const geobounds = generateGeoBounds(lat, lon, geoboundsMargin);

    try {
        await sendRequest(geobounds)

        const data = await getResult(geobounds)
        if (data === null) {
            res.status(202).send() // Accepted
        }else{
            res.status(200).send(data) // OK
        }
    }catch (e) {
        res.status(500).send(e) // Internal server error
    }
} );

app.get("/poll", async (req, res) => {
    const uuid = req.query.id.toString()
    try {

        if (req.query.longtitude === undefined || req.query.lattitude === undefined) {
            res.status(400).send() // Bad request
        } 
    
        const lon = Number(req.query.longtitude)
        const lat = Number(req.query.lattitude)
        const geobounds = generateGeoBounds(lat, lon, geoboundsMargin);

        const data = await getResult(geobounds)
        res.status(200).send(data) // OK
    } catch (e) {
        res.status(500).send(e) // Internal server error
    }
})

function generateGeoBounds (lat: number, lon: number, margin: number) {
    return new GeoBounds(lat - margin, lat + margin, lon - margin, lon + margin)
}

// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );