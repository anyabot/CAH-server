import { Socket, Server } from "socket.io";
import { stringGen, rooms, startGame } from "./game";

function newSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  function onConnection(socket: Socket) {
    console.log("New Socket connected: ", socket.id);


    
    async function joinRoom(message: {roomId: string, name: string}) {
      console.log("New User joining room: ", message.roomId);

      const connectedSockets = io.sockets.adapter.rooms.get(message.roomId);
      if (!connectedSockets) {
        socket.emit("room_join_error", {
          error: "No such room found",
        });
        return;
      }
      else if (rooms[message.roomId].status == "playing") {
        socket.emit("room_join_error", {
          error: "Room is already playing",
        });
        return;
      }

      if (
        (connectedSockets && connectedSockets.size >= 10)
      ) {
        socket.emit("room_join_error", {
          error: "Room is full, please choose another room to play!",
        });
      } else {
        socket.join(message.roomId);
        rooms[message.roomId].players[socket.id] = {
          name: message.name,
          ready: "waiting",
          time: 0,
          hand: [],
        };
        socket.emit("room_joined");
      }
    }
    socket.on("join_room", joinRoom);


    async function createRoom(message: {name: string}) {
      console.log("New User creating room");
  
      var roomName = stringGen(6);
      while (roomName in rooms) {
        roomName = stringGen(6);
      }
      await socket.join(roomName);
      rooms[roomName] = {
        players: {
          [socket.id]: {
            name: message.name,
            ready: "waiting",
            time: 0,
            hand: [],
          },
        },
      };
      console.log("Room Name: ", roomName);
      socket.emit("room_joined", roomName);
    }
    socket.on("create_room", createRoom);

    

    async function checkRoom(message: {roomId: string}) {
      const room = rooms[message.roomId]
      if (!room) {
        socket.emit("not_joined", {
          error: "No such room found",
        });
        return
      }
      if (socket.id in room.players) {
        io.to(message.roomId).emit("room_data", {
          players: room.players,
        });
      }
      else {
        socket.emit("not_joined", {
          error: "You have not joined this room",
        });
      }
    }
    socket.on("check_room", checkRoom);

    

    async function ready(message: {roomId: string}) {
      const room = rooms[message.roomId]
      if (!room) {
        socket.emit("not_joined", {
          error: "No such room found",
        });
        return
      }
      if (socket.id in room.players) {
        console.log(room.players)
        room.players[socket.id].ready = "ready";
        if (Object.keys(room.players).length >= 3 && Object.keys(room.players).every(pid => room.players[pid].ready == "ready")) {
          startGame(message.roomId);
          io.to(message.roomId).emit("game_start", {
            players: room.players,
            judge: room.judge,
            blackCard: room.blackCard
          });
        }
        else {
          io.to(message.roomId).emit("room_data", {
            players: room.players,
          });
        }
        return
      }
    }
    socket.on("ready", ready);

    

    async function leave(message: {roomId: string}) {
      console.log("leave", message)
      const room = rooms[message.roomId]
      if (room) {
        delete room.players[socket.id]
        io.to(message.roomId).emit("room_data", {
          players: room.players,
        });
      }
    }
    socket.on("leave", leave);

    

    async function submit(message: {roomId: string, picked: number[]}) {
      console.log("submit", message)
      const room = rooms[message.roomId]
      
      if (room) {
        const player = room.players[socket.id]
        if (player && socket.id != room.judge) {
          let temp_string = room.blackCard.text;
          message.picked.forEach((e) => (temp_string = temp_string.replace(/_/, player.hand[e])));
          room.players[socket.id].result = temp_string;
          room.players[socket.id].ready = "playing_ready";
          if (Object.keys(room.players).every(pid => room.players[pid].ready == "playing_ready" || pid == room.judge)) {
            Object.keys(room.players).forEach(p => room.players[p].ready = "waiting")
            io.to(message.roomId).emit("game_judge", {
              players: room.players,
            });
          }
          else {
            io.to(message.roomId).emit("room_data", {
              players: room.players,
            });
          }
        }
      }
    }
    socket.on("submit", submit);
    
    

    async function submit_winner(message: {roomId: string, winner: string}) {
      console.log("submit", message)
      const room = rooms[message.roomId]
      
      if (room) {
        const player = room.players[message.winner]
        if (player && socket.id == room.judge) {
          room.status = "waiting";
            io.to(message.roomId).emit("winner", {
              players: room.players,
              winner: player.name,
              result: player.result,
            })
          }
        }
    }
    socket.on("submit_winner", submit_winner);


    function onDisconnecting() {
      socket.rooms.forEach((room) => {
        if (rooms[room]) {
            delete rooms[room].players[socket.id]
            io.to(room).emit("room_data", {
              players: rooms[room].players,
            });
          }
        }
      );
      console.log(socket.rooms)
      console.log("connection left", socket.id);
    }
    socket.on("disconnecting", onDisconnecting);
  }
  io.on("connection", onConnection);

  
  return io;
};


export default newSocket
