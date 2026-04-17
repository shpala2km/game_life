export type ShapeTemplate = string[];

export const SHAPE_TEMPLATES: Record<string, ShapeTemplate> = {
  glider: [' ■ ', '  ■', '■■■'],
  blinker: ['■■■'],
  toad: [' ■■■', '■■■ '],
  beacon: ['■■  ', '■■  ', '  ■■', '  ■■'],
pulsar: [
    '  ■■■   ■■■  ',
    '             ',
    '■    ■ ■    ■',
    '■    ■ ■    ■',
    '■    ■ ■    ■',
    '  ■■■   ■■■  ',
    '             ',
    '  ■■■   ■■■  ',
    '■    ■ ■    ■',
    '■    ■ ■    ■',
    '■    ■ ■    ■',
    '             ',
    '  ■■■   ■■■  ',
  ],
  block: ['■■', '■■'],
  beehive: [' ■■ ', '■  ■', ' ■■ '],
  loaf: [' ■■ ', '■  ■', ' ■ ■', '  ■ '],
  boat: ['■■ ', '■ ■', ' ■ '],
  // Добавляй свои шаблоны сюда
};