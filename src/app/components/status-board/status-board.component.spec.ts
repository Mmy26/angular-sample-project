import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms'; // ReactiveFormsModuleをインポート

import { StatusBoardComponent } from './status-board.component';

describe('StatusBoardComponent', () => {
  let component: StatusBoardComponent;
  let fixture: ComponentFixture<StatusBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusBoardComponent],
      imports: [ReactiveFormsModule], // ReactiveFormsModuleを追加
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
