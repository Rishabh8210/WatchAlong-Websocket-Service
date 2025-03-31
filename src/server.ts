import express, { Request, Response } from 'express'
import { WebSocketServer } from 'ws';
import { PORT } from './configs/server-config'

// Express setup - Create an instance of an Express app
const app = express();

// Middleware to parse incomming requests
app.use(express.json());
app.use(express.urlencoded({extended: true}))

// Define a simple route for the root path ('/') 
app.get('/', (req:Request, res:Response) => {
    res.status(200).json({
        "message": "Hello User"
    })
})

// Start the HTTP server and listen on the defined PORT
const httpServer = app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
})

// Initilize a WebSocket server using the HTTP server
const wss = new WebSocketServer({server: httpServer});

// Listen for incomming WebSocket connections
wss.on('connection', function connection(ws){
    
    // Generate a random connection ID for each WebSocket client
    const connectionId = `${Math.random().toString(36).substring(7)}`;
    console.log(`Client connnected with connection-id - ${connectionId} is connected`);

    // Handle the WebSocket error
    ws.on('error', function error(){
        console.error("Something went wrong, Please try again later !")
    })

    // Handle incomming messages from WebSocket clients
    ws.on('message', function message(data, isBinary){

        // Broadcast the message to all connected clients
        wss.clients.forEach((client) => {
            client.send(data, {binary: isBinary});
        })
    })

    // Send a welcome message to the newly connected client
    ws.send("Hello, message from server");

    // Log when a client disconnects
    ws.on('close', function close(){
        console.log(`Client connected with connection-id - ${connectionId} is disconnected`);
    })
})