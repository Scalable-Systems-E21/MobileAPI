import dotenv from 'dotenv'
dotenv.config({ path: './process.env' })
import express, { json } from "express"
import { getResult, sendRequest } from './kafka'

const app = express();
const port = 8080; // default port to listen

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

    try {
        const id = await sendRequest(lon, lat)
        res.status(202).send(id) // Accepted
    }catch (e) {
        res.status(500).send() // Internal server error
    }
} );

app.get("/poll", async (req, res) => {
    const uuid = req.query.id.toString()
    try {
        const data = await getResult(uuid)
        res.status(200).send(data) // OK
    } catch (e) {
        res.status(500).send() // Internal server error
    }
})

// start the Express server
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );