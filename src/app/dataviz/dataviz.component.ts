import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Highcharts from 'highcharts';
import {
  TeamStatsService,
  TeamStats,
  GameAnalysisResult,
  PositionImpact,
  ItemWinRate,
} from '../team-stats.service';
import { Subscription } from 'rxjs';

// Interfaces pour les callbacks de Highcharts
interface HighchartsTooltipFormatterContextObject {
  series: { name: string; color: string };
  x: number | string;
  y: number;
  point: {
    y: number;
    x: number;
    z?: number;
    value?: number;
    custom?: any;
  };
}

interface HighchartsDataLabelsFormatterContextObject {
  y: number;
  point: {
    value: number;
    custom?: any;
  };
}

@Component({
  selector: 'app-dataviz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dataviz.component.html',
  styleUrls: ['./dataviz.component.scss'],
})
export class DatavizComponent implements OnInit, OnDestroy {
  Highcharts: typeof Highcharts = Highcharts;
  winningTeam: TeamStats | null = null;
  losingTeam: TeamStats | null = null;
  analysisResult: GameAnalysisResult | null = null;
  positionImpacts: PositionImpact[] = [];
  topItems: ItemWinRate[] = [];
  private subscription: Subscription | null = null;

  loading = true;
  error = false;
  gamesAnalyzed = 0;
  significantFactors: Array<{
    factor: string;
    score: number;
    winRate: number;
  }> = [];

  constructor(private teamStatsService: TeamStatsService) {}

  ngOnInit(): void {
    this.loading = true;
    this.error = false;
    this.subscription = this.teamStatsService.analyzeAllGames().subscribe({
      next: (data) => {
        this.analysisResult = data;
        this.winningTeam = data.winningTeamStats;
        this.losingTeam = data.losingTeamStats;
        this.positionImpacts = data.positionImpacts;
        this.topItems = data.topItems || [];
        this.loading = false;
        this.gamesAnalyzed = data.winningFactors[0]?.gamesAnalyzed || 0;

        // Extraire les facteurs significatifs
        this.significantFactors = data.winningFactors.map((f) => ({
          factor: f.factor,
          score: f.significanceScore,
          winRate: f.winRate,
        }));

        // Initialiser les graphiques une fois que les données sont chargées
        setTimeout(() => {
          this.initWinningFactorsChart();
          this.initObjectivesRadar();
          this.initDamageGoldChart();
          this.initKdaVisionChart();
          this.initWinRateByFactorChart();
          this.initVictoryRatiosChart();
          this.initKdaDifferenceChart();
          this.initPositionImpactChart();
          this.initItemWinRateChart();
        }, 0);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données:', err);
        this.loading = false;
        this.error = true;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initPositionImpactChart(): void {
    if (!this.positionImpacts || this.positionImpacts.length === 0) {
      console.warn("Aucune donnée d'impact de position disponible");
      return;
    }

    // Traduction des noms de positions
    const positionNames: Record<string, string> = {
      TOP: 'Haut',
      JUNGLE: 'Jungle',
      MIDDLE: 'Milieu',
      BOTTOM: 'Bas',
      SUPPORT: 'Support',
    };

    // Définir les couleurs par catégorie pour la répartition
    const breakdownColors: Record<string, string> = {
      kdaPercent: '#FF5722',
      participationPercent: '#FF9800',
      damagePercent: '#FFEB3B',
      damageTakenPercent: '#8BC34A',
      visionPercent: '#03A9F4',
      goldPercent: '#FFC107',
      teamObjectivesPercent: '#9C27B0',
      winBonusPercent: '#E91E63',
    };

    // Préparer les données pour le graphique
    const categories = this.positionImpacts.map(
      (p) => positionNames[p.position] || p.position
    );
    const scoreData = this.positionImpacts.map((p) =>
      parseFloat(p.score.toFixed(2))
    );

    // Préparer les données pour le graphique de répartition des scores
    const breakdownSeries = [
      {
        name: 'KDA',
        data: this.positionImpacts.map((p) =>
          parseFloat(((p.scoreBreakdown.kdaPercent / 100) * p.score).toFixed(2))
        ),
        color: breakdownColors['kdaPercent'],
      },
      {
        name: 'Participation',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.participationPercent / 100) * p.score).toFixed(2)
          )
        ),
        color: breakdownColors['participationPercent'],
      },
      {
        name: 'Dégâts Infligés',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.damagePercent / 100) * p.score).toFixed(2)
          )
        ),
        color: breakdownColors['damagePercent'],
      },
      {
        name: 'Dégâts Subis',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.damageTakenPercent / 100) * p.score).toFixed(2)
          )
        ),
        color: breakdownColors['damageTakenPercent'],
      },
      {
        name: 'Vision',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.visionPercent / 100) * p.score).toFixed(2)
          )
        ),
        color: breakdownColors['visionPercent'],
      },
      {
        name: 'Or',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.goldPercent / 100) * p.score).toFixed(2)
          )
        ),
        color: breakdownColors['goldPercent'],
      },
      {
        name: 'Objectifs',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.teamObjectivesPercent / 100) * p.score).toFixed(
              2
            )
          )
        ),
        color: breakdownColors['teamObjectivesPercent'],
      },
      {
        name: 'Bonus Victoire',
        data: this.positionImpacts.map((p) =>
          parseFloat(
            ((p.scoreBreakdown.winBonusPercent / 100) * p.score).toFixed(2)
          )
        ),
        color: breakdownColors['winBonusPercent'],
      },
    ];

    // Créer le graphique principal - score global par position
    Highcharts.chart('position-impact-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Impact des Positions dans le Jeu',
        style: {
          fontWeight: 'bold',
        },
      },
      subtitle: {
        text: "Score d'impact global par position",
      },
      xAxis: {
        categories: categories,
        crosshair: true,
      },
      yAxis: {
        min: 0,
        title: {
          text: "Score d'impact",
        },
      },
      tooltip: {
        formatter: function (): string {
          const thisObj = this as any;
          const position = thisObj.x;
          const positionData =
            thisObj.points[0].series.userOptions.positionData.find(
              (p: any) => (positionNames[p.position] || p.position) === position
            );

          if (!positionData)
            return `<b>${position}</b><br/>Score: <b>${thisObj.y}</b>`;

          return `<b>${position}</b><br/>
                 Score total: <b>${thisObj.y}</b><br/>
                 <hr/>
                 <b>Statistiques brutes:</b><br/>
                 Dégâts aux champions: <b>${positionData.avgDamageToChamp.toLocaleString()}</b><br/>
                 Dégâts subis: <b>${positionData.avgDamageTaken.toLocaleString()}</b><br/>
                 <hr/>
                 <b>Répartition du score:</b><br/>
                 KDA: <b>${positionData.scoreBreakdown.kdaPercent}%</b><br/>
                 Participation: <b>${
                   positionData.scoreBreakdown.participationPercent
                 }%</b><br/>
                 Dégâts: <b>${
                   positionData.scoreBreakdown.damagePercent
                 }%</b><br/>
                 Résistance: <b>${
                   positionData.scoreBreakdown.damageTakenPercent
                 }%</b><br/>
                 Vision: <b>${
                   positionData.scoreBreakdown.visionPercent
                 }%</b><br/>
                 Or: <b>${positionData.scoreBreakdown.goldPercent}%</b><br/>
                 Objectifs: <b>${
                   positionData.scoreBreakdown.teamObjectivesPercent
                 }%</b><br/>
                 Bonus Victoire: <b>${
                   positionData.scoreBreakdown.winBonusPercent
                 }%</b>`;
        },
        shared: true,
        useHTML: true,
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
        },
      },
      series: [
        {
          name: "Score d'impact",
          data: scoreData,
          color: '#4CAF50',
          // @ts-ignore
          positionData: this.positionImpacts,
        },
      ],
    } as any);

    // Créer le graphique secondaire - répartition des scores par facteur
    Highcharts.chart('position-breakdown-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: "Répartition des Facteurs d'Impact par Position",
        style: {
          fontWeight: 'bold',
        },
      },
      subtitle: {
        text: 'Décomposition du score par facteur contributif',
      },
      xAxis: {
        categories: categories,
        crosshair: true,
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Contribution au score',
        },
        stackLabels: {
          enabled: true,
          style: {
            fontWeight: 'bold',
            color: 'gray',
          },
          formatter: function (): number {
            const thisObj = this as any;
            return Math.round(thisObj.total * 100) / 100;
          },
        },
      },
      legend: {
        align: 'center',
        verticalAlign: 'bottom',
        layout: 'horizontal',
      },
      tooltip: {
        formatter: function (): string {
          const thisObj = this as any;
          const position = thisObj.x;
          const factorName = thisObj.series.name;
          const factorValue = thisObj.y;
          const totalValue = thisObj.point.stackTotal;
          const percentage = ((factorValue / totalValue) * 100).toFixed(1);

          // Récupérer les données brutes de position
          const positionData =
            thisObj.series.chart.userOptions.positionData.find(
              (p: any) => (positionNames[p.position] || p.position) === position
            );

          let tooltipContent = `<b>${position} - ${factorName}</b><br/>
                           Contribution: <b>${factorValue}</b> (${percentage}% du total)<br/>`;

          // Ajouter les statistiques brutes pour les facteurs de dégâts
          if (factorName === 'Dégâts Infligés' && positionData) {
            tooltipContent += `<br/>Moyenne des dégâts infligés: <b>${positionData.avgDamageToChamp.toLocaleString()}</b>`;
          } else if (factorName === 'Dégâts Subis' && positionData) {
            tooltipContent += `<br/>Moyenne des dégâts subis: <b>${positionData.avgDamageTaken.toLocaleString()}</b>`;
          } else if (factorName === 'Bonus Victoire') {
            tooltipContent += `<br/><i>Points supplémentaires attribués aux joueurs des équipes gagnantes</i>`;
          }

          return tooltipContent;
        },
        useHTML: true,
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          dataLabels: {
            enabled: false,
          },
        },
      },
      // @ts-ignore
      positionData: this.positionImpacts,
      series: breakdownSeries,
    } as any);
  }

  public translatePosition(position: string): string {
    const positionMap: { [key: string]: string } = {
      TOP: 'Top',
      JUNGLE: 'Jungle',
      MIDDLE: 'Mid',
      BOTTOM: 'ADC',
      UTILITY: 'Support',
    };
    return positionMap[position] || position;
  }

  private getPositionColor(position: string): string {
    const colors: Record<string, string> = {
      TOP: '#FF9800', // Orange
      JUNGLE: '#4CAF50', // Vert
      MIDDLE: '#2196F3', // Bleu
      BOTTOM: '#F44336', // Rouge
      SUPPORT: '#9C27B0', // Violet
    };

    return colors[position] || '#607D8B'; // Gris par défaut
  }

  private initWinningFactorsChart(): void {
    if (!this.analysisResult) return;

    const factors = this.analysisResult.winningFactors;

    Highcharts.chart('winning-factors-chart', {
      chart: {
        type: 'bar',
      },
      title: {
        text: 'Importance des Facteurs de Victoire',
      },
      subtitle: {
        text: `Basé sur l'analyse de ${this.gamesAnalyzed} parties`,
      },
      xAxis: {
        categories: factors.map((f) => f.factor),
        title: {
          text: null,
        },
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Score de significativité',
          align: 'high',
        },
        labels: {
          overflow: 'justify',
        },
      },
      tooltip: {
        formatter: function (
          this: HighchartsTooltipFormatterContextObject
        ): string {
          const index = factors.findIndex((f) => f.factor === this.x);
          if (index >= 0) {
            return (
              `<b>${factors[index].factor}</b><br/>` +
              `Score: ${factors[index].significanceScore}<br/>` +
              `Ratio moyen: ${factors[index].averageRatio}<br/>` +
              `Taux d'avantage: ${Math.round(factors[index].winRate * 100)}%`
            );
          }
          return '';
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            formatter: function (
              this: HighchartsDataLabelsFormatterContextObject
            ): string {
              return this.y.toFixed(2);
            },
          },
        },
      },
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      series: [
        {
          name: 'Score',
          data: factors.map((f) => f.significanceScore),
          color: '#1976D2',
          type: 'bar',
        },
      ],
    } as any);
  }

  private initWinRateByFactorChart(): void {
    if (!this.analysisResult) return;

    const factors = this.analysisResult.winningFactors;

    Highcharts.chart('win-rate-factors-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Taux de Victoire par Facteur',
      },
      subtitle: {
        text: 'Pourcentage de parties gagnées quand le facteur est favorable',
      },
      xAxis: {
        categories: factors.map((f) => f.factor),
        crosshair: true,
      },
      yAxis: {
        min: 0,
        max: 1,
        title: {
          text: 'Taux de victoire',
        },
        labels: {
          format: '{value:.0%}',
        },
      },
      tooltip: {
        formatter: function (
          this: HighchartsTooltipFormatterContextObject
        ): string {
          const index = factors.findIndex((f) => f.factor === this.x);
          if (index >= 0) {
            return (
              `<b>${factors[index].factor}</b><br/>` +
              `Taux de victoire: ${Math.round(factors[index].winRate * 100)}%`
            );
          }
          return '';
        },
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function (
              this: HighchartsDataLabelsFormatterContextObject
            ): string {
              return (this.y * 100).toFixed(0) + '%';
            },
          },
        },
      },
      series: [
        {
          name: 'Taux de victoire',
          data: factors.map((f) => f.winRate),
          color: '#4CAF50',
          type: 'column',
        },
        {
          name: 'Moyenne',
          type: 'line',
          data: Array(factors.length).fill(0.5),
          color: '#FF9800',
          marker: { enabled: false },
          enableMouseTracking: false,
          dashStyle: 'shortdash',
        },
      ],
    } as any);
  }

  private initObjectivesRadar(): void {
    if (!this.winningTeam || !this.losingTeam) return;

    Highcharts.chart('objectives-radar', {
      chart: {
        polar: true,
        type: 'line',
      },
      title: {
        text: 'Objectifs par Équipe (Moyenne)',
      },
      subtitle: {
        text: `Basé sur ${this.gamesAnalyzed} parties`,
      },
      pane: {
        size: '80%',
      },
      xAxis: {
        categories: ['Baron', 'Dragons', 'Tours', 'Inhibiteurs', 'Herald'],
        tickmarkPlacement: 'on',
        lineWidth: 0,
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0,
      },
      tooltip: {
        shared: true,
        pointFormat:
          '<span style="color:{series.color}">{series.name}: <b>{point.y}</b><br/>',
      },
      legend: {
        align: 'right',
        verticalAlign: 'middle',
      },
      series: [
        {
          name: this.winningTeam.name,
          data: [
            this.winningTeam.baronKills,
            this.winningTeam.dragonKills,
            this.winningTeam.towerKills,
            this.winningTeam.inhibitorKills,
            this.winningTeam.riftHeraldKills,
          ],
          pointPlacement: 'on',
          color: '#4CAF50',
          type: 'line',
        },
        {
          name: this.losingTeam.name,
          data: [
            this.losingTeam.baronKills,
            this.losingTeam.dragonKills,
            this.losingTeam.towerKills,
            this.losingTeam.inhibitorKills,
            this.losingTeam.riftHeraldKills,
          ],
          pointPlacement: 'on',
          color: '#F44336',
          type: 'line',
        },
      ],
    } as any);
  }

  private initDamageGoldChart(): void {
    if (!this.winningTeam || !this.losingTeam) return;

    Highcharts.chart('damage-gold-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Dégâts et Or par Équipe (Moyenne)',
      },
      subtitle: {
        text: `Basé sur ${this.gamesAnalyzed} parties`,
      },
      xAxis: {
        categories: [
          'Dégâts aux Champions',
          'Dégâts Totaux',
          'Dégâts Subis',
          'Or Gagné',
        ],
      },
      yAxis: {
        title: {
          text: 'Valeur',
        },
      },
      tooltip: {
        formatter: function (
          this: HighchartsTooltipFormatterContextObject
        ): string {
          return (
            '<b>' +
            this.series.name +
            '</b><br/>' +
            this.x +
            ': ' +
            Highcharts.numberFormat(this.y, 0)
          );
        },
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            formatter: function (
              this: HighchartsDataLabelsFormatterContextObject
            ): string {
              return Highcharts.numberFormat(this.y / 1000, 1) + 'k';
            },
          },
        },
      },
      series: [
        {
          name: this.winningTeam.name,
          data: [
            this.winningTeam.totalDamageToChamp,
            this.winningTeam.totalDamageDealt,
            this.winningTeam.totalDamageTaken,
            this.winningTeam.totalGoldEarned,
          ],
          color: '#4CAF50',
          type: 'column',
        },
        {
          name: this.losingTeam.name,
          data: [
            this.losingTeam.totalDamageToChamp,
            this.losingTeam.totalDamageDealt,
            this.losingTeam.totalDamageTaken,
            this.losingTeam.totalGoldEarned,
          ],
          color: '#F44336',
          type: 'column',
        },
      ],
    } as any);
  }

  private initKdaVisionChart(): void {
    if (!this.winningTeam || !this.losingTeam) return;

    Highcharts.chart('kda-vision-chart', {
      chart: {
        type: 'bar',
      },
      title: {
        text: 'KDA et Vision par Équipe (Moyenne)',
      },
      subtitle: {
        text: `Basé sur ${this.gamesAnalyzed} parties`,
      },
      xAxis: {
        categories: ['Kills', 'Morts', 'Assists', 'Score de Vision'],
      },
      yAxis: {
        title: {
          text: 'Nombre',
        },
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        floating: true,
        borderWidth: 1,
        backgroundColor: '#FFFFFF',
        shadow: true,
      },
      series: [
        {
          name: this.winningTeam.name,
          data: [
            this.winningTeam.totalKills,
            this.winningTeam.totalDeaths,
            this.winningTeam.totalAssists,
            this.winningTeam.totalVisionScore,
          ],
          color: '#4CAF50',
          type: 'bar',
        },
        {
          name: this.losingTeam.name,
          data: [
            this.losingTeam.totalKills,
            this.losingTeam.totalDeaths,
            this.losingTeam.totalAssists,
            this.losingTeam.totalVisionScore,
          ],
          color: '#F44336',
          type: 'bar',
        },
      ],
    } as any);
  }

  private initVictoryRatiosChart(): void {
    if (!this.analysisResult) return;

    const factors = this.analysisResult.winningFactors;

    Highcharts.chart('victory-ratios-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Ratio Moyen par Facteur',
      },
      subtitle: {
        text: 'Ratio entre équipes gagnantes et perdantes',
      },
      xAxis: {
        categories: factors.map((f) => f.factor),
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Ratio moyen',
        },
      },
      tooltip: {
        formatter: function (
          this: HighchartsTooltipFormatterContextObject
        ): string {
          const index = factors.findIndex((f) => f.factor === this.x);
          if (index >= 0) {
            return (
              `<b>${factors[index].factor}</b><br/>` +
              `Ratio moyen: ${factors[index].averageRatio}x<br/>` +
              `(Équipes gagnantes par rapport aux perdantes)`
            );
          }
          return '';
        },
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            formatter: function (
              this: HighchartsDataLabelsFormatterContextObject
            ): string {
              return this.y.toFixed(2) + 'x';
            },
          },
        },
      },
      series: [
        {
          name: 'Ratio moyen',
          data: factors.map((f) => f.averageRatio),
          color: '#2196F3',
          type: 'column',
        },
        {
          name: 'Égalité',
          type: 'line',
          data: Array(factors.length).fill(1),
          color: '#FF9800',
          marker: { enabled: false },
          dashStyle: 'shortdot',
        },
      ],
    } as any);
  }

  private initKdaDifferenceChart(): void {
    if (!this.winningTeam || !this.losingTeam) return;

    // Calculer différence en pourcentage
    const calculatePercentDifference = (win: number, lose: number) => {
      if (lose === 0) return win > 0 ? 100 : 0;
      return ((win - lose) / lose) * 100;
    };

    const killsDiff = calculatePercentDifference(
      this.winningTeam.totalKills,
      this.losingTeam.totalKills
    );
    const deathsDiff =
      calculatePercentDifference(
        this.losingTeam.totalDeaths,
        this.winningTeam.totalDeaths
      ) * -1; // Inverser pour les morts
    const assistsDiff = calculatePercentDifference(
      this.winningTeam.totalAssists,
      this.losingTeam.totalAssists
    );
    const visionDiff = calculatePercentDifference(
      this.winningTeam.totalVisionScore,
      this.losingTeam.totalVisionScore
    );
    const damageDiff = calculatePercentDifference(
      this.winningTeam.totalDamageToChamp,
      this.losingTeam.totalDamageToChamp
    );
    const goldDiff = calculatePercentDifference(
      this.winningTeam.totalGoldEarned,
      this.losingTeam.totalGoldEarned
    );

    Highcharts.chart('kda-difference-chart', {
      chart: {
        type: 'column',
      },
      title: {
        text: 'Écart de Performance (%)',
      },
      subtitle: {
        text: 'Différence en pourcentage entre équipes gagnantes et perdantes',
      },
      xAxis: {
        categories: [
          'Kills',
          'Moins de Morts',
          'Assists',
          'Vision',
          'Dégâts',
          'Or',
        ],
      },
      yAxis: {
        title: {
          text: 'Différence (%)',
        },
        labels: {
          format: '{value}%',
        },
      },
      tooltip: {
        formatter: function (
          this: HighchartsTooltipFormatterContextObject
        ): string {
          return `<b>${this.x}</b><br/>` + `Différence: ${this.y.toFixed(1)}%`;
        },
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: true,
            formatter: function (
              this: HighchartsDataLabelsFormatterContextObject
            ): string {
              return this.y > 0
                ? '+' + this.y.toFixed(1) + '%'
                : this.y.toFixed(1) + '%';
            },
          },
        },
      },
      series: [
        {
          name: 'Différence',
          data: [
            { y: killsDiff, color: killsDiff > 0 ? '#4CAF50' : '#F44336' },
            { y: deathsDiff, color: deathsDiff > 0 ? '#4CAF50' : '#F44336' },
            { y: assistsDiff, color: assistsDiff > 0 ? '#4CAF50' : '#F44336' },
            { y: visionDiff, color: visionDiff > 0 ? '#4CAF50' : '#F44336' },
            { y: damageDiff, color: damageDiff > 0 ? '#4CAF50' : '#F44336' },
            { y: goldDiff, color: goldDiff > 0 ? '#4CAF50' : '#F44336' },
          ],
          type: 'column',
        },
      ],
    } as any);
  }

  private initItemWinRateChart(): void {
    if (!this.topItems || this.topItems.length === 0) {
      console.warn('Aucun item trouvé pour créer le graphique');
      return;
    }

    console.log(`Nombre d'items pour le graphique: ${this.topItems.length}`);

    // S'assurer qu'on n'a pas plus de 20 items
    const displayedItems = this.topItems.slice(0, 30);
    console.log(`Items à afficher: ${displayedItems.length}`);

    // Préparer les données pour le graphique
    const categories = displayedItems.map((item) => item.itemName);
    let winRateData = displayedItems.map((item) =>
      parseFloat((item.winRate * 100).toFixed(1))
    );

    console.log(`Taux de victoire calculés: ${winRateData.join(', ')}`);

    // Si tous les taux sont à 0%, il y a un problème de calcul
    if (winRateData.every((rate) => rate === 0)) {
      console.error(
        'Tous les taux de victoire sont à 0% - problème de calcul détecté'
      );

      // Recalculer manuellement les taux
      winRateData = displayedItems.map(
        (item) => (item.winCount / Math.max(item.totalOccurrences, 1)) * 100
      );
    }

    // Formater les noms d'items pour une meilleure lisibilité
    const formattedCategories = categories.map((name) =>
      this.formatItemName(name)
    );

    // Créer un tableau de données avec couleurs selon le taux de victoire
    const colorData = winRateData.map((rate, index) => {
      let color = '#4CAF50'; // vert par défaut

      if (rate > 65) {
        color = '#2E7D32'; // vert foncé pour taux très élevés
      } else if (rate > 60) {
        color = '#4CAF50'; // vert moyen
      } else if (rate > 55) {
        color = '#8BC34A'; // vert clair
      } else if (rate > 50) {
        color = '#CDDC39'; // jaune-vert
      } else {
        color = '#FFC107'; // jaune pour les taux plus faibles
      }

      return {
        y: rate,
        color: color,
        itemName: categories[index],
        occurrences: displayedItems[index].totalOccurrences,
        wins: displayedItems[index].winCount,
      };
    });

    // Créer un tableau d'options pour chaque série
    const seriesData = [
      {
        name: 'Taux de Victoire',
        data: colorData,
        type: 'bar',
      },
    ];

    // Créer le graphique avec des options maximisant l'affichage
    Highcharts.chart('item-win-rate-chart', {
      chart: {
        type: 'bar',
        height: 900,
        spacing: [10, 10, 15, 10],
        renderTo: 'item-win-rate-chart',
      },
      title: {
        text: 'Top 20 des Items par Taux de Victoire',
        style: { fontWeight: 'bold' },
      },
      subtitle: {
        text: "Items avec au moins 10 occurrences dans l'analyse",
      },
      xAxis: {
        categories: formattedCategories,
        title: { text: null },
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 'bold',
          },
          enabled: true,
        },
        min: 0,
        max: formattedCategories.length - 1,
      },
      yAxis: {
        min: 0,
        max: 100,
        title: {
          text: 'Taux de Victoire (%)',
          align: 'high',
        },
        labels: {
          overflow: 'justify',
          format: '{value}%',
        },
      },
      tooltip: {
        formatter: function (
          this: HighchartsTooltipFormatterContextObject
        ): string {
          // @ts-ignore - l'attribut options est défini dans notre structure
          const data = this.point.options;
          if (!data) return '';

          return `<b>${this.x}</b><br/>
                 Taux de victoire: <b>${this.y}%</b><br/>
                 Victoires: <b>${data.wins}/${data.occurrences}</b> parties<br/>
                 (${Math.round((data.wins / data.occurrences) * 100)}%)`;
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            format: '{y}%',
            style: {
              fontSize: '10px',
              fontWeight: 'bold',
            },
            crop: false,
            overflow: 'none',
          },
          pointPadding: 0.05,
          groupPadding: 0.05,
          borderRadius: 2,
        },
        series: {
          stacking: undefined,
        },
      },
      legend: { enabled: false },
      credits: { enabled: false },
      series: seriesData,
    } as any);

    console.log(
      'Graphique des items initialisé avec',
      displayedItems.length,
      'items'
    );
  }

  public formatItemName(itemName: string): string {
    if (!itemName) return 'Item inconnu';

    // Supprimer le préfixe "Item_" s'il existe
    let formattedName = itemName.replace(/^Item_/i, '');

    // Si le nom contient des apostrophes, traiter spécialement
    if (formattedName.includes("'")) {
      // Essayer de garder l'apostrophe et les mots autour
      const parts = formattedName.split(/(?=[A-Z])/);
      return parts.join(' ');
    }

    // Ajouter des espaces avant les majuscules pour mieux séparer les mots
    formattedName = formattedName.replace(/([A-Z])/g, ' $1').trim();

    // Remplacer les underscores par des espaces
    formattedName = formattedName.replace(/_/g, ' ');

    // Limiter la longueur pour l'affichage
    if (formattedName.length > 25) {
      formattedName = formattedName.substring(0, 22) + '...';
    }

    return formattedName;
  }

  public getTopContribution(positionData: PositionImpact): string {
    const scores = {
      dégâts: positionData.scoreBreakdown.damagePercent,
      vision: positionData.scoreBreakdown.visionPercent,
      or: positionData.scoreBreakdown.goldPercent,
      KDA: positionData.scoreBreakdown.kdaPercent,
      objectifs: positionData.scoreBreakdown.teamObjectivesPercent,
      'participation aux kills':
        positionData.scoreBreakdown.participationPercent,
      'dégâts subis': positionData.scoreBreakdown.damageTakenPercent,
      victoires: positionData.scoreBreakdown.winBonusPercent,
    };

    // Trouver le score le plus élevé
    let maxCategory = '';
    let maxScore = 0;

    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxCategory = category;
      }
    }

    return maxCategory;
  }
}
