import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';

const routes: Routes = [
  {redirectTo: 'home', pathMatch: 'full', path: ''},
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'tasks',
    component: TaskManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
