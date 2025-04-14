# LOL Stats - Analyse de données League of Legends

Application web développée avec Angular permettant d'analyser et de visualiser des statistiques de jeux League of Legends pour comprendre les facteurs qui influencent le plus la victoire.
Les données étant très nombreuses, la visualisation des statistiques peut prendre un peu de temps.

## Fonctionnalités

- Analyse complète des données de parties League of Legends
- Visualisation des statistiques avec des graphiques interactifs (Highcharts)
- Identification des facteurs clés de victoire
- Analyse de l'impact des positions (TOP, JUNGLE, MID, BOT, SUPPORT)
- Statistiques des objets et leur taux de victoire
- Comparaison des équipes victorieuses et perdantes

## Technologies utilisées

- Angular 19
- TypeScript
- RxJS
- Highcharts (visualisation de données)
- Angular Material
- Bootstrap 5

## Installation

Assurez-vous d'avoir Node.js et npm installés sur votre machine.

```bash
# Cloner le dépôt
git clone [https://github.com/l0l0o/lol-stats]
cd lol-stats

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

L'application sera accessible à l'adresse `http://localhost:4200/`.

## Structure du projet

- `src/app/dataviz` - Composant principal pour la visualisation des données
- `src/app/csv-viewer` - Visualisation des données brutes CSV
- `src/app/team-stats.service.ts` - Service d'analyse des statistiques d'équipe
- `src/app/csv.service.ts` - Service de traitement des fichiers CSV
- `src/app/game.service.ts` - Service de gestion des données de jeu
- `src/assets` - Fichiers de données (dont league-data.csv)

## Développement

Pour générer un nouveau composant :

```bash
ng generate component nom-du-composant
```

Pour les autres types d'éléments (services, directives, etc.) :

```bash
ng generate --help
```

## Production

Pour compiler l'application pour la production :

```bash
ng build
```

Les fichiers compilés seront stockés dans le dossier `dist/`.

## Tests

Pour exécuter les tests unitaires :

```bash
ng test
```

## Contribuer

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Poussez vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

## Licence

[À spécifier]
