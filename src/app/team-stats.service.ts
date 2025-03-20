import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CsvService } from './csv.service';

export interface TeamStats {
  name: string;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  totalGoldEarned: number;
  totalDamageTaken: number;
  totalDamageDealt: number;
  totalDamageToChamp: number;
  totalVisionScore: number;
  baronKills: number;
  dragonKills: number;
  towerKills: number;
  inhibitorKills: number;
  riftHeraldKills: number;
  win: boolean;
}

export interface PositionImpact {
  position: string;
  score: number;
  avgDamageToChamp: number;
  avgDamageTaken: number;
  scoreBreakdown: {
    kdaPercent: number;
    participationPercent: number;
    damagePercent: number;
    damageTakenPercent: number;
    visionPercent: number;
    goldPercent: number;
    teamObjectivesPercent: number;
    winBonusPercent: number;
  };
}

export interface ItemWinRate {
  itemName: string;
  totalOccurrences: number;
  winCount: number;
  winRate: number;
}

export interface GameAnalysisResult {
  winningFactors: {
    factor: string;
    averageRatio: number;
    significanceScore: number;
    winRate: number;
    gamesAnalyzed: number;
  }[];
  winningTeamStats: TeamStats;
  losingTeamStats: TeamStats;
  allGamesStats: {
    winningTeams: TeamStats[];
    losingTeams: TeamStats[];
  };
  positionImpacts: PositionImpact[];
  topItems: ItemWinRate[];
}

@Injectable({
  providedIn: 'root',
})
export class TeamStatsService {
  constructor(private csvService: CsvService) {}

  getTeamStats(): Observable<{
    winningTeam: TeamStats;
    losingTeam: TeamStats;
  }> {
    return this.csvService.getCsvData().pipe(
      map((data) => {
        // Filtrer les données pour un match spécifique (utiliser le premier match pour cet exemple)
        const matchId = data[0]?.game_id || '';
        const matchData = data.filter((row) => row.game_id === matchId);

        // Regrouper les données par équipe en utilisant le champ 'win'
        const winningTeamData = matchData.filter((row) => row.win === 'TRUE');
        const losingTeamData = matchData.filter((row) => row.win === 'FALSE');

        // Calculer les statistiques pour chaque équipe
        const winningTeam = this.calculateTeamStats(
          winningTeamData,
          'Équipe Gagnante',
          true
        );
        const losingTeam = this.calculateTeamStats(
          losingTeamData,
          'Équipe Perdante',
          false
        );

        return { winningTeam, losingTeam };
      })
    );
  }

  analyzeAllGames(): Observable<GameAnalysisResult> {
    return this.csvService.getCsvData().pipe(
      map((data) => {
        // Regrouper par match ID
        const matchIds = [...new Set(data.map((row) => row.game_id))];

        // Arrays pour stocker les équipes gagnantes et perdantes
        const winningTeams: TeamStats[] = [];
        const losingTeams: TeamStats[] = [];

        matchIds.forEach((matchId) => {
          const matchData = data.filter((row) => row.game_id === matchId);

          // Séparer les données par équipe en utilisant le champ 'win'
          const winningTeamData = matchData.filter((row) => row.win === 'TRUE');
          const losingTeamData = matchData.filter((row) => row.win === 'FALSE');

          // Si nous avons les deux équipes pour ce match
          if (winningTeamData.length > 0 && losingTeamData.length > 0) {
            const winningTeam = this.calculateTeamStats(
              winningTeamData,
              'Équipe Gagnante ' + matchId,
              true
            );
            const losingTeam = this.calculateTeamStats(
              losingTeamData,
              'Équipe Perdante ' + matchId,
              false
            );

            winningTeams.push(winningTeam);
            losingTeams.push(losingTeam);
          }
        });

        // Calculer les moyennes pour les équipes gagnantes et perdantes
        const avgWinningTeam = this.calculateAverageTeam(
          winningTeams,
          'Moyenne Équipes Gagnantes'
        );
        const avgLosingTeam = this.calculateAverageTeam(
          losingTeams,
          'Moyenne Équipes Perdantes'
        );

        // Analyser les facteurs de victoire
        const winningFactors = this.analyzeWinningFactors(
          winningTeams,
          losingTeams
        );

        // Calculer l'impact des positions
        const positionImpacts = this.calculatePositionImpacts(data);

        // Analyser les items et leur taux de victoire
        const topItems = this.analyzeItemWinRates(data);

        return {
          winningFactors,
          winningTeamStats: avgWinningTeam,
          losingTeamStats: avgLosingTeam,
          allGamesStats: {
            winningTeams,
            losingTeams,
          },
          positionImpacts,
          topItems,
        };
      })
    );
  }

  private calculatePositionImpacts(data: any[]): PositionImpact[] {
    // Définir les positions à analyser
    const positions = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT'];

    // Regrouper les joueurs par position
    const playersByPosition: Record<string, any[]> = {};

    positions.forEach((position) => {
      playersByPosition[position] = data.filter(
        (player) =>
          player.position && player.position.toUpperCase() === position
      );
    });

    // Préparer tous les joueurs pour le calcul des maxima
    const allPlayers = [...data];

    // Définir les poids pour chaque composante du score
    const weights = {
      kda: 15,
      killParticipation: 10,
      damageToChamp: 12,
      damageTaken: 8,
      visionScore: 10,
      goldEarned: 8,

      // Bonus de victoire - points supplémentaires attribués aux joueurs des équipes gagnantes
      winBonus: 10,

      // Poids pour les objectifs d'équipe
      dragonWeight: 5,
      baronWeight: 6,
      towerWeight: 7,
      inhibWeight: 6,
      heraldWeight: 3,
    };

    // Calculer le KDA pour chaque joueur
    allPlayers.forEach((player) => {
      const kills = parseInt(player.kills || '0', 10);
      const deaths = parseInt(player.deaths || '0', 10);
      const assists = parseInt(player.assists || '0', 10);

      // Éviter division par zéro
      player.kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;

      // Participation aux kills (à partir du pourcentage déjà dans les données)
      player.killParticipation = parseFloat(player.kill_participation || '0');

      // Convertir les données en nombres
      player.damageToChamp = parseInt(player.damage_to_champ || '0', 10);
      player.damageTaken = parseInt(player.damage_taken || '0', 10);
      player.visionScore = parseInt(player.vision_score || '0', 10);
      player.goldEarned = parseInt(player.gold_earned || '0', 10);

      // Données d'équipe
      player.team = {
        dragonKills: parseInt(player.team_dragonKills || '0', 10),
        baronKills: parseInt(player.team_baronKills || '0', 10),
        towerKills: parseInt(player.team_towerKills || '0', 10),
        inhibitorKills: parseInt(player.team_inhibitorKills || '0', 10),
        riftHeraldKills: parseInt(player.team_riftHeraldKills || '0', 10),
      };

      // État de victoire
      player.win = player.win === 'TRUE';
    });

    // Calculer les valeurs maximales pour normalisation
    const max = {
      kda: Math.max(...allPlayers.map((p) => p.kda || 0)),
      killParticipation: Math.max(
        ...allPlayers.map((p) => p.killParticipation || 0)
      ),
      damageToChamp: Math.max(...allPlayers.map((p) => p.damageToChamp || 0)),
      damageTaken: Math.max(...allPlayers.map((p) => p.damageTaken || 0)),
      visionScore: Math.max(...allPlayers.map((p) => p.visionScore || 0)),
      goldEarned: Math.max(...allPlayers.map((p) => p.goldEarned || 0)),
      dragonKills: Math.max(...allPlayers.map((p) => p.team?.dragonKills || 0)),
      baronKills: Math.max(...allPlayers.map((p) => p.team?.baronKills || 0)),
      towerKills: Math.max(...allPlayers.map((p) => p.team?.towerKills || 0)),
      inhibKills: Math.max(
        ...allPlayers.map((p) => p.team?.inhibitorKills || 0)
      ),
      heraldKills: Math.max(
        ...allPlayers.map((p) => p.team?.riftHeraldKills || 0)
      ),
    };

    // Fonction pour normaliser un score
    const normalizeScore = (
      value: number,
      maxValue: number,
      weight: number
    ) => {
      if (maxValue === 0) return 0;
      return (value / maxValue) * weight;
    };

    // Calculer le score pour chaque position
    const positionScores: PositionImpact[] = [];

    positions.forEach((position) => {
      const players = playersByPosition[position] || [];
      if (players.length === 0) return;

      let totalKdaScore = 0;
      let totalParticipationScore = 0;
      let totalDamageScore = 0;
      let totalDamageTakenScore = 0;
      let totalVisionScore = 0;
      let totalGoldScore = 0;
      let totalTeamObjectivesScore = 0;
      let totalWinBonus = 0;
      let totalScore = 0;

      // Statistiques brutes pour cette position
      let totalDamageToChamp = 0;
      let totalDamageTaken = 0;
      let playerCount = 0;

      players.forEach((player) => {
        playerCount++;

        // Accumuler les statistiques brutes
        totalDamageToChamp += player.damageToChamp;
        totalDamageTaken += player.damageTaken;

        // Scores individuels
        const kdaScore = normalizeScore(player.kda, max.kda, weights.kda);
        const participationScore = normalizeScore(
          player.killParticipation,
          max.killParticipation,
          weights.killParticipation
        );

        // Utiliser directement la valeur des dégâts pour le score
        // mais toujours normaliser pour la contribution au score total
        const damageScore = normalizeScore(
          player.damageToChamp,
          max.damageToChamp,
          weights.damageToChamp
        );

        // Aucune transformation pour les dégâts subis, juste normalisation
        const damageTakenScore = normalizeScore(
          player.damageTaken,
          max.damageTaken,
          weights.damageTaken
        );

        // Autres scores
        const visionScore = normalizeScore(
          player.visionScore,
          max.visionScore,
          weights.visionScore
        );
        const goldScore = normalizeScore(
          player.goldEarned,
          max.goldEarned,
          weights.goldEarned
        );

        // Scores d'objectifs d'équipe
        const dragonScore = normalizeScore(
          player.team.dragonKills,
          max.dragonKills,
          weights.dragonWeight
        );
        const baronScore = normalizeScore(
          player.team.baronKills,
          max.baronKills,
          weights.baronWeight
        );
        const towerScore = normalizeScore(
          player.team.towerKills,
          max.towerKills,
          weights.towerWeight
        );
        const inhibScore = normalizeScore(
          player.team.inhibitorKills,
          max.inhibKills,
          weights.inhibWeight
        );
        const heraldScore = normalizeScore(
          player.team.riftHeraldKills,
          max.heraldKills,
          weights.heraldWeight
        );

        // Bonus de victoire - points supplémentaires pour les joueurs des équipes gagnantes
        const winBonus = player.win ? weights.winBonus : 0;

        // Scores totaux par catégorie pour ce joueur
        const teamObjectivesScore =
          dragonScore + baronScore + towerScore + inhibScore + heraldScore;
        const playerScore =
          kdaScore +
          participationScore +
          damageScore +
          damageTakenScore +
          visionScore +
          goldScore +
          teamObjectivesScore +
          winBonus;

        // Accumuler les scores pour cette position
        totalKdaScore += kdaScore;
        totalParticipationScore += participationScore;
        totalDamageScore += damageScore;
        totalDamageTakenScore += damageTakenScore;
        totalVisionScore += visionScore;
        totalGoldScore += goldScore;
        totalTeamObjectivesScore += teamObjectivesScore;
        totalWinBonus += winBonus;
        totalScore += playerScore;
      });

      // Calculer la moyenne pour cette position
      const averageScore = totalScore / playerCount;

      // Calculer les moyennes des statistiques brutes
      const avgDamageToChamp = Math.round(totalDamageToChamp / playerCount);
      const avgDamageTaken = Math.round(totalDamageTaken / playerCount);

      // Calculer les pourcentages de contribution au score
      const scoreBreakdown = {
        kdaPercent: (totalKdaScore / totalScore) * 100,
        participationPercent: (totalParticipationScore / totalScore) * 100,
        damagePercent: (totalDamageScore / totalScore) * 100,
        damageTakenPercent: (totalDamageTakenScore / totalScore) * 100,
        visionPercent: (totalVisionScore / totalScore) * 100,
        goldPercent: (totalGoldScore / totalScore) * 100,
        teamObjectivesPercent: (totalTeamObjectivesScore / totalScore) * 100,
        winBonusPercent: (totalWinBonus / totalScore) * 100,
      };

      positionScores.push({
        position,
        score: averageScore,
        // Ajouter les statistiques brutes
        avgDamageToChamp,
        avgDamageTaken,
        scoreBreakdown: {
          kdaPercent: parseFloat(scoreBreakdown.kdaPercent.toFixed(1)),
          participationPercent: parseFloat(
            scoreBreakdown.participationPercent.toFixed(1)
          ),
          damagePercent: parseFloat(scoreBreakdown.damagePercent.toFixed(1)),
          damageTakenPercent: parseFloat(
            scoreBreakdown.damageTakenPercent.toFixed(1)
          ),
          visionPercent: parseFloat(scoreBreakdown.visionPercent.toFixed(1)),
          goldPercent: parseFloat(scoreBreakdown.goldPercent.toFixed(1)),
          teamObjectivesPercent: parseFloat(
            scoreBreakdown.teamObjectivesPercent.toFixed(1)
          ),
          winBonusPercent: parseFloat(
            scoreBreakdown.winBonusPercent.toFixed(1)
          ),
        },
      });
    });

    // Trier par score décroissant
    return positionScores.sort((a, b) => b.score - a.score);
  }

  private calculateTeamStats(
    teamData: any[],
    name: string,
    win: boolean
  ): TeamStats {
    const stats: TeamStats = {
      name,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      totalGoldEarned: 0,
      totalDamageTaken: 0,
      totalDamageDealt: 0,
      totalDamageToChamp: 0,
      totalVisionScore: 0,
      baronKills: 0,
      dragonKills: 0,
      towerKills: 0,
      inhibitorKills: 0,
      riftHeraldKills: 0,
      win,
    };

    // Parcourir les joueurs de l'équipe et additionner leurs statistiques
    teamData.forEach((player) => {
      stats.totalKills += parseInt(player.kills || '0', 10);
      stats.totalDeaths += parseInt(player.deaths || '0', 10);
      stats.totalAssists += parseInt(player.assists || '0', 10);
      stats.totalGoldEarned += parseInt(player.gold_earned || '0', 10);
      stats.totalDamageTaken += parseInt(player.damage_taken || '0', 10);
      stats.totalDamageDealt += parseInt(player.damage_dealt || '0', 10);
      stats.totalDamageToChamp += parseInt(player.damage_to_champ || '0', 10);
      stats.totalVisionScore += parseInt(player.vision_score || '0', 10);
    });

    // Les objectifs sont généralement comptés au niveau de l'équipe
    if (teamData.length > 0) {
      stats.baronKills = parseInt(teamData[0].team_baronKills || '0', 10);
      stats.dragonKills = parseInt(teamData[0].team_dragonKills || '0', 10);
      stats.towerKills = parseInt(teamData[0].team_towerKills || '0', 10);
      stats.inhibitorKills = parseInt(
        teamData[0].team_inhibitorKills || '0',
        10
      );
      stats.riftHeraldKills = parseInt(
        teamData[0].team_riftHeraldKills || '0',
        10
      );
    }

    return stats;
  }

  private calculateAverageTeam(teams: TeamStats[], name: string): TeamStats {
    if (teams.length === 0) {
      return this.getEmptyTeamStats(name, true);
    }

    const avgTeam = this.getEmptyTeamStats(name, teams[0].win);

    teams.forEach((team) => {
      avgTeam.totalKills += team.totalKills;
      avgTeam.totalDeaths += team.totalDeaths;
      avgTeam.totalAssists += team.totalAssists;
      avgTeam.totalGoldEarned += team.totalGoldEarned;
      avgTeam.totalDamageTaken += team.totalDamageTaken;
      avgTeam.totalDamageDealt += team.totalDamageDealt;
      avgTeam.totalDamageToChamp += team.totalDamageToChamp;
      avgTeam.totalVisionScore += team.totalVisionScore;
      avgTeam.baronKills += team.baronKills;
      avgTeam.dragonKills += team.dragonKills;
      avgTeam.towerKills += team.towerKills;
      avgTeam.inhibitorKills += team.inhibitorKills;
      avgTeam.riftHeraldKills += team.riftHeraldKills;
    });

    // Calculer les moyennes
    const count = teams.length;
    avgTeam.totalKills = Math.round(avgTeam.totalKills / count);
    avgTeam.totalDeaths = Math.round(avgTeam.totalDeaths / count);
    avgTeam.totalAssists = Math.round(avgTeam.totalAssists / count);
    avgTeam.totalGoldEarned = Math.round(avgTeam.totalGoldEarned / count);
    avgTeam.totalDamageTaken = Math.round(avgTeam.totalDamageTaken / count);
    avgTeam.totalDamageDealt = Math.round(avgTeam.totalDamageDealt / count);
    avgTeam.totalDamageToChamp = Math.round(avgTeam.totalDamageToChamp / count);
    avgTeam.totalVisionScore = Math.round(avgTeam.totalVisionScore / count);
    avgTeam.baronKills = parseFloat((avgTeam.baronKills / count).toFixed(2));
    avgTeam.dragonKills = parseFloat((avgTeam.dragonKills / count).toFixed(2));
    avgTeam.towerKills = parseFloat((avgTeam.towerKills / count).toFixed(2));
    avgTeam.inhibitorKills = parseFloat(
      (avgTeam.inhibitorKills / count).toFixed(2)
    );
    avgTeam.riftHeraldKills = parseFloat(
      (avgTeam.riftHeraldKills / count).toFixed(2)
    );

    return avgTeam;
  }

  private getEmptyTeamStats(name: string, win: boolean): TeamStats {
    return {
      name,
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      totalGoldEarned: 0,
      totalDamageTaken: 0,
      totalDamageDealt: 0,
      totalDamageToChamp: 0,
      totalVisionScore: 0,
      baronKills: 0,
      dragonKills: 0,
      towerKills: 0,
      inhibitorKills: 0,
      riftHeraldKills: 0,
      win,
    };
  }

  private analyzeWinningFactors(
    winningTeams: TeamStats[],
    losingTeams: TeamStats[]
  ): any[] {
    if (
      winningTeams.length === 0 ||
      losingTeams.length === 0 ||
      winningTeams.length !== losingTeams.length
    ) {
      return [];
    }

    const factors = [
      { name: 'Kills', key: 'totalKills' },
      { name: 'Morts', key: 'totalDeaths', isNegative: true },
      { name: 'Assists', key: 'totalAssists' },
      { name: 'Or', key: 'totalGoldEarned' },
      { name: 'Dégâts Subis', key: 'totalDamageTaken' },
      { name: 'Dégâts Infligés', key: 'totalDamageDealt' },
      { name: 'Dégâts aux Champions', key: 'totalDamageToChamp' },
      { name: 'Score de Vision', key: 'totalVisionScore' },
      { name: 'Baron Nashor', key: 'baronKills' },
      { name: 'Dragons', key: 'dragonKills' },
      { name: 'Tours', key: 'towerKills' },
      { name: 'Inhibiteurs', key: 'inhibitorKills' },
      { name: 'Herald', key: 'riftHeraldKills' },
    ];

    const results = [];
    const gamesCount = winningTeams.length;

    for (const factor of factors) {
      // Calculer le ratio pour chaque match
      const ratios = [];
      let advantageCount = 0;

      for (let i = 0; i < gamesCount; i++) {
        const winValue = winningTeams[i][
          factor.key as keyof TeamStats
        ] as number;
        const loseValue = losingTeams[i][
          factor.key as keyof TeamStats
        ] as number;

        // Éviter la division par zéro
        let ratio = 1;
        if (loseValue !== 0) {
          ratio = winValue / loseValue;
        } else if (winValue > 0) {
          ratio = 2; // Valeur arbitraire pour représenter un avantage important
        }

        // Cas particulier pour les facteurs négatifs (comme les morts)
        if (factor.isNegative && ratio !== 0) {
          ratio = 1 / ratio;
        }

        ratios.push(ratio);

        // Compter combien de fois l'équipe gagnante a un avantage sur ce facteur
        if (
          (factor.isNegative && winValue < loseValue) ||
          (!factor.isNegative && winValue > loseValue)
        ) {
          advantageCount++;
        }
      }

      // Calculer le ratio moyen
      const averageRatio = ratios.reduce((sum, r) => sum + r, 0) / gamesCount;

      // Calcul du taux de victoire quand ce facteur est favorable
      const winRate = advantageCount / gamesCount;

      // Score de significativité (combinaison du ratio moyen et du taux de victoire)
      const significanceScore = averageRatio * winRate;

      results.push({
        factor: factor.name,
        averageRatio: parseFloat(averageRatio.toFixed(2)),
        significanceScore: parseFloat(significanceScore.toFixed(2)),
        winRate: parseFloat(winRate.toFixed(2)),
        gamesAnalyzed: gamesCount,
      });
    }

    // Trier par score de significativité décroissant
    return results.sort((a, b) => b.significanceScore - a.significanceScore);
  }

  // Analyser les items et calculer leur taux de victoire
  private analyzeItemWinRates(data: any[]): ItemWinRate[] {
    console.log(`Début analyse des items. Total joueurs: ${data.length}`);

    // Collecter tous les items avec leurs résultats (victoire/défaite)
    const itemOccurrences: Map<string, { wins: number; total: number }> =
      new Map();

    // Statistiques pour le débogage
    let totalItemsProcessed = 0;
    let totalItemsValid = 0;
    let playersWithWin = 0;
    let playersWithItems = 0;

    // Parcourir les données des joueurs
    data.forEach((player, index) => {
      // Vérification du format de la valeur 'win'
      const winValues = player.win;
      let isWin = false;

      if (winValues === 'TRUE' || winValues === 'true' || winValues === true) {
        isWin = true;
        playersWithWin++;
      }

      // Vérifier si les attributs d'items sont présents
      let hasItems = false;
      for (let i = 0; i <= 6; i++) {
        if (`item${i}` in player) {
          hasItems = true;
          break;
        }
      }

      if (!hasItems) {
        if (index < 5) console.log(`Joueur #${index} n'a pas d'items`);
        return; // Passer au joueur suivant si pas d'attributs d'items
      }

      playersWithItems++;

      // Parcourir tous les slots d'items (0-6)
      for (let i = 0; i <= 6; i++) {
        const itemKey = `item${i}`;
        if (!(itemKey in player)) continue;

        const itemName = player[itemKey];
        totalItemsProcessed++;

        // Ignorer les slots vides ou les items "Item_0" ou 0
        if (
          !itemName ||
          itemName === 'Item_0' ||
          itemName === '0' ||
          itemName.trim() === ''
        ) {
          continue;
        }

        totalItemsValid++;

        // Initialiser l'item dans la map s'il n'existe pas encore
        if (!itemOccurrences.has(itemName)) {
          itemOccurrences.set(itemName, { wins: 0, total: 0 });
        }

        // Mettre à jour les compteurs
        const current = itemOccurrences.get(itemName)!;
        current.total += 1;

        if (isWin) {
          current.wins += 1;
        }
      }
    });

    console.log(`Total joueurs avec win=TRUE: ${playersWithWin}`);
    console.log(`Total joueurs avec items: ${playersWithItems}`);
    console.log(
      `Total items traités: ${totalItemsProcessed}, valides: ${totalItemsValid}`
    );
    console.log(`Items uniques trouvés: ${itemOccurrences.size}`);

    // Convertir la map en tableau et calculer le taux de victoire
    const itemWinRates: ItemWinRate[] = [];

    // Parcourir les items et calculer leur taux de victoire
    itemOccurrences.forEach((stats, itemName) => {
      // Ne garder que les items avec un nombre significatif d'occurrences (au moins 10)
      if (stats.total >= 10) {
        const winRate = stats.wins / stats.total;

        itemWinRates.push({
          itemName,
          totalOccurrences: stats.total,
          winCount: stats.wins,
          winRate: winRate,
        });

        // Afficher les 5 premiers items pour débogage
        if (itemWinRates.length <= 5) {
          console.log(
            `Item: ${itemName}, Occurrences: ${stats.total}, Victoires: ${
              stats.wins
            }, Taux: ${(winRate * 100).toFixed(1)}%`
          );
        }
      }
    });

    console.log(`Items avec au moins 10 occurrences: ${itemWinRates.length}`);

    // S'il y a moins de 20 items avec un taux de victoire valide,
    // alors compléter avec des items moins fréquents (moins de 10 occurrences)
    if (itemWinRates.length < 20) {
      console.log(
        "Pas assez d'items trouvés, utilisation d'items avec moins d'occurrences"
      );

      const additionalItems: ItemWinRate[] = [];

      itemOccurrences.forEach((stats, itemName) => {
        // Prendre les items entre 5 et 9 occurrences
        if (
          stats.total >= 5 &&
          stats.total < 10 &&
          !itemWinRates.some((item) => item.itemName === itemName)
        ) {
          const winRate = stats.wins / stats.total;

          additionalItems.push({
            itemName,
            totalOccurrences: stats.total,
            winCount: stats.wins,
            winRate: winRate,
          });
        }
      });

      // Ajouter ces items à la liste principale
      itemWinRates.push(...additionalItems);
    }

    // Trier par taux de victoire décroissant
    const sortedItems = itemWinRates
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 20);

    // S'il n'y a toujours pas assez d'items, afficher un message d'avertissement
    if (sortedItems.length < 20) {
      console.warn(
        `Attention: seulement ${sortedItems.length} items trouvés avec des données suffisantes.`
      );
    }

    // Afficher les 3 meilleurs items pour débogage
    console.log('Top 3 items par taux de victoire:');
    sortedItems.slice(0, 3).forEach((item) => {
      console.log(
        `- ${item.itemName}: ${(item.winRate * 100).toFixed(1)}% (${
          item.winCount
        }/${item.totalOccurrences})`
      );
    });

    return sortedItems;
  }
}
