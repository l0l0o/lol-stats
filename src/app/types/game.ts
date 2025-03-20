export interface GameParticipant {
  participant_id: string;
  champion_name: string;
  position: string;
  win: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  kda_ratio: number;
  kill_participation: number;
  gold_earned?: number;
  damage_taken?: number;
  damage_dealt?: number;
  damage_to_champ?: number;
  vision_score?: number;
  team_baronKills?: number;
  team_dragonKills?: number;
  team_towerKills?: number;
  team_inhibitorKills?: number;
  team_riftHeraldKills?: number;
  [key: string]: any;
}

export interface Game {
  game_id: string;
  start_utc: string;
  duration: number;
  queue: string;
  game_mode: string;
  participants: GameParticipant[];
  win: boolean;
}
