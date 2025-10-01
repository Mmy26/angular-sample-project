import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public statuses: string[] = [];
  public initialStatuses: string[] = [];
  public items: any[] = Array(5).fill(0); // 5つのフォームを作成するためのダミー配列

  constructor() { }

  ngOnInit(): void {
    // 初期値を設定
    this.items.forEach((_, index) => {
      const initialValue = index % 2 === 0 ? 'OK' : 'NG'; // 例として初期値を交互に設定
      this.statuses.push(initialValue);
      this.initialStatuses.push(initialValue);
    });
  }

  isChanged(index: number): boolean {
    return this.statuses[index] !== this.initialStatuses[index];
  }
}
