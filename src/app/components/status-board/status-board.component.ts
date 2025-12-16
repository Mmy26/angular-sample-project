import { Component, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { FormGroup, FormControl, Validators } from '@angular/forms';

// タスクアイテムのインターフェース
interface Task {
  id: string; // タスクの一意なID
  content: string; // タスクの内容
  statusId: string; // どのステータスに属するかを示すID (例: 'todoList', 'doneList')
  priority: number; // 各ステータス内での優先度（横方向の並び順）
}

// ステータス列のインターフェース
interface StatusColumn {
  id: string; // ステータスの一意なID (例: 'todoList', 'doneList')
  title: string; // 表示タイトル (例: 'To do', 'Done')
  isRejectColumn?: boolean; // Reject列かどうか
  isRejectEnabled?: boolean; // Reject列が有効かどうか
}

@Component({
  selector: 'app-status-board',
  templateUrl: './status-board.component.html',
  styleUrls: ['./status-board.component.scss'],
})
export class StatusBoardComponent implements OnInit {
  statusColumns: StatusColumn[] = []; // 縦に並ぶステータス列
  tasks: Task[] = []; // 全てのタスクアイテム

  newTaskForm!: FormGroup; // 新しいタスクのフォームグループ
  newColumnForm!: FormGroup; // 新しいステータス列のフォームグループ
  editingTaskForm!: FormGroup; // 編集中のタスクのフォームグループ

  editingTask: {
    taskId: string;
    statusId: string;
    originalContent: string;
    originalPriority: number;
  } | null = null;

  constructor() {}

  ngOnInit(): void {
    this.newTaskForm = new FormGroup({
      content: new FormControl('', Validators.required),
      priority: new FormControl(1, [Validators.required, Validators.min(1)]),
    });

    this.newColumnForm = new FormGroup({
      title: new FormControl('', Validators.required),
    });

    this.editingTaskForm = new FormGroup({
      content: new FormControl('', Validators.required),
      priority: new FormControl(1, [Validators.required, Validators.min(1)]),
    });

    this.statusColumns = [
      { id: 'todoList', title: 'To do' },
      { id: 'doneList', title: 'Done' },
      {
        id: 'rejectList',
        title: 'Reject',
        isRejectColumn: true,
        isRejectEnabled: false,
      },
    ];

    this.tasks = [
      {
        id: 'task-1',
        content: 'Get to work',
        statusId: 'todoList',
        priority: 1,
      },
      {
        id: 'task-2',
        content: 'Pick up groceries',
        statusId: 'todoList',
        priority: 2,
      },
      { id: 'task-3', content: 'Go home', statusId: 'todoList', priority: 3 },
      {
        id: 'task-4',
        content: 'Fall asleep',
        statusId: 'todoList',
        priority: 4,
      },
      { id: 'task-5', content: 'Get up', statusId: 'doneList', priority: 1 },
      {
        id: 'task-6',
        content: 'Brush teeth',
        statusId: 'doneList',
        priority: 2,
      },
      {
        id: 'task-7',
        content: 'Take a shower',
        statusId: 'doneList',
        priority: 3,
      },
      {
        id: 'task-8',
        content: 'Check e-mail',
        statusId: 'doneList',
        priority: 4,
      },
      { id: 'task-9', content: 'Walk dog', statusId: 'doneList', priority: 5 },
    ];

    this.sortTasksInAllColumns();
  }

  // 各ステータス内のタスクを優先度でソートする
  private sortTasksInColumn(statusId: string): void {
    const tasksInStatus = this.tasks
      .filter((task) => task.statusId === statusId)
      .sort((a, b) => a.priority - b.priority);
    tasksInStatus.forEach((task, index) => {
      const originalTaskIndex = this.tasks.findIndex((t) => t.id === task.id);
      if (originalTaskIndex !== -1) {
        this.tasks[originalTaskIndex].priority = index + 1;
      }
    });
  }

  private sortTasksInAllColumns(): void {
    this.statusColumns.forEach((column) => this.sortTasksInColumn(column.id));
  }

  // 指定されたステータスIDに属するタスクを取得し、優先度でソートして返す
  getTasksByStatus(statusId: string): Task[] {
    return this.tasks
      .filter((task) => task.statusId === statusId)
      .sort((a, b) => a.priority - b.priority);
  }

  // 最大の優先度を取得（テーブルの列数を決定）
  getMaxPriority(): number {
    if (this.tasks.length === 0) return 0;
    return Math.max(...this.tasks.map((task) => task.priority));
  }

  // 優先度の配列を取得（テーブルのヘッダー用）
  getPriorityColumns(): number[] {
    const maxPriority = this.getMaxPriority();
    return Array.from({ length: maxPriority }, (_, i) => i + 1);
  }

  // 指定されたステータスと優先度に一致するタスクを取得
  getTaskByStatusAndPriority(statusId: string, priority: number): Task | undefined {
    return this.tasks.find(
      (task) => task.statusId === statusId && task.priority === priority
    );
  }

  // ドロップリストIDを生成
  getDropListId(statusId: string, priority: number): string {
    return `${statusId}-${priority}`;
  }

  // 新しいステータス列を追加
  addColumn(): void {
    if (this.newColumnForm.valid) {
      const newColumnTitle = this.newColumnForm.get('title')?.value.trim();
      const newColumnId =
        newColumnTitle.toLowerCase().replace(/\s/g, '') + 'List';
      this.statusColumns.push({
        id: newColumnId,
        title: newColumnTitle,
      });
      this.newColumnForm.reset(); // フォームをクリア
      this.newColumnForm.get('title')?.setValue(''); // タイトルを空に設定
    }
  }

  // ドラッグ＆ドロップで接続可能なリストのIDを全て返す（テーブル用）
  getConnectedListIds(): string[] {
    const ids: string[] = [];
    const maxPriority = this.getMaxPriority();
    
    this.statusColumns.forEach((column) => {
      for (let priority = 1; priority <= maxPriority; priority++) {
        ids.push(this.getDropListId(column.id, priority));
      }
    });
    
    return ids;
  }

  // タスクのドラッグ＆ドロップ処理（テーブル用）
  drop(event: CdkDragDrop<{ statusId: string; priority: number }>): void {
    const previousData = event.previousContainer.data;
    const currentData = event.container.data;

    const previousStatusColumn = this.statusColumns.find(
      (col) => col.id === previousData.statusId
    );
    const currentStatusColumn = this.statusColumns.find(
      (col) => col.id === currentData.statusId
    );

    if (!previousStatusColumn || !currentStatusColumn) {
      return;
    }

    // Reject列がOFFの場合の移動と並べ替えの制御
    if (
      currentStatusColumn.isRejectColumn &&
      !currentStatusColumn.isRejectEnabled
    ) {
      alert('Reject列は現在OFFのため、タスクを移動できません。');
      return;
    }
    if (
      previousStatusColumn.isRejectColumn &&
      !previousStatusColumn.isRejectEnabled
    ) {
      alert('Reject列がOFFのため、タスクを移動できません。');
      return;
    }

    // 移動元のタスクを取得
    const movedTask = this.getTaskByStatusAndPriority(
      previousData.statusId,
      previousData.priority
    );

    if (!movedTask) {
      return;
    }

    // 同じステータス、同じ優先度の場合は何もしない
    if (
      previousData.statusId === currentData.statusId &&
      previousData.priority === currentData.priority
    ) {
      return;
    }

    // 移動先にすでにタスクがある場合は入れ替え
    const targetTask = this.getTaskByStatusAndPriority(
      currentData.statusId,
      currentData.priority
    );

    const movedTaskIndex = this.tasks.findIndex((t) => t.id === movedTask.id);

    if (targetTask) {
      // 入れ替え
      const targetTaskIndex = this.tasks.findIndex((t) => t.id === targetTask.id);
      this.tasks[targetTaskIndex].statusId = previousData.statusId;
      this.tasks[targetTaskIndex].priority = previousData.priority;
    }

    // 移動したタスクを更新
    this.tasks[movedTaskIndex].statusId = currentData.statusId;
    this.tasks[movedTaskIndex].priority = currentData.priority;
  }

  // 新しいタスクを追加
  addTask(statusColumn: StatusColumn): void {
    if (this.newTaskForm.valid) {
      const newTaskContent = this.newTaskForm.get('content')?.value.trim();
      const newTaskPriority = this.newTaskForm.get('priority')?.value;

      const newTaskId = `task-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`; // ユニークなIDを生成
      const tasksInColumn = this.getTasksByStatus(statusColumn.id);
      const newPriority =
        tasksInColumn.length > 0
          ? Math.max(...tasksInColumn.map((t) => t.priority)) + 1
          : 1;

      this.tasks.push({
        id: newTaskId,
        content: newTaskContent,
        statusId: statusColumn.id,
        priority: newTaskPriority,
      });
      this.sortTasksInColumn(statusColumn.id); // 追加したカラムのタスクをソート
      this.newTaskForm.reset(); // フォームをクリア
      this.newTaskForm.get('priority')?.setValue(1); // 優先度をデフォルト値に戻す
    }
  }

  // タスクの編集モードを開始
  editTask(
    taskId: string,
    statusId: string,
    currentContent: string,
    currentPriority: number
  ): void {
    this.editingTask = {
      taskId,
      statusId,
      originalContent: currentContent,
      originalPriority: currentPriority,
    };
    this.editingTaskForm.setValue({
      content: currentContent,
      priority: currentPriority,
    });
  }

  // タスクを保存
  saveTask(taskId: string): void {
    if (this.editingTaskForm.valid) {
      const newContent = this.editingTaskForm.get('content')?.value.trim();
      const newPriority = this.editingTaskForm.get('priority')?.value;

      const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
      if (taskIndex !== -1 && newContent) {
        this.tasks[taskIndex].content = newContent;
        this.tasks[taskIndex].priority = newPriority;
        this.sortTasksInColumn(this.tasks[taskIndex].statusId); // 変更したタスクのカラムをソート
      }
      this.editingTask = null;
      this.editingTaskForm.reset();
    }
  }

  // タスクの編集をキャンセル
  cancelEdit(): void {
    if (this.editingTask) {
      const taskIndex = this.tasks.findIndex(
        (task) => task.id === this.editingTask?.taskId
      );
      if (taskIndex !== -1) {
        this.tasks[taskIndex].content = this.editingTask.originalContent;
        this.tasks[taskIndex].priority = this.editingTask.originalPriority;
        this.sortTasksInColumn(this.editingTask.statusId); // 編集前の値に戻した後、ソートし直す
      }
      this.editingTask = null;
      this.editingTaskForm.reset();
    }
  }

  // タスクを削除
  deleteTask(taskId: string): void {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex !== -1) {
      const statusIdOfDeletedTask = this.tasks[taskIndex].statusId;
      this.tasks.splice(taskIndex, 1);
      this.sortTasksInColumn(statusIdOfDeletedTask); // 削除したカラムのタスクをソート
    }
  }
}
