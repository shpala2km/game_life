export function initializeGrid(size: number): number[][] {
  return Array.from({ length: size }, () => Array(size).fill(0));
}

export function countNeighbors(grid: number[][], x: number, y: number): number {
  const size = grid.length;
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) continue;
      const nx = (x + i + size) % size;
      const ny = (y + j + size) % size;
      if (grid[nx][ny] > 0) count++;
    }
  }
  return count;
}

export function randomizeGrid(grid: number[][]): number[][] {
  const size = grid.length;
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => (Math.random() > 0.5 ? 1 : 0))
  );
}

export function clearGrid(size: number): number[][] {
  return initializeGrid(size);
}