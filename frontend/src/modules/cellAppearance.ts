export function getCellClass(state: number): string {
  switch (state) {
    case 0: return 'dead';   // белая
    case 1: return 'dying';  // красная
    case 2: return 'born';   // жёлтая
    case 3: return 'alive';  // зелёная
    default: return 'dead';
  }
}