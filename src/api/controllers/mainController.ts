import {
  ConnectedSocket,
  OnConnect,
  SocketController,
  SocketIO,
} from "socket-controllers";
import { Socket, Server } from "socket.io";

@SocketController()
export class MainController {
  @OnConnect()
  public onConnection(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) {
    console.log("New Socket connected: ", socket.id);

    // socket.on("custom_event", (data: any) => {
    //   console.log("Data: ", data);
    // });
    
  }
  @OnDisconnecting()
  public onDisconnecting(
    @ConnectedSocket() socket: Socket,
    @SocketIO() io: Server
  ) { 
    Object.keys(socket.rooms).forEach(room => socket.to(room).emit("connection_left", socket.id));
  }
}
