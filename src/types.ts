export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  duration: string;
  type: 'ambient' | 'lofi' | 'fast' | 'spotify';
  waveform: number[];
}

export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

export type GameState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Point {
  x: number;
  y: number;
}
