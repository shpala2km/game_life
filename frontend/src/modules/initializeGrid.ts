export function initializeGrid(size: number): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
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