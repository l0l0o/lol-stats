import { Routes } from '@angular/router';
import { CsvViewerComponent } from './csv-viewer/csv-viewer.component';
import { DatavizComponent } from './dataviz/dataviz.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dataviz', pathMatch: 'full' },
  { path: 'csv-viewer', component: CsvViewerComponent },
  { path: 'dataviz', component: DatavizComponent },
];
