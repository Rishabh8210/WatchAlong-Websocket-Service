import express, { Request, Response } from 'express'
import { Data, WebSocket, WebSocketServer } from 'ws';
import { PORT } from './configs/server-config'
import { RoomClient, WebSocketMessage } from './types/websocket-types';

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


const rooms: RoomClient = {}

// Initilize a WebSocket server using the HTTP server
const wss = new WebSocketServer({server: httpServer});

// Listen for incomming WebSocket connections
wss.on('connection', function connection(ws:WebSocket){
    
    // Generate a random connection ID for each WebSocket client
    const connectionId = `${Math.random().toString(36).substring(7)}`;
    console.log(`Client connnected with connection-id - ${connectionId} is connected`);

    // Handle the WebSocket error
    ws.on('error', function error(){
        console.error("Something went wrong, Please try again later !")
    })

    // Handle incomming messages from WebSocket clients
    let receivedData:WebSocketMessage = null; 
    ws.on('message', function message(data: Data, isBinary: boolean){

        // Parse the received message (can be either string or binary)
        if(typeof data === "string"){
            receivedData = JSON.parse(data); // Parse string message
        } else if(data instanceof Buffer){
            const messageStr = data.toString('utf-8');
            receivedData = JSON.parse(messageStr); // Convert binary data to string and parse
        }

        // If the received data is valid
        if(receivedData){
            const { roomId, type } = receivedData;
            console.log(receivedData);
            // If the room doesn't exist, create it
            if(!rooms[roomId]){
                rooms[roomId] = new Set(); // Initialize the room with an empty Set to track clients
            }

            // Handle "room-joining" message type
            if(type === "room-joining"){
                rooms[roomId].add(ws); // Add the WebSocket client to the room
                console.log(`Client joined to room: ${roomId}`);

                const data = {
                    type: 'connection-established',
                    userId: connectionId,
                }
                ws.send(JSON.stringify(data))
            }

            // Handle "sending-message-to-room" message type
            if(type === 'sending-message-to-room'){

                // Broadcast the message to all connected clients in the room
                rooms[roomId].forEach((client) => {
                    if(client.readyState === WebSocket.OPEN){
                        
                        // Send the message to each client (binary or text based on the message type)
                        client.send(data, {binary: isBinary});
                    }
                })
            }

            if(type === 'new-message'){
                rooms[roomId].forEach((client) => {
                    if(client.readyState === WebSocket.OPEN){
                        
                        // Send the message to each client (binary or text based on the message type)
                        client.send(data, {binary: isBinary});
                    }
                })
            }
            if(type === 'connected-users-count'){
                const { roomId } = receivedData;
                rooms[roomId].forEach((client) => {
                    if(client.readyState === WebSocket.OPEN){
                        const data = {
                            type: 'connected-users-count',
                            count: rooms[roomId].size
                        }

                        client.send(JSON.stringify(data), {binary: isBinary});
                    }
                })
            }
        }
    })
    

    // Handle client disconnects
    ws.on('close', function close(){
        console.log(`Client connected with connection-id - ${connectionId} is disconnected`);

        // Iterate through all rooms and remove the client
        Object.keys(rooms).forEach((roomId) => {
            if(rooms[roomId].has(ws)){
                // Remove the WebSocket client from the room
                rooms[roomId].delete(ws);

                // Send the message to each client that user is disconnected
                rooms[roomId].forEach((client) => {
                    if(client.readyState === WebSocket.OPEN){
                        const data = {
                            type: 'connected-users-count',
                            count: rooms[roomId].size
                        }

                        client.send(JSON.stringify(data));
                    }
                })

                // If the room is now empty, delete the room
                if(rooms[roomId].size === 0){
                    delete rooms[roomId];
                    console.log(`Room ${roomId} is now empty and deleted.`);
                }
            }
        })
    })
})