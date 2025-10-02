import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDropList } from '@angular/cdk/drag-drop';

interface Column {
  id: string;
  title: string;
  data: string[];
  isRejectColumn?: boolean;
  isRejectEnabled?: boolean;
}

@Component({
  selector: 'app-task-management',
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.scss']
})
export class TaskManagementComponent implements OnInit {
  columns: Column[] = [];
  newTask: string = '';
  newColumnTitle: string = ''; // 新しいカラムのタイトル用プロパティ
  editingTask: { columnId: string, index: number, originalValue: string } | null = null;

  constructor() { }

  ngOnInit(): void {
    this.columns = [
      { id: 'todoList', title: 'To do', data: ['Get to work', 'Pick up groceries', 'Go home', 'Fall asleep'] },
      { id: 'doneList', title: 'Done', data: ['Get up', 'Brush teeth', 'Take a shower', 'Check e-mail', 'Walk dog'] },
      { id: 'rejectList', title: 'Reject', data: [], isRejectColumn: true, isRejectEnabled: false }
    ];
  }

  addColumn() {
    if (this.newColumnTitle.trim()) {
      const newColumnId = this.newColumnTitle.trim().toLowerCase().replace(/\s/g, '') + 'List';
      this.columns.push({
        id: newColumnId,
        title: this.newColumnTitle.trim(),
        data: []
      });
      this.newColumnTitle = ''; // 入力フィールドをクリア
    }
  }

  getConnectedListIds(): string[] {
    return this.columns.map(column => column.id);
  }

  drop(event: CdkDragDrop<string[]>) {
    const previousColumn = this.columns.find(col => col.id === event.previousContainer.id);
    const currentColumn = this.columns.find(col => col.id === event.container.id);

    if (!previousColumn || !currentColumn) {
      return;
    }

    // Reject列がOFFの場合の移動と並べ替えの制御
    if (currentColumn.isRejectColumn && !currentColumn.isRejectEnabled) {
      alert('Reject列は現在OFFのため、タスクを移動できません。');
      return;
    }
    if (previousColumn.isRejectColumn && !previousColumn.isRejectEnabled) {
      alert('Reject列がOFFのため、タスクを移動できません。');
      return;
    }
    if (currentColumn.isRejectColumn && currentColumn.id === event.previousContainer.id && !currentColumn.isRejectEnabled) {
      alert('Reject列がOFFのため、タスクの並べ替えはできません。');
      return;
    }


    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  addTask(column: Column) {
    if (this.newTask.trim()) {
      column.data.push(this.newTask.trim());
      this.newTask = '';
    }
  }

  editTask(columnId: string, index: number, item: string) {
    this.editingTask = { columnId, index, originalValue: item };
  }

  saveTask(columnId: string, index: number, newValue: string) {
    const column = this.columns.find(col => col.id === columnId);
    if (column && newValue.trim()) {
      column.data[index] = newValue.trim();
    }
    this.editingTask = null;
  }

  cancelEdit() {
    if (this.editingTask) {
      const column = this.columns.find(col => col.id === this.editingTask?.columnId);
      if (column) {
        column.data[this.editingTask.index] = this.editingTask.originalValue;
      }
      this.editingTask = null;
    }
  }

  deleteTask(columnId: string, index: number) {
    const column = this.columns.find(col => col.id === columnId);
    if (column) {
      column.data.splice(index, 1);
    }
  }
}
