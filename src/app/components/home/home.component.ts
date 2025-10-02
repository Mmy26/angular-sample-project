import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  public statuses: string[] = [];
  public initialStatuses: string[] = [];
  public items: any[] = Array(20).fill(0); // 20個のフォームを作成するためのダミー配列
  public data: { [key: string]: string }[] = []; // 新しいデータ項目を追加

  public isConfirmationMode: boolean = false; // 確認モードのON/OFF
  public selectedForConfirmation: boolean[] = []; // 確認モードで選択されたセル
  public isConfirmedAndCleared: boolean[] = []; // 最終的に確定されて文字が消えたセル
  public selectedRowIndex: number | null = null; // 選択された行のインデックス

  constructor() { }

  ngOnInit(): void {
    // 初期値を設定
    this.items.forEach((_, index) => {
      const initialValue = index % 2 === 0 ? 'OK' : 'NG'; // 例として初期値を交互に設定
      this.statuses.push(initialValue);
      this.initialStatuses.push(initialValue);
      this.selectedForConfirmation.push(false); // 最初はすべて未選択
      this.isConfirmedAndCleared.push(false); // 最初はすべて未確定・未クリア

      // 新しいデータ項目を初期化
      this.data.push({
        'Column A': `Value A${index + 1}`,
        'Column B': `Value B${index + 1}`,
        'Column C': `Value C${index + 1}`
      });
    });
  }

  // 行がクリックされたときの処理
  onRowClick(index: number): void {
    this.selectedRowIndex = index;
  }

  // フォームの値が初期値から変更されたかどうか
  isChanged(index: number): boolean {
    return this.statuses[index] !== this.initialStatuses[index];
  }

  // フォームの選択が変更されたときの処理
  onStatusChange(index: number): void {
    // 変更があった場合は、確認モードの選択状態と最終確定状態をリセット
    this.selectedForConfirmation[index] = false;
    this.isConfirmedAndCleared[index] = false;
  }

  // 確認モードのON/OFFを切り替える
  toggleConfirmationMode(): void {
    this.isConfirmationMode = !this.isConfirmationMode;
    // 確認モードを終了するときは、選択状態をリセット
    if (!this.isConfirmationMode) {
      this.selectedForConfirmation.fill(false);
    }
  }

  // 確認モードでセルがクリックされたときの処理
  onCellClick(index: number): void {
    if (this.isConfirmationMode && this.isChanged(index) && !this.isConfirmedAndCleared[index]) {
      this.selectedForConfirmation[index] = !this.selectedForConfirmation[index];
    }
  }

  // 最終確認ボタンがクリックされたときの処理
  finalConfirm(): void {
    this.items.forEach((_, index) => {
      if (this.selectedForConfirmation[index]) {
        this.isConfirmedAndCleared[index] = true; // 最終確定して文字をクリア
        this.initialStatuses[index] = this.statuses[index]; // 確定された値を新しい初期値として設定
        this.selectedForConfirmation[index] = false; // 選択状態をリセット
      }
    });
    this.isConfirmationMode = false; // 確認モードを終了
  }
}
