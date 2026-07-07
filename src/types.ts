export interface Vector2D {
  x: number;
  y: number;
}

export interface Player {
  pos: Vector2D;
  speed: number;
  sprintSpeed: number;
  radius: number;
  stamina: number;
  maxStamina: number;
  isSprinting: boolean;
  angle: number; // 面朝角度，用來渲染角色指向與平滑轉向
}

export type EnemyState = 'PATROL' | 'CHASE';

export interface Enemy {
  id: number;
  pos: Vector2D;
  speed: number;
  chaseSpeed: number;
  radius: number;
  state: EnemyState;
  patrolWaypoints: Vector2D[];
  currentWaypointIndex: number;
  angle: number;
  color: string;
  spottedPlayer: boolean;
  isLocked?: boolean;
}

export interface Item {
  pos: Vector2D;
  radius: number;
  isCollected: boolean;
  pulseTimer: number; // 用於視覺閃爍效果
}

export interface Exit {
  pos: Vector2D;
  width: number;
  height: number;
  isUnlocked: boolean;
}

export type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

export interface GameParticle {
  pos: Vector2D;
  vel: Vector2D;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  maxLife: number;
  life: number;
}

export interface Obstacle {
  pos: Vector2D;
  width: number;
  height: number;
}
