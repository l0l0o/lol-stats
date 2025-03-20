import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CsvService } from '../csv.service';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-csv-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatPaginatorModule,
    MatFormFieldModule,
  ],
  templateUrl: './csv-viewer.component.html',
  styleUrls: ['./csv-viewer.component.css'],
})
export class CsvViewerComponent implements OnInit {
  csvData: any[] = [];
  headers: string[] = [];
  loading = true;
  error = false;
  currentPage = 1;
  pageSize = 20;

  constructor(private csvService: CsvService) {}

  ngOnInit(): void {
    this.loadCsvData();
  }

  loadCsvData(): void {
    this.loading = true;
    this.error = false;

    this.csvService.getCsvData().subscribe({
      next: (data) => {
        this.csvData = data;
        if (data.length > 0) {
          this.headers = Object.keys(data[0]);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données CSV:', err);
        this.error = true;
        this.loading = false;
      },
    });
  }

  reloadData(): void {
    this.loadCsvData();
  }

  get totalPages(): number {
    return Math.ceil(this.csvData.length / this.pageSize);
  }

  get currentPageData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.csvData.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
  }
}
