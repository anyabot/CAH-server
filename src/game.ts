import { Room } from "./interface";
import axios from 'axios';
let cah = {}
let white: string[] = cah["white"]
let black: {
  text: string,
  pick: number
}[] = cah["black"]
axios.get("https://raw.githubusercontent.com/anyabot/CAH-server/temp/src/json/cah-all-compact.json")
.then(response => {
  cah = response.data
  white = cah["white"]
  black = cah["black"]})
import { shuffle } from 'fast-shuffle'

export function stringGen(input_length: number): string {
  var result = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (var i = 0; i < input_length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const rooms: {[key:string]: Room} = {};



export function startGame(roomId: string) {
  console.log(white, black)
  const room = rooms[roomId];
  const judge = Object.keys(room.players).reduce((old, newKey) => room.players[old].time > room.players[newKey].time ? old : newKey, Object.keys(room.players)[0])
  room.judge = judge;
  var whitedeck = shuffle(white);
  var blackdeck = shuffle(black);
  room.blackCard = blackdeck.pop();
  Object.keys(room.players).forEach(player => {
    const temp:string[] = []
    if (room.blackCard) {
      for (let i = 0; i < 8+ room.blackCard.pick - 1 ; i++) {
        let curr = whitedeck.pop()
        curr ? temp.push(curr) : null
      }
      room.players[player].hand = temp
      room.players[player].ready = "playing"
    }
  })
  room.status = "playing";
}