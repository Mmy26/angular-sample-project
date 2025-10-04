import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChildren,
  QueryList,
  Renderer2,
} from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
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

  public selectedCell: { row: number; col: number } = { row: 0, col: 0 }; // 選択されたセルの行と列
  public editingCell: { row: number; col: number } | null = null; // 編集中のセルの行と列
  public editedValue: string = ''; // 編集中のセルの値
  @ViewChildren('dataCell') dataCells!: QueryList<ElementRef>;
  @ViewChildren('statusSelect') statusSelects!: QueryList<ElementRef>; // status select要素への参照

  // 列の数を定義 (Index, Column A, Column B, Column C, Status)
  private readonly NUM_COLUMNS = 5;
  private readonly STATUS_COLUMN_INDEX = 4; // Status列のインデックス
  private readonly STATUS_OPTIONS = ['OK', 'NG']; // Statusの選択肢

  constructor(private el: ElementRef, private renderer: Renderer2) {}

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
        'Column C': `Value C${index + 1}`,
      });
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // セル移動 (Altキーが押されていない場合)
    if (
      !event.altKey &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
    ) {
      event.preventDefault();
      this.moveSelection(event.key);
    }
    // MacでOption + 上下キーで値を変更
    else if (
      event.altKey &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      if (this.selectedCell.col === this.STATUS_COLUMN_INDEX) {
        event.preventDefault();
        this.changeStatusValue(event.key === 'ArrowUp' ? 'up' : 'down');
      }
    }
    // WindowsでAlt + Downでドロップダウンを開く
    else if (event.altKey && event.key === 'ArrowDown') {
      if (this.selectedCell.col === this.STATUS_COLUMN_INDEX) {
        event.preventDefault();
        this.openStatusDropdown(this.selectedCell.row);
      }
    } else if (event.key === 'Enter' && this.editingCell) {
      // Enterキーで編集を確定
      event.preventDefault();
      this.saveEditedValue();
    } else if (event.key === 'Escape' && this.editingCell) {
      // Escapeキーで編集をキャンセル
      event.preventDefault();
      this.cancelEditing();
    }
  }

  moveSelection(key: string): void {
    let newRow = this.selectedCell.row;
    let newCol = this.selectedCell.col;

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, newRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(this.items.length - 1, newRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, newCol - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(this.NUM_COLUMNS - 1, newCol + 1);
        break;
    }

    this.selectedCell = { row: newRow, col: newCol };
    this.focusSelectedCell();
  }

  focusSelectedCell(): void {
    // DOMが更新されるのを待ってからフォーカスを当てる
    setTimeout(() => {
      const cellIndex =
        this.selectedCell.row * this.NUM_COLUMNS + this.selectedCell.col;
      const cellElement = this.dataCells.toArray()[cellIndex];
      if (cellElement) {
        const nativeElement = cellElement.nativeElement as HTMLElement;
        nativeElement.focus();
        // Status列の場合、select要素にフォーカスを当てる
        if (this.selectedCell.col === this.STATUS_COLUMN_INDEX) {
          const selectElement = nativeElement.querySelector('select');
          if (selectElement) {
            selectElement.focus();
          }
        } else if (
          this.selectedCell.col > 0 &&
          this.selectedCell.col < this.STATUS_COLUMN_INDEX
        ) {
          // Column A, B, C のセルにフォーカスが当たった場合、編集モードを開始
          this.startEditing(this.selectedCell.row, this.selectedCell.col);
        }
      }
    }, 0);
  }

  // Alt + Downでドロップダウンを開く
  openStatusDropdown(rowIndex: number): void {
    const selectElement = this.statusSelects.toArray()[rowIndex].nativeElement;
    if (selectElement) {
      // プログラム的にクリックイベントを発生させてドロップダウンを開く
      // Note: `select.focus()`はドロップダウンを開かないため、`click()`を使用
      selectElement.click();
    }
  }

  // 編集モードを開始
  startEditing(row: number, col: number): void {
    this.editingCell = { row, col };
    const columnName = this.getColumnName(col);
    this.editedValue = this.data[row][columnName];
    // DOMが更新されるのを待ってからinput要素にフォーカスを当てる
    setTimeout(() => {
      const inputElement = this.el.nativeElement.querySelector(
        `#edit-input-${row}-${col}`
      );
      if (inputElement) {
        inputElement.focus();
      }
    }, 0);
  }

  // 編集を確定して値を保存
  saveEditedValue(): void {
    if (this.editingCell) {
      const columnName = this.getColumnName(this.editingCell.col);
      this.data[this.editingCell.row][columnName] = this.editedValue;
      this.editingCell = null;
      this.editedValue = '';
    }
  }

  // 編集をキャンセル
  cancelEditing(): void {
    this.editingCell = null;
    this.editedValue = '';
  }

  // 列のインデックスから列名を取得
  getColumnName(colIndex: number): string {
    switch (colIndex) {
      case 1:
        return 'Column A';
      case 2:
        return 'Column B';
      case 3:
        return 'Column C';
      default:
        return '';
    }
  }

  // Status列の値を上下キーで変更する (MacのOption + 上下キー用)
  changeStatusValue(direction: 'up' | 'down'): void {
    const currentRow = this.selectedCell.row;
    const currentStatus = this.statuses[currentRow];

    let currentIndex = this.STATUS_OPTIONS.indexOf(currentStatus);

    if (direction === 'down') {
      currentIndex = (currentIndex + 1) % this.STATUS_OPTIONS.length;
    } else if (direction === 'up') {
      currentIndex =
        (currentIndex - 1 + this.STATUS_OPTIONS.length) %
        this.STATUS_OPTIONS.length;
    }

    this.statuses[currentRow] = this.STATUS_OPTIONS[currentIndex];
    this.onStatusChange(currentRow); // 変更イベントをトリガー
  }

  // 行がクリックされたときの処理
  onRowClick(index: number): void {
    this.selectedRowIndex = index;
  }

  // セルがクリックされたときの処理
  onCellClick(rowIndex: number, colIndex: number): void {
    this.selectedCell = { row: rowIndex, col: colIndex };
    if (
      this.isConfirmationMode &&
      this.isChanged(rowIndex) &&
      !this.isConfirmedAndCleared[rowIndex]
    ) {
      this.selectedForConfirmation[rowIndex] =
        !this.selectedForConfirmation[rowIndex];
    }
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
