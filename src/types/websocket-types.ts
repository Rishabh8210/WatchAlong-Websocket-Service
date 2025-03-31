import { WebSocket } from "ws"

export interface MessageData {
    data: string
}

export interface JoinRoomMessage {
    type: 'room-joining'
    roomId: string
}

export interface MessageToRoom {
    type: 'sending-message-to-room',
    roomId: string,
    message: MessageData
}

export interface RoomClient {
    [key: string]: Set<WebSocket>
}
export interface RoomMessages {
    roomId: string,
    type:'new-message'
}

export type WebSocketMessage = JoinRoomMessage | MessageToRoom | RoomMessages | null