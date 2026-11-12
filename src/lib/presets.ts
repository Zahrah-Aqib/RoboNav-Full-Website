import { GridState, createGrid, key } from './grid';

export interface PresetMap {
  id: string;
  name: string;
  description: string;
  build: () => GridState;
}

function fromRows(id: string, name: string, description: string, rows: string[]): PresetMap {
  return {
    id,
    name,
    description,
    build: () => {
      const grid = createGrid(rows.length, rows[0].length);
      grid.walls.clear();
      rows.forEach((line, r) => {
        line.split('').forEach((ch, c) => {
          if (ch === '#') grid.walls.add(key({ row: r, col: c }));
          else if (ch === 'S') grid.start = { row: r, col: c };
          else if (ch === 'G') grid.goal = { row: r, col: c };
        });
      });
      return grid;
    },
  };
}

const emptyField: PresetMap = {
  id: 'empty',
  name: 'Empty Field',
  description: 'Open grid with no obstacles. Both algorithms expand a similar area.',
  build: () => createGrid(12, 16),
};

const corridorWall: PresetMap = fromRows(
  'corridor',
  'Corridor Wall',
  'A vertical wall with two gaps — tests detour behaviour.',
  [
    'S............',
    '.#.......##..',
    '.#.......##..',
    '.#........#..',
    '.#....#####..',
    '.............',
    '......#......',
    '.#####.......',
    '.....#..#....',
    '.#...#..#....',
    '.#...#..G....',
    '.............',
  ]
);

const mazeRooms: PresetMap = fromRows(
  'rooms',
  'Maze Rooms',
  'Separate rooms with narrow doorways — greedy search can wander.',
  [
    'S..#.....#..G',
    '...#..#..#...',
    '##.#..#..#.##',
    '......#......',
    '#..###..###..',
    '#............',
    '..####.####..',
    '....#.....#..',
    '##.#.#.###.#.',
    '.............',
    '.#.##....##.#',
    '.............',
  ]
);

const scatter: PresetMap = fromRows(
  'scatter',
  'Scattered Blocks',
  'Uniform random-looking blocks — highlights explored-cell differences.',
  [
    'S....#...#...',
    '.....#...#...',
    '.##..#...#...',
    '.##..#.###...',
    '.....#...#..G',
    '.#...#...#...',
    '.#...#...#...',
    '.#...#####...',
    '.#...........',
    '.#######.....',
    '..........###',
    '..........###',
  ]
);

const snareTrap: PresetMap = fromRows(
  'trap',
  'Greedy Trap',
  'A concave pocket that lures greedy search away from the true route.',
  [
    'S............',
    '.#####.#####.',
    '.....#.#.....',
    '.....#.#.....',
    '..G..#.#.....',
    '.....#.#.....',
    '.....#.#.....',
    '.#####.#####.',
    '.............',
  ]
);

export const PRESETS: PresetMap[] = [emptyField, corridorWall, mazeRooms, scatter, snareTrap];

export function presetById(id: string): PresetMap | undefined {
  return PRESETS.find((p) => p.id === id);
}
