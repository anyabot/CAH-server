export interface Player {
  name: string;
  ready: "waiting" | "ready" | "playing" | "playing_ready";
  time: number;
  hand?: string[];
  result?: string
}

export interface Room {
  players: {[key:string]: Player};
  judge?: string;
  blackCard?: {
    text: string;
    pick: number;
  };
  status?: string;
}