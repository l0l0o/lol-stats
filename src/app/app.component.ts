import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import gameDataJson from '../assets/league-data.json';
import { GameData } from '../types/gamedata.type';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>League of Legends Match Statistics</h1>
      <div class="stats-container" *ngFor="let gameData of gamesData">
        <div class="match-header">
          <h2>{{ gameData.queue }} - {{ gameData.game_mode }}</h2>
          <p>
            {{ formatDate(gameData.start_utc) }} -
            {{ formatDuration(gameData.duration) }}
          </p>
        </div>

        <div class="match-info">
          <h2>{{ gameData.champion_name }} - {{ gameData.position }}</h2>
          <p class="result" [class.win]="gameData.win === 'TRUE'">
            {{ gameData.win === 'TRUE' ? 'Victory' : 'Defeat' }}
          </p>
          <div class="kda">
            <span>{{ gameData.kills }}</span> /
            <span class="deaths">{{ gameData.deaths }}</span> /
            <span>{{ gameData.assists }}</span>
            <p>KDA: {{ gameData.kda_ratio.toFixed(2) }}</p>
            <p>
              Kill Participation:
              {{ (gameData.kill_participation * 100).toFixed(1) }}%
            </p>
          </div>
        </div>

        <div class="combat-stats">
          <div class="stat">
            <label>Damage to Champions:</label>
            <span>{{ gameData.damage_to_champ.toLocaleString() }}</span>
          </div>
          <div class="stat">
            <label>Total Damage:</label>
            <span>{{ gameData.damage_dealt.toLocaleString() }}</span>
          </div>
          <div class="stat">
            <label>Damage Taken:</label>
            <span>{{ gameData.damage_taken.toLocaleString() }}</span>
          </div>
          <div class="stat">
            <label>Vision Score:</label>
            <span>{{ gameData.vision_score }}</span>
          </div>
        </div>

        <div class="items">
          <h3>Items</h3>
          <div class="items-grid">
            <div>{{ gameData.item0 }}</div>
            <div>{{ gameData.item1 }}</div>
            <div>{{ gameData.item2 }}</div>
            <div>{{ gameData.item3 }}</div>
            <div>{{ gameData.item4 }}</div>
            <div>{{ gameData.item5 }}</div>
            <div>{{ gameData.item6 }}</div>
          </div>
        </div>

        <div class="ranked-stats">
          <div class="solo-queue">
            <h3>Solo/Duo</h3>
            <p>{{ gameData.solo_tier }} {{ gameData.solo_rank }}</p>
            <p>{{ gameData.solo_lp }} LP</p>
            <p>{{ gameData.solo_wins }}W {{ gameData.solo_losses }}L</p>
          </div>
        </div>

        <div class="mastery-info">
          <p>Mastery Level {{ gameData.mastery_level }}</p>
          <p>{{ gameData.mastery_points.toLocaleString() }} points</p>
        </div>

        <div class="team-objectives">
          <h3>Team Objectives</h3>
          <p>Dragons: {{ gameData.team_dragonKills }}</p>
          <p>Barons: {{ gameData.team_baronKills }}</p>
          <p>Towers: {{ gameData.team_towerKills }}</p>
          <p>Inhibitors: {{ gameData.team_inhibitorKills }}</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  gamesData: GameData[] = Array.isArray(gameDataJson)
    ? gameDataJson
    : [gameDataJson];

  constructor() {}

  ngOnInit() {
    console.log('AppComponent initialized');
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
