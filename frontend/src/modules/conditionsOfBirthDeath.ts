import { countNeighbors } from './countNeighbors';
import { initializeGrid } from './initializeGrid'; // для типа

export function nextGeneration(grid: number[][], countNeinghSurvive: string, countNeinghBirth: string): number[][] {
  const size = grid.length;
  const newGrid = initializeGrid(size); // все 0

  const [first, second] = countNeinghSurvive.split('/').map(Number); //передаются из списка соседей для выживания
  const forBirth = +countNeinghBirth; //передаются из списка соседей для рождения


  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const neighbors = countNeighbors(grid, i, j); // считаем только живые (age > 0)
      const isAlive = grid[i][j] > 0;
      const currentAge = grid[i][j];

      if (isAlive) {
        if (neighbors === first || neighbors === second) {
          newGrid[i][j] = currentAge + 1; // выживает — стареет
        } else {
          newGrid[i][j] = 0; // умирает
        }
      } else {
        if (neighbors === forBirth) {
          newGrid[i][j] = 1; // рождается — возраст 1
        }
      }
    }
  }

  return newGrid;
}