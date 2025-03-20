import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CsvService {
  constructor(private http: HttpClient) {}

  getCsvData(): Observable<any[]> {
    // Utiliser le chemin relatif vers le fichier dans le dossier assets
    return this.http
      .get('assets/league-data.csv', {
        responseType: 'text',
      })
      .pipe(
        map((csvData: string) => this.parseCsvData(csvData)),
        tap((data) => this.validateItemsData(data)),
        catchError((error) => {
          console.error('Erreur lors du chargement du CSV:', error);
          return of([]);
        })
      );
  }

  private parseCsvData(csvData: string): any[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map((header) => header.trim());

    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;

      const values = this.parseCSVLine(lines[i]);
      const entry: Record<string, string> = {};

      headers.forEach((header, index) => {
        entry[header] = values[index];
      });

      result.push(entry);
    }

    return result;
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }

    result.push(currentValue);
    return result;
  }

  private validateItemsData(data: any[]): void {
    console.log("Validation des données d'items...");

    // Vérifier le nombre total d'entrées
    console.log(`Nombre total d'entrées dans le CSV: ${data.length}`);

    // Vérifier que les champs d'items sont présents
    const firstRow = data[0] || {};
    const hasItemFields = 'item0' in firstRow;
    console.log(`Les champs d'items sont présents: ${hasItemFields}`);

    if (!hasItemFields) {
      console.error(
        "ATTENTION: Les champs d'items ne sont pas présents dans les données !"
      );
      return;
    }

    // Statistiques sur les items
    let itemCounts = { total: 0, empty: 0, nonEmpty: 0, winning: 0 };
    let uniqueItems = new Set<string>();

    // Parcourir un échantillon de 1000 entrées maximum
    const sampleSize = Math.min(1000, data.length);
    const sample = data.slice(0, sampleSize);

    sample.forEach((entry, index) => {
      const isWin = entry.win === 'TRUE';

      for (let i = 0; i <= 6; i++) {
        const itemKey = `item${i}`;
        if (!(itemKey in entry)) continue;

        const itemVal = entry[itemKey];
        itemCounts.total++;

        if (
          !itemVal ||
          itemVal === '0' ||
          itemVal === 'Item_0' ||
          itemVal.trim() === ''
        ) {
          itemCounts.empty++;
        } else {
          itemCounts.nonEmpty++;
          uniqueItems.add(itemVal);

          if (isWin) {
            itemCounts.winning++;
          }
        }
      }

      // Afficher un exemple des 3 premières entrées
      if (index < 3) {
        console.log(`Exemple d'entrée #${index + 1}:`);
        console.log(`- Win: ${entry.win}`);
        for (let i = 0; i <= 6; i++) {
          const itemKey = `item${i}`;
          console.log(`- ${itemKey}: ${entry[itemKey] || 'non défini'}`);
        }
      }
    });

    console.log(
      `Statistiques des items (échantillon de ${sampleSize} entrées):`
    );
    console.log(`- Total: ${itemCounts.total}`);
    console.log(`- Vides: ${itemCounts.empty}`);
    console.log(`- Non vides: ${itemCounts.nonEmpty}`);
    console.log(`- Items gagnants: ${itemCounts.winning}`);
    console.log(`- Items uniques: ${uniqueItems.size}`);
    console.log(
      `- Exemple d'items uniques: ${Array.from(uniqueItems)
        .slice(0, 5)
        .join(', ')}`
    );
  }
}
