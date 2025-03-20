import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError, BehaviorSubject } from 'rxjs';
import { CsvService } from './csv.service';
import { Game } from './types/game';

export interface GameParticipant {
  participant_id: string;
  champion_name: string;
  position: string;
  win: string;
  kills: number;
  deaths: number;
  assists: number;
  kda_ratio: number;
  kill_participation: number;
  [key: string]: any; // Pour les autres propriétés
}

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private gamesData = new BehaviorSubject<Game[]>([]);
  private rawData: any[] = [];
  private dataLoaded = false;

  constructor(private csvService: CsvService, private http: HttpClient) {}

  loadGames(): Observable<Game[]> {
    if (this.dataLoaded) {
      return this.gamesData.asObservable();
    }

    return this.http.get<Game[]>('assets/league-data.json').pipe(
      map((data) => {
        this.rawData = data;
        const games = this.processGameData(data);
        this.gamesData.next(games);
        this.dataLoaded = true;
        return games;
      }),
      catchError((error) => {
        console.error('Erreur lors du chargement des données de jeu:', error);
        return of([]);
      })
    );
  }

  getGameById(gameId: string): Observable<Game | undefined> {
    return this.gamesData.pipe(
      map((games) => games.find((game) => game.game_id === gameId))
    );
  }

  private processGameData(data: any[]): Game[] {
    const gameMap = new Map<string, Game>();

    data.forEach((item) => {
      const gameId = item.game_id.toString();

      if (!gameMap.has(gameId)) {
        gameMap.set(gameId, {
          game_id: gameId,
          start_utc: item.start_utc,
          duration: parseInt(item.duration),
          queue: item.queue,
          game_mode: item.game_mode,
          participants: [],
          win: false, // Initialisation
        });
      }

      const game = gameMap.get(gameId);
      if (game) {
        const participant = {
          participant_id: item.participant_id,
          champion_name: item.champion_name,
          position: item.position,
          win: item.win,
          kills: parseInt(item.kills),
          deaths: parseInt(item.deaths),
          assists: parseInt(item.assists),
          kda_ratio: this.calculateKDA(
            parseInt(item.kills),
            parseInt(item.deaths),
            parseInt(item.assists)
          ),
          kill_participation: parseFloat(item.kill_participation),
          damage_to_champ: parseInt(item.damage_to_champ),
          vision_score: parseInt(item.vision_score),
          ...item,
        };

        game.participants.push(participant);

        // Mettre à jour le statut win du jeu si au moins un participant a gagné
        if (participant.win === 'True') {
          game.win = true;
        }
      }
    });

    return Array.from(gameMap.values());
  }

  private calculateKDA(kills: number, deaths: number, assists: number): number {
    return deaths === 0 ? kills + assists : (kills + assists) / deaths;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
