import { initializeGrid, countNeighbors, randomizeGrid } from './gridUtils';
import type { GameRules } from './types';

export class GameEngine {
  private size: number;
  private grid: number[][];        // текущее состояние
  private prevGrid: number[][];    // для корректного отображения цветов
  private rules: GameRules;
  private generation: number = 0;

  constructor(initialSize: number = 16, initialRules: GameRules = { birth: [3], survival: [2, 3] }) {
    this.size = initialSize;
    this.rules = { birth: [...initialRules.birth], survival: [...initialRules.survival] };
    this.grid = initializeGrid(initialSize);
    this.prevGrid = initializeGrid(initialSize);
  }

  public setSize(newSize: number): void {
    this.size = newSize;
    this.grid = initializeGrid(newSize);
    this.prevGrid = initializeGrid(newSize);
    this.generation = 0;
  }

  public setRules(rules: GameRules): void {
    this.rules = { birth: [...rules.birth], survival: [...rules.survival] };
  }

  public getRules(): GameRules {
    return { birth: [...this.rules.birth], survival: [...this.rules.survival] };
  }

  public getGrid(): number[][] {
    return this.grid.map(row => [...row]);
  }

  public getPrevGrid(): number[][] {
    return this.prevGrid.map(row => [...row]);
  }

  public getSize(): number { return this.size; }
  public getGeneration(): number { return this.generation; }

  public getPopulation(): number {
    return this.grid.flat().filter(cell => cell > 0).length;
  }

  public randomize(): void {
    const randomBase = randomizeGrid(this.grid);
    this.grid = randomBase.map(row => row.map(cell => (cell > 0 ? 2 : 0))); // 2 = только родилась (жёлтая)
    this.prevGrid = initializeGrid(this.size);
    this.generation = 0;
  }

  public clear(): void {
    this.grid = initializeGrid(this.size);
    this.prevGrid = initializeGrid(this.size);
    this.generation = 0;
  }

  public applyShape(template: string[]): void {
    if (!template.length) return;
    const height = template.length;
    const width = Math.max(...template.map(r => r.length));
    const startRow = Math.floor((this.size - height) / 2);
    const startCol = Math.floor((this.size - width) / 2);

    const newGrid = initializeGrid(this.size);
    template.forEach((row, i) => {
      const gridRow = startRow + i;
      if (gridRow < 0 || gridRow >= this.size) return;
      for (let j = 0; j < row.length; j++) {
        const gridCol = startCol + j;
        if (gridCol < 0 || gridCol >= this.size) continue;
        if (row[j] === '■') newGrid[gridRow][gridCol] = 2;
      }
    });

    this.grid = newGrid;
    this.prevGrid = initializeGrid(this.size);
    this.generation = 0;
  }

  public toggleCell(row: number, col: number): void {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) return;
    this.prevGrid = this.grid.map(r => [...r]);
    this.grid[row][col] = this.grid[row][col] > 0 ? 0 : 2;
  }

  private computeNextGrid(): number[][] {
    const newGrid = initializeGrid(this.size);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const neighbors = countNeighbors(this.grid, i, j);
        const current = this.grid[i][j];

        if (current === 0) {
          // Рождение
          if (this.rules.birth.includes(neighbors)) {
            newGrid[i][j] = 2; // жёлтая
          }
        } 
        else if (current === 1) {
          newGrid[i][j] = 0; // окончательно мертва
        } 
        else if (current === 2) {
          // Только родившаяся
          if (this.rules.survival.includes(neighbors)) {
            newGrid[i][j] = 3; // стала стабильной
          } else {
            newGrid[i][j] = 1; // умирает
          }
        } 
        else if (current === 3) {
          // Стабильная
          if (this.rules.survival.includes(neighbors)) {
            newGrid[i][j] = 3;
          } else {
            newGrid[i][j] = 2; // переходит в буфер умирания
          }
        }
      }
    }
    return newGrid;
  }

  public step() {
    const newGrid = this.computeNextGrid();
    const newPopulation = newGrid.flat().filter(c => c > 0).length;
    const newGeneration = this.generation + 1;

    const shouldStop = newPopulation === 0 ||
      this.gridsStructureEqual(newGrid, this.grid) ||
      this.gridsStructureEqual(newGrid, this.prevGrid);

    this.prevGrid = this.grid.map(row => [...row]);
    this.grid = newGrid.map(row => [...row]);
    this.generation = newGeneration;

    return {
      newGrid: this.getGrid(),
      newGeneration,
      newPopulation,
      shouldStop,
    };
  }

  private gridsStructureEqual(a: number[][], b: number[][]): boolean {
    if (a.length !== b.length || a[0].length !== b[0].length) return false;
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a[i].length; j++) {
        if ((a[i][j] > 0) !== (b[i][j] > 0)) return false;
      }
    }
    return true;
  }

  public toJSON() {
    return {
      size: this.size,
      grid: this.grid.map(row => [...row]),
      generation: this.generation,
      rules: this.getRules(),
      date: new Date().toISOString(),
    };
  }

  public loadFromJSON(raw: any): void {
    if (typeof raw !== 'object' || !Array.isArray(raw.grid)) throw new Error('Invalid JSON');

    const newSize = Number(raw.size);
    if (isNaN(newSize) || newSize < 1) throw new Error('Invalid size');

    this.setSize(newSize);

    this.grid = raw.grid.map((row: any) =>
      row.map((cell: any) => {
        const v = Number(cell);
        return (v >= 0 && v <= 3) ? v : 0;
      })
    );

    this.generation = Number(raw.generation) || 0;

    if (raw.rules?.birth && raw.rules?.survival) {
      this.setRules(raw.rules);
    }

    this.prevGrid = initializeGrid(this.size);
  }
}