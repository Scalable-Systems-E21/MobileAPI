import { randomInt } from "crypto";
import express, { json } from "express"

const app = express();
const port = 8080; // default port to listen

app.get("/", (req, res) => { // Some types of controllers need this for heartbeats.
    res.sendStatus(200);
})

// define a route handler for the default home page
app.get( "/info", ( req, res ) => {
    const lon = Number(req.query.longtitude)
    const lat = Number(req.query.lattitude)

    const data = new LocationData(lon, lat, randomInt(2) === 0 ? false : true);
    res.send(data);
} );

// start the Express server
app.listen( port, () => {
    // tslint:disable-next-line:no-console
    console.log( `server started at http://localhost:${ port }` );
} );