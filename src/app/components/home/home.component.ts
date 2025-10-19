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
  public items: any[] = Array(20).fill(0); // 20個のフォームを作成するためのダミー配列
  public data: { [key: string]: string }[] = []; // 新しいデータ項目を追加
  public initialData: { [key: string]: string }[] = []; // データの初期値を保持

  public isConfirmationMode: boolean = false; // 確認モードのON/OFF
  public selectedForConfirmation: boolean[] = []; // 確認モードで選択されたセル
  public isConfirmedAndCleared: boolean[] = []; // 最終的に確定されて文字が消えたセル
  public selectedRowIndex: number | null = null; // 選択された行のインデックス

  public selectedCell: { row: number; col: number } = { row: 0, col: 0 }; // 選択されたセルの行と列
  public editingCell: { row: number; col: number } | null = null; // 編集中のセルの行と列
  public editedValue: string = ''; // 編集中のセルの値
  @ViewChildren('dataCell') dataCells!: QueryList<ElementRef>;
  @ViewChildren('statusSelect') statusSelects!: QueryList<ElementRef>; // すべてのSelectbox要素への参照

  // 【重要】テーブルの列構成を変更する際の定数定義
  // home.component.html のコメントと合わせて変更してください。

  // テーブル全体の列数 (0-indexedのため、実際の列数より1大きい値)
  // 例: Index(1) + 追加列(10) + Input/Selectパターン(6*3=18) = 29列。0-indexedなので29。
  //     つまり、実際の列数は `NUM_COLUMNS` の値 + 1 となります。
  // 列数を変更する場合は、この値を再計算して更新してください。
  private readonly NUM_COLUMNS = 29; // Status列削除に伴い31 -> 29に変更 (Index 1 + 追加10 + Input/Select 18 = 29)

  // 追加列の数
  // home.component.html の `[].constructor(10)` の `10` と同じ値にしてください。
  private readonly ADDED_COLUMNS_COUNT = 10;

  // Selectboxの選択肢 (Status列の選択肢を流用)
  private readonly SELECT_OPTIONS = ['OK', 'NG'];

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    // 初期値を設定
    this.items.forEach((_, index) => {
      this.selectedForConfirmation.push(false); // 最初はすべて未選択
      this.isConfirmedAndCleared.push(false); // 最初はすべて未確定・未クリア

      // 新しいデータ項目を初期化
      const rowData: { [key: string]: string } = {};
      // 追加列のデータを初期化 (Column 1 から Column 10)
      for (let col = 1; col <= this.ADDED_COLUMNS_COUNT; col++) {
        rowData[`Column ${col}`] = `AddValue ${col}-${index + 1}`;
      }

      // 既存のInput/Select列のデータを初期化 (Column 11 から Column 28)
      // 既存のInput 2列 + Select 1列 のパターンを6回繰り返す
      for (let k = 0; k < 6; k++) {
        const baseColIndex = this.ADDED_COLUMNS_COUNT + k * 3 + 1; // 10 (追加列) + k*3 + 1
        rowData[`Column ${baseColIndex}`] = `Value ${baseColIndex}-${
          index + 1
        }`; // Input 1
        rowData[`Column ${baseColIndex + 1}`] = `Value ${baseColIndex + 1}-${
          index + 1
        }`; // Input 2
        rowData[`Column ${baseColIndex + 2}`] = index % 2 === 0 ? 'OK' : 'NG'; // Select
      }

      this.data.push(rowData);
      this.initialData.push({ ...rowData }); // 初期データをディープコピーで保存
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
    // MacでOption + 上下キーでSelectboxの値を変更
    else if (
      event.altKey &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown')
    ) {
      if (
        this.isSelectColumn(this.selectedCell.col) &&
        !this.isConfirmationMode
      ) {
        event.preventDefault();
        this.changeSelectValue(
          this.selectedCell.row,
          this.selectedCell.col,
          event.key === 'ArrowUp' ? 'up' : 'down'
        );
      }
    }
    // WindowsでAlt + DownでSelectboxのドロップダウンを開く
    else if (event.altKey && event.key === 'ArrowDown') {
      if (this.isSelectColumn(this.selectedCell.col)) {
        event.preventDefault();
        this.openSelectDropdown(this.selectedCell.row, this.selectedCell.col);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.editingCell) {
        // 編集中のセルがある場合は編集を確定し、真下のセルに移動
        this.saveEditedValueAndMoveDown();
      } else if (
        this.isSelectColumn(this.selectedCell.col) &&
        !this.isConfirmationMode
      ) {
        // Selectbox列でEnterが押された場合、真下のセルに移動
        this.moveSelection('ArrowDown');
      } else if (
        this.isConfirmationMode &&
        this.isSelectColumn(this.selectedCell.col) &&
        this.isChanged(this.selectedCell.row, this.selectedCell.col) &&
        !this.isConfirmedAndCleared[this.selectedCell.row]
      ) {
        // 確認モードでSelectbox列のセルが選択されており、変更があり、かつ未確定の場合
        this.selectedForConfirmation[this.selectedCell.row] =
          !this.selectedForConfirmation[this.selectedCell.row];
      }
    } else if (event.key === 'Escape' && this.editingCell) {
      // Escapeキーで編集をキャンセル
      event.preventDefault();
      this.cancelEditing();
    }
  }

  moveSelection(key: string): void {
    let newRow = this.selectedCell.row;
    let newCol = this.selectedCell.col;

    const isFocusableColumn = (col: number): boolean => {
      return col > this.ADDED_COLUMNS_COUNT; // Input/Select列
    };

    switch (key) {
      case 'ArrowUp':
        newRow = Math.max(0, newRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(this.items.length - 1, newRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, newCol - 1);
        // フォーカスできない列をスキップ
        while (newCol > 0 && !isFocusableColumn(newCol)) {
          newCol--;
        }
        // もしIndex列 (0) に到達したら、最初のフォーカス可能な列に移動
        if (newCol === 0 && !isFocusableColumn(newCol)) {
          newCol = this.ADDED_COLUMNS_COUNT + 1; // 最初のInput列
        }
        break;
      case 'ArrowRight':
        newCol = Math.min(this.NUM_COLUMNS - 1, newCol + 1);
        // フォーカスできない列をスキップ
        while (newCol < this.NUM_COLUMNS - 1 && !isFocusableColumn(newCol)) {
          newCol++;
        }
        break;
    }

    this.selectedCell = { row: newRow, col: newCol };
    this.focusSelectedCell();
  }

  focusSelectedCell(): void {
    // DOMが更新されるのを待ってからフォーカスを当てる
    setTimeout(() => {
      // Index列 (0) を除く各行の<td>要素の総数
      const cellsPerRow = this.NUM_COLUMNS - 1;
      const cellIndex =
        this.selectedCell.row * cellsPerRow + this.selectedCell.col;
      const cellElement = this.dataCells.toArray()[cellIndex];
      if (cellElement) {
        const nativeElement = cellElement.nativeElement as HTMLElement;
        // Index列 (0) または追加列 (1-10) の場合はフォーカスしない
        if (
          this.selectedCell.col === 0 ||
          (this.selectedCell.col > 0 &&
            this.selectedCell.col <= this.ADDED_COLUMNS_COUNT)
        ) {
          return;
        }

        // Selectbox列の場合、select要素にフォーカスを当てる
        if (this.isSelectColumn(this.selectedCell.col)) {
          const selectElement = nativeElement.querySelector('select');
          if (selectElement) {
            selectElement.focus();
          }
        } else if (
          this.selectedCell.col > this.ADDED_COLUMNS_COUNT && // 追加列より大きい
          this.selectedCell.col < this.NUM_COLUMNS &&
          !this.isSelectColumn(this.selectedCell.col) // Select列ではない場合
        ) {
          // Input列にフォーカスが当たった場合、編集モードを開始
          this.startEditing(this.selectedCell.row, this.selectedCell.col);
        }
      }
    }, 0);
  }

  // Selectbox列かどうかを判定するヘルパー
  isSelectColumn(colIndex: number): boolean {
    // Input 2列 + Select 1列 のパターンで、Select列は (colIndex - 1 - ADDED_COLUMNS_COUNT) % 3 === 2 となる
    return (
      colIndex > this.ADDED_COLUMNS_COUNT &&
      (colIndex - 1 - this.ADDED_COLUMNS_COUNT) % 3 === 2
    );
  }

  // Alt + DownでSelectboxのドロップダウンを開く
  openSelectDropdown(rowIndex: number, colIndex: number): void {
    // `statusSelects` は QueryList<ElementRef> なので、nativeElement を直接取得
    // `dataCells` から該当するtd要素を取得し、その中のselect要素を探す
    const cellsPerRow = this.NUM_COLUMNS - 1;
    const cellIndex = rowIndex * cellsPerRow + colIndex;
    const cellElement = this.dataCells.toArray()[cellIndex];

    if (cellElement) {
      const selectElement = cellElement.nativeElement.querySelector('select');
      if (selectElement) {
        selectElement.focus(); // フォーカスを当ててから
        selectElement.click(); // クリックイベントを発生させてドロップダウンを開く
      }
    }
  }

  // 編集モードを開始
  startEditing(row: number, col: number): void {
    // Index列 (0) または追加列 (1-10) の場合は編集モードを開始しない
    if (col === 0 || (col > 0 && col <= this.ADDED_COLUMNS_COUNT)) {
      return;
    }

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

  // 編集を確定して値を保存し、真下のセルに移動
  saveEditedValueAndMoveDown(): void {
    this.saveEditedValue();
    this.moveSelection('ArrowDown'); // 真下のセルに移動
  }

  // 編集を確定して値を保存 (移動なし)
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
    // Index列 (0) はデータを持たない
    if (colIndex === 0) {
      return '';
    }
    // Input列、Select列はすべてデータを持つ
    return `Column ${colIndex}`;
  }

  // Selectboxの値を上下キーで変更する (MacのOption + 上下キー用)
  changeSelectValue(
    rowIndex: number,
    colIndex: number,
    direction: 'up' | 'down'
  ): void {
    const columnName = this.getColumnName(colIndex);
    const currentStatus = this.data[rowIndex][columnName];

    let currentIndex = this.SELECT_OPTIONS.indexOf(currentStatus);

    if (direction === 'down') {
      currentIndex = (currentIndex + 1) % this.SELECT_OPTIONS.length;
    } else if (direction === 'up') {
      currentIndex =
        (currentIndex - 1 + this.SELECT_OPTIONS.length) %
        this.SELECT_OPTIONS.length;
    }

    this.data[rowIndex][columnName] = this.SELECT_OPTIONS[currentIndex];
    this.onStatusChange(rowIndex, colIndex); // 変更イベントをトリガー
  }

  // 行がクリックされたときの処理
  onRowClick(index: number): void {
    this.selectedRowIndex = index;
  }

  // セルがクリックされたときの処理
  onCellClick(rowIndex: number, colIndex: number): void {
    this.selectedCell = { row: rowIndex, col: colIndex };
    // Selectbox列で、確認モードがON、かつ変更があり、かつ未確定の場合のみ選択状態を切り替える
    if (
      this.isSelectColumn(this.selectedCell.col) &&
      this.isConfirmationMode &&
      this.isChanged(rowIndex, colIndex) &&
      !this.isConfirmedAndCleared[rowIndex]
    ) {
      this.selectedForConfirmation[rowIndex] =
        !this.selectedForConfirmation[rowIndex];
    }
  }

  // フォームの値が初期値から変更されたかどうか
  isChanged(rowIndex: number, colIndex: number): boolean {
    const columnName = this.getColumnName(colIndex);
    return (
      this.data[rowIndex][columnName] !== this.initialData[rowIndex][columnName]
    );
  }

  // フォームの選択が変更されたときの処理
  onStatusChange(rowIndex: number, colIndex: number): void {
    // 変更があった場合は、確認モードの選択状態と最終確定状態をリセット
    this.selectedForConfirmation[rowIndex] = false;
    this.isConfirmedAndCleared[rowIndex] = false;
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
        // 確定された値を新しい初期値として設定
        // Selectbox列の値を更新する必要があるため、すべてのSelectbox列をループ
        for (
          let col = this.ADDED_COLUMNS_COUNT + 1;
          col < this.NUM_COLUMNS;
          col++
        ) {
          if (this.isSelectColumn(col)) {
            const columnName = this.getColumnName(col);
            this.initialData[index][columnName] = this.data[index][columnName];
          }
        }
        this.selectedForConfirmation[index] = false; // 選択状態をリセット
      }
    });
    this.isConfirmationMode = false; // 確認モードを終了
  }

  // Selectboxのキーダウンイベント
  onStatusSelectKeydown(
    event: KeyboardEvent,
    rowIndex: number,
    colIndex: number
  ): void {
    if (this.isConfirmationMode) {
      event.preventDefault(); // 確認モード中はキー入力を無効にする
    }
  }
}
