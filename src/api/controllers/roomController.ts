import {
  ConnectedSocket,
  MessageBody,
  OnMessage,
  SocketController,
  SocketIO,
} from "socket-controllers";
import { Server, Socket } from "socket.io";

function stringGen(input_length: number):string{
  var result = '';
  const chars ='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (var i = 0; i < input_length; i++){
      result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

@SocketController()
export class RoomController {
  @OnMessage("join_room")
  public async joinGame(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log("New User joining room: ", message);

    const connectedSockets = io.sockets.adapter.rooms.get(message.roomId);
    if (!connectedSockets) {
      socket.emit("room_join_error", {
        error: "No such room found",
      });
    }
    const socketRooms = Array.from(socket.rooms.values()).filter(
      (r) => r !== socket.id
    );

    if (
      socketRooms.length > 0 ||
      (connectedSockets && connectedSockets.size === 10)
    ) {
      socket.emit("room_join_error", {
        error: "Room is full please, choose another room to play!",
      });
    } else {
      await socket.join(message.roomId);
      socket.emit("room_joined");
    }
  }
  @OnMessage("create_room")
  public async createRoom(
    @SocketIO() io: Server,
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: any
  ) {
    console.log("New User creating room");

    const roomName = stringGen(6);
    console.log("Room Name: ", roomName);
    socket.emit("room_joined", roomName);
    await socket.join(roomName);
  }
}
