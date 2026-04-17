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