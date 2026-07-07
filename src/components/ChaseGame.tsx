import React, { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { 
  Play, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Key, 
  ShieldAlert, 
  DoorOpen, 
  Timer, 
  Zap, 
  MapPin, 
  Skull, 
  Trophy,
  ArrowUp,
  HelpCircle,
  Clock,
  Gamepad2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Home
} from 'lucide-react';
import { 
  Vector2D, 
  Player, 
  Enemy, 
  Item, 
  Exit, 
  GameStatus, 
  GameParticle, 
  Obstacle 
} from '../types';

const getPublicAssetUrl = (assetPath: string) => {
  const baseUrl = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  return `${baseUrl}${assetPath.replace(/^\/+/, '')}`;
};

// ==========================================
// ==========================================
// 整合 Howler.js 與 瀏覽器 Web Audio API
// ==========================================
class SoundSynth {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private bgmInterval: any = null;
  private bgmStep: number = 0;

  // Howler 音效實例 (對應 /public/sounds/...)
  private bgm: Howl | null = null;
  private keySound: Howl | null = null;
  private bingoSound: Howl | null = null;
  private alertSound: Howl | null = null;
  private deathSound: Howl | null = null;
  private victorySound: Howl | null = null;
  private sprintSound: Howl | null = null;

  // 是否成功載入 Howler 音效 (未載入或 404 時自動降級)
  private hasBgmLoaded: boolean = false;
  private hasKeyLoaded: boolean = false;
  private hasBingoLoaded: boolean = false;
  private hasAlertLoaded: boolean = false;
  private hasDeathLoaded: boolean = false;
  private hasVictoryLoaded: boolean = false;
  private hasSprintLoaded: boolean = false;

  constructor() {
    this.initHowler();
  }

  private initHowler() {
    try {
      // 科技感 Synthwave 背景音樂 (Loop)
      this.bgm = new Howl({
        src: [getPublicAssetUrl('sounds/bgm.wav.mp3'), getPublicAssetUrl('sounds/bgm.mp3'), getPublicAssetUrl('sounds/bgm.wav')],
        loop: true,
        volume: 0.3,
        html5: true,
        onload: () => { this.hasBgmLoaded = true; },
        onloaderror: () => { this.hasBgmLoaded = false; }
      });

      // 拾取智慧鎖金鑰音效
      this.keySound = new Howl({
        src: [getPublicAssetUrl('sounds/key.wav'), getPublicAssetUrl('sounds/key.mp3')],
        volume: 0.4,
        onload: () => { this.hasKeyLoaded = true; },
        onloaderror: () => { this.hasKeyLoaded = false; }
      });

      // 答對 Bingo 音效
      this.bingoSound = new Howl({
        src: [getPublicAssetUrl('sounds/bingo.wav'), getPublicAssetUrl('sounds/bingo.mp3')],
        volume: 0.5,
        onload: () => { this.hasBingoLoaded = true; },
        onloaderror: () => { this.hasBingoLoaded = false; }
      });

      // 被鎖定警報音效
      this.alertSound = new Howl({
        src: [getPublicAssetUrl('sounds/alert.wav'), getPublicAssetUrl('sounds/alert.mp3')],
        volume: 0.45,
        onload: () => { this.hasAlertLoaded = true; },
        onloaderror: () => { this.hasAlertLoaded = false; }
      });

      // 玩家死亡音效
      this.deathSound = new Howl({
        src: [getPublicAssetUrl('sounds/death.wav'), getPublicAssetUrl('sounds/death.mp3')],
        volume: 0.5,
        onload: () => { this.hasDeathLoaded = true; },
        onloaderror: () => { this.hasDeathLoaded = false; }
      });

      // 勝利逃脫音效
      this.victorySound = new Howl({
        src: [getPublicAssetUrl('sounds/victory.wav'), getPublicAssetUrl('sounds/victory.mp3')],
        volume: 0.5,
        onload: () => { this.hasVictoryLoaded = true; },
        onloaderror: () => { this.hasVictoryLoaded = false; }
      });

      // 衝刺推進音效
      this.sprintSound = new Howl({
        src: [getPublicAssetUrl('sounds/sprint.wav'), getPublicAssetUrl('sounds/sprint.mp3')],
        volume: 0.35,
        onload: () => { this.hasSprintLoaded = true; },
        onloaderror: () => { this.hasSprintLoaded = false; }
      });
    } catch (e) {
      console.warn("Howler 初始化失敗，將完全啟用原生 Web Audio API 合成音效", e);
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 播放拾取鑰匙音效
  playKeyPick() {
    if (!this.enabled) return;

    if (this.keySound && this.hasKeyLoaded) {
      try {
        this.keySound.play();
        return;
      } catch (e) {
        // 播放失敗時退回 Web Audio
      }
    }

    // Fallback: Web Audio API
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6
    
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.25);
  }

  // 播放 Bingo (答對問題) 歡快音效
  playBingo() {
    if (!this.enabled) return;

    if (this.bingoSound && this.hasBingoLoaded) {
      try {
        this.bingoSound.play();
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Fallback: Web Audio API
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 1046.50]; // E5, C6
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      osc.frequency.linearRampToValueAtTime(freq * 1.02, now + idx * 0.12 + 0.15);

      gain.gain.setValueAtTime(0.18, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }

  // 播放被鎖定警報音效
  playAlert() {
    if (!this.enabled) return;

    if (this.alertSound && this.hasAlertLoaded) {
      try {
        this.alertSound.play();
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Fallback: Web Audio API
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.setValueAtTime(660, now + 0.08); // E5
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 播放死亡（遊戲結束）音效
  playDeath() {
    if (!this.enabled) return;

    this.stopBGM();

    if (this.deathSound && this.hasDeathLoaded) {
      try {
        this.deathSound.play();
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Fallback: Web Audio API
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.9);
  }

  // 播放勝利音效
  playVictory() {
    if (!this.enabled) return;

    this.stopBGM();

    if (this.victorySound && this.hasVictoryLoaded) {
      try {
        this.victorySound.play();
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Fallback: Web Audio API
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C大調琶音
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.12, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  // 播放衝刺推進音效
  playSprintBurst() {
    if (!this.enabled) return;

    if (this.sprintSound && this.hasSprintLoaded) {
      try {
        this.sprintSound.play();
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Fallback: Web Audio API
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(250, now + 0.15);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // 原生 Web Audio API 低音合成循環音序器 (背景 BGM Fallback 方案)
  private playBgmTick() {
    if (!this.ctx || this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;
    
    const bassline = [
      65.41,  65.41,  77.78,  87.31, // C2, C2, Eb2, F2
      65.41,  65.41,  58.27,  98.00  // C2, C2, Bb1, G2
    ];
    
    const freq = bassline[this.bgmStep % bassline.length];
    this.bgmStep++;
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(1.5, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      osc.frequency.exponentialRampToValueAtTime(freq * 0.97, now + 0.16);
      
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      // 忽略
    }
  }

  // 播放/停止 背景音樂
  startBGM() {
    if (!this.enabled) return;

    if (this.bgm) {
      try {
        if (!this.bgm.playing()) {
          this.bgm.play();
        }
        // 如果 BGM 被正確喚起，我們可以停止 Fallback
        if (this.bgmInterval) {
          clearInterval(this.bgmInterval);
          this.bgmInterval = null;
        }
        return;
      } catch (e) {
        // 容錯並使用 Fallback BGM
      }
    }

    // Fallback: 科技感 Synthwave Bassline 節奏 Loop
    this.initCtx();
    if (!this.ctx) return;
    if (this.bgmInterval) return;

    this.bgmStep = 0;
    try {
      this.playBgmTick();
      this.bgmInterval = setInterval(() => {
        this.playBgmTick();
      }, 200);
    } catch (e) {
      console.warn("Fallback BGM 啟動失敗:", e);
    }
  }

  stopBGM() {
    // 停止 Howler BGM
    if (this.bgm) {
      try {
        this.bgm.stop();
      } catch (e) {}
    }

    // 停止 Fallback BGM
    if (this.bgmInterval) {
      try {
        clearInterval(this.bgmInterval);
      } catch (e) {}
      this.bgmInterval = null;
    }
  }
}

const synth = new SoundSynth();

interface QuizData {
  question: string;
  options: string[];
  answerIndex: number;
}

const QUIZ_DATABASE: {
  [key in 'EASY' | 'NORMAL' | 'HARD']: {
    KEY_LICENSE: QuizData[];
    KEY_LAND: QuizData[];
    EXIT: QuizData[];
  }
} = {
  EASY: {
    KEY_LICENSE: [
      {
        question: "使用牌照稅於每年幾月份開徵?",
        options: ["(A) 4月", "(B) 8月", "(C) 5月", "(D) 7月"],
        answerIndex: 0
      }
    ],
    KEY_LAND: [
      {
        question: "地價稅幾月開徵?",
        options: ["(A) 4月", "(B) 8月", "(C) 5月", "(D) 11月"],
        answerIndex: 3
      }
    ],
    EXIT: [
      {
        question: "房屋稅幾月開徵?",
        options: ["(A) 4月", "(B) 8月", "(C) 5月", "(D) 7月"],
        answerIndex: 2
      }
    ]
  },
  NORMAL: {
    KEY_LICENSE: [
      {
        question: "下列關於使用牌照稅之敘述，何者正確？",
        options: [
          "(A) 營業用車輛與自用車輛均於每年 4 月開徵",
          "(B) 營業用車輛分上、下兩期開徵（4 月及 10 月）",
          "(C) 牌照稅是由公路監理機關徵收並歸屬中央的國稅",
          "(D) 身心障礙者不論汽缸排氣量大小，一律全額免稅"
        ],
        answerIndex: 1
      },
      {
        question: "逾期繳納使用牌照稅者，每逾幾日按滯納數額加徵 1% 滯納金，最高加徵至 10%？",
        options: [
          "(A) 逾 1 日",
          "(B) 逾 2 日",
          "(C) 逾 3 日",
          "(D) 逾 5 日"
        ],
        answerIndex: 2
      }
    ],
    KEY_LAND: [
      {
        question: "申請自用住宅用地之優惠稅率課徵地價稅，其優惠稅率為何？",
        options: [
          "(A) 千分之二（2‰）",
          "(B) 千分之六（6‰）",
          "(C) 千分之十（10‰）",
          "(D) 萬分之五（0.5‰）"
        ],
        answerIndex: 0
      },
      {
        question: "地價稅納稅義務基準日為每年的哪一天？在這天登記為土地所有權人者即為當年地價稅納稅義務人。",
        options: [
          "(A) 1 月 1 日",
          "(B) 8 月 31 日",
          "(C) 9 月 22 日",
          "(D) 11 月 1 日"
        ],
        answerIndex: 1
      }
    ],
    EXIT: [
      {
        question: "依中華民國房屋稅條例，非自住之住家用房屋（囤房稅 2.0）法定稅率範圍為何？",
        options: [
          "(A) 1.2% ~ 3.6%",
          "(B) 2.0% ~ 4.8%",
          "(C) 1.5% ~ 10%",
          "(D) 1.2% ~ 2.0%"
        ],
        answerIndex: 1
      },
      {
        question: "下列哪種情形的私有住家用房屋，可以申請免徵房屋稅？",
        options: [
          "(A) 房屋現值在新臺幣 10 萬元以下者",
          "(B) 供住家使用且房屋現值在新臺幣 10 萬 3 千元以下，且本人、配偶及未成年子女全國合計 3 戶以內者",
          "(C) 任何營業用房屋只要虧損即可申請免稅",
          "(D) 全新裝潢尚未入住的豪宅"
        ],
        answerIndex: 1
      }
    ]
  },
  HARD: {
    KEY_LICENSE: [
      {
        question: "根據我國使用牌照稅法規定，若交通工具所有人逾期未完稅，在滯期內使用公共道路被查獲，除責令補稅外，處以應納稅額幾倍以下之罰鍰？",
        options: [
          "(A) 1 倍",
          "(B) 2 倍",
          "(C) 0.3 倍",
          "(D) 3 倍"
        ],
        answerIndex: 2
      },
      {
        question: "自用車輛因故損壞停駛，所有人應向監理機關辦理停駛登記，其已繳納之使用牌照稅應如何處理？",
        options: [
          "(A) 視為自動放棄，不予退還",
          "(B) 只能扣抵下一年度之應納稅款",
          "(C) 按日計算退還未使用期間之稅額",
          "(D) 減半退還"
        ],
        answerIndex: 2
      }
    ],
    KEY_LAND: [
      {
        question: "若欲申請適用地價稅自用住宅用地之優惠稅率，最遲應於每年地價稅開徵前幾日（即哪一天）提出申請？逾期申請者，自次年起開始適用。",
        options: [
          "(A) 開徵前 30 日（10 月 1 日）",
          "(B) 開徵前 40 日（9 月 22 日）",
          "(C) 開徵前 20 日（10 月 12 日）",
          "(D) 納稅基準日前（8 月 31 日）"
        ],
        answerIndex: 1
      },
      {
        question: "地價稅累進起點地價，是以各該直轄市或縣（市）土地多少面積之平均地價為準？（不包括工業、礦業、農業及免稅土地）",
        options: [
          "(A) 三公畝",
          "(B) 五公畝",
          "(C) 七公畝",
          "(D) 十公畝"
        ],
        answerIndex: 2
      }
    ],
    EXIT: [
      {
        question: "關於契稅的課徵，買賣契稅之稅率為契約價值之多少？其納稅義務人為誰？",
        options: [
          "(A) 6%，買受人",
          "(B) 4%，出賣人",
          "(C) 2%，典權人",
          "(D) 6%，出賣人"
        ],
        answerIndex: 0
      },
      {
        question: "房屋稅條例第 15 條規定，私有房屋符合特定條件免徵房屋稅。若為供不特定人自由使用之私有設立公益圖書館，其免稅要件為何？",
        options: [
          "(A) 必須向政府立案並經主管機關證明",
          "(B) 只要門口掛上公益圖書館招牌即可",
          "(C) 限於公立圖書館，私有圖書館一律不免稅",
          "(D) 限於財團法人所有，且藏書量須達萬冊以上"
        ],
        answerIndex: 0
      }
    ]
  }
};

export default function ChaseGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // ==========================================
  // React UI 渲染狀態 (低頻更新)
  // ==========================================
  const [status, setStatus] = useState<GameStatus>('START');
  const [difficulty, setDifficulty] = useState<'EASY' | 'NORMAL' | 'HARD'>('NORMAL');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [gameTime, setGameTime] = useState<number>(0);
  const [hudMessage, setHudMessage] = useState<string>('稅務特工已潛入申報核心區...');
  const [hudAlert, setHudAlert] = useState<boolean>(false);
  const [isExitUnlocked, setIsExitUnlocked] = useState<boolean>(false);
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});
  const [isMobileControls, setIsMobileControls] = useState<boolean>(false);
  const [hasLicenseKey, setHasLicenseKey] = useState<boolean>(false);
  const [hasLandKey, setHasLandKey] = useState<boolean>(false);

  // 動態檢測行動端觸控裝置支援
  useEffect(() => {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobileControls(hasTouch);
  }, []);

  // 虛擬搖桿與行動端控制 Ref
  const joystickKnobRef = useRef<HTMLDivElement | null>(null);
  const joystickVectorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTouchSprintPressedRef = useRef<boolean>(false);
  const joystickMaxRadius = 40;

  // 遊戲影像素材 Ref 宣告
  const playerImageRef = useRef<HTMLImageElement | null>(null);
  const enemyImageRef = useRef<HTMLImageElement | null>(null);
  const keyImageRef = useRef<HTMLImageElement | null>(null);

  // 載入遊戲圖形資源 (支援非同步載入，加載完成即在 Canvas 自動渲染新材質)
  useEffect(() => {
    const imgPlayer = new Image();
    imgPlayer.src = getPublicAssetUrl('images/tax_agent.jpg');
    imgPlayer.onload = () => { playerImageRef.current = imgPlayer; };

    const imgEnemy = new Image();
    imgEnemy.src = getPublicAssetUrl('images/evader.jpg');
    imgEnemy.onload = () => { enemyImageRef.current = imgEnemy; };

    const imgKey = new Image();
    imgKey.src = getPublicAssetUrl('images/tax_key.jpg');
    imgKey.onload = () => { keyImageRef.current = imgKey; };
  }, []);

  // 搖桿移動物理向量更新
  const updateJoystickPosition = (touch: React.Touch) => {
    const zone = document.getElementById('virtual-joystick-zone');
    if (!zone) return;
    
    const rect = zone.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = touch.clientX - centerX;
    let dy = touch.clientY - centerY;
    
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
      joystickVectorRef.current = { x: 0, y: 0 };
      if (joystickKnobRef.current) {
        joystickKnobRef.current.style.transform = `translate(0px, 0px)`;
      }
      return;
    }
    
    let moveX = dx;
    let moveY = dy;
    if (distance > joystickMaxRadius) {
      moveX = (dx / distance) * joystickMaxRadius;
      moveY = (dy / distance) * joystickMaxRadius;
    }
    
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
    
    joystickVectorRef.current = {
      x: moveX / joystickMaxRadius,
      y: moveY / joystickMaxRadius
    };
  };

  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    updateJoystickPosition(e.targetTouches[0]);
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.cancelable) e.preventDefault();
    updateJoystickPosition(e.targetTouches[0]);
  };

  const handleJoystickEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    joystickVectorRef.current = { x: 0, y: 0 };
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(0px, 0px)`;
    }
  };

  const handleSprintStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    isTouchSprintPressedRef.current = true;
  };

  const handleSprintEnd = (e: React.TouchEvent | React.MouseEvent) => {
    isTouchSprintPressedRef.current = false;
  };

  // 手機版方向鍵事件處理 (模擬鍵盤輸入以相容物理物理引擎與零延遲更新)
  const handleDpadPress = (dir: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    const keys = keysPressedRef.current;
    if (dir === 'up') {
      keys['arrowup'] = pressed;
      keys['w'] = pressed;
    } else if (dir === 'down') {
      keys['arrowdown'] = pressed;
      keys['s'] = pressed;
    } else if (dir === 'left') {
      keys['arrowleft'] = pressed;
      keys['a'] = pressed;
    } else if (dir === 'right') {
      keys['arrowright'] = pressed;
      keys['d'] = pressed;
    }
  };
  
  // 稅務智慧鎖問答系統狀態
  const [activeQuiz, setActiveQuiz] = useState<{
    question: string;
    options: string[];
    answerIndex: number;
    type: 'KEY_LICENSE' | 'KEY_LAND' | 'EXIT';
  } | null>(null);
  const [quizWrongAnswers, setQuizWrongAnswers] = useState<number>(0);

  const activeQuizRef = useRef<{
    question: string;
    options: string[];
    answerIndex: number;
    type: 'KEY_LICENSE' | 'KEY_LAND' | 'EXIT';
  } | null>(null);
  const quizOpenTimeRef = useRef<number>(0);

  // ==========================================
  // Direct DOM refs 提升效能 (高頻更新體力條不重新渲染 React)
  // ==========================================
  const staminaBarRef = useRef<HTMLDivElement | null>(null);
  const staminaTextRef = useRef<HTMLSpanElement | null>(null);
  const timerTextRef = useRef<HTMLSpanElement | null>(null);

  // ==========================================
  // 智慧鎖控制邏輯
  // ==========================================
  const getRandomQuiz = (type: 'KEY_LICENSE' | 'KEY_LAND' | 'EXIT') => {
    const pool = QUIZ_DATABASE[difficulty][type];
    const randomIndex = Math.floor(Math.random() * pool.length);
    return {
      ...pool[randomIndex],
      type
    };
  };

  const triggerQuiz = (quiz: {
    question: string;
    options: string[];
    answerIndex: number;
    type: 'KEY_LICENSE' | 'KEY_LAND' | 'EXIT';
  }) => {
    setActiveQuiz(quiz);
    activeQuizRef.current = quiz;
    setQuizWrongAnswers(0);
    quizOpenTimeRef.current = Date.now();
    synth.stopBGM();

    // 💡 關鍵優化：在觸發答題彈窗時，立即重設按鍵狀態，避免 D-Pad 卸載導致方向鍵卡死
    keysPressedRef.current = {};
    setActiveKeys({});
    isTouchSprintPressedRef.current = false;
    joystickVectorRef.current = { x: 0, y: 0 };
  };

  const handleAnswer = (optionIndex: number) => {
    if (!activeQuiz) return;

    if (optionIndex === activeQuiz.answerIndex) {
      // 答對！播放清脆歡快的 BINGO 提示音
      synth.playBingo();

      // 扣除作答消耗時間，保證玩家排名分數不受影響
      const quizDuration = Date.now() - quizOpenTimeRef.current;
      startTimeRef.current += quizDuration;

      if (activeQuiz.type === 'KEY_LICENSE') {
        const item = itemRef.current;
        item.isCollected = true;
        setHasLicenseKey(true);
        
        // 檢查地價稅鑰匙是否也已收集
        if (item2Ref.current.isCollected) {
          exitRef.current.isUnlocked = true;
          setIsExitUnlocked(true);
          setHudMessage('🔑 兩大稅務金鑰皆已解鎖！安全出口已開啟，快逃！');
          createExplosion(exitRef.current.pos, '#4ade80', 25, 1.2);
        } else {
          // NORMAL 難度：解鎖第一個金鑰時若還未有第二個敵人，則加入一個
          if (difficulty === 'NORMAL' && enemiesRef.current.length === 1) {
            enemiesRef.current.push({
              id: 2,
              pos: { x: 400, y: 200 },
              speed: 1.6,
              chaseSpeed: 3.0,
              radius: 12,
              state: 'PATROL',
              patrolWaypoints: [
                { x: 400, y: 200 },
                { x: 600, y: 250 },
                { x: 400, y: 450 },
                { x: 200, y: 250 }
              ],
              currentWaypointIndex: 0,
              angle: 0,
              color: '#c084fc', // 紫色高機動無人機
              spottedPlayer: false
            });
            setHudMessage('🔑 牌照稅金鑰解鎖！🚨 警告：系統偵測到第 2 個高機動無人機已升空！');
          } else {
            setHudMessage('🔑 牌照稅金鑰解鎖！還需解鎖左上角的「地價稅智慧鎖」！');
          }
        }
        
        synth.playKeyPick();
        createExplosion(item.pos, '#fbbf24', 35, 1.5);
      } else if (activeQuiz.type === 'KEY_LAND') {
        const item2 = item2Ref.current;
        item2.isCollected = true;
        setHasLandKey(true);

        // 檢查牌照稅鑰匙是否也已收集
        if (itemRef.current.isCollected) {
          exitRef.current.isUnlocked = true;
          setIsExitUnlocked(true);
          setHudMessage('🔑 兩大稅務金鑰皆已解鎖！安全出口已開啟，快逃！');
          createExplosion(exitRef.current.pos, '#4ade80', 25, 1.2);
        } else {
          // NORMAL 難度：解鎖第一個金鑰時若還未有第二個敵人，則加入一個
          if (difficulty === 'NORMAL' && enemiesRef.current.length === 1) {
            enemiesRef.current.push({
              id: 2,
              pos: { x: 400, y: 200 },
              speed: 1.6,
              chaseSpeed: 3.0,
              radius: 12,
              state: 'PATROL',
              patrolWaypoints: [
                { x: 400, y: 200 },
                { x: 600, y: 250 },
                { x: 400, y: 450 },
                { x: 200, y: 250 }
              ],
              currentWaypointIndex: 0,
              angle: 0,
              color: '#c084fc', // 紫色高機動無人機
              spottedPlayer: false
            });
            setHudMessage('🔑 地價稅金鑰解鎖！🚨 警告：系統偵測到第 2 個高機動無人機已升空！');
          } else {
            setHudMessage('🔒 地價稅金鑰解鎖！還需解鎖右上角的「使用牌照稅智慧鎖」！');
          }
        }

        synth.playKeyPick();
        createExplosion(item2.pos, '#67e8f9', 35, 1.5); // 青色爆炸
      } else if (activeQuiz.type === 'EXIT') {
        const exit = exitRef.current;
        const player = playerRef.current;
        gameStateRef.current = 'VICTORY';
        setStatus('VICTORY');
        synth.playVictory();
        createExplosion(exit.pos, '#10b981', 50, 2);
        createExplosion(player.pos, '#fbbf24', 30, 1.5);
      }

      setActiveQuiz(null);
      activeQuizRef.current = null;
      setQuizWrongAnswers(0);
      synth.startBGM();

      // 💡 關鍵優化：答題完畢重回遊戲時，重設按鍵狀態，避免 D-pad 重新載入時輸入狀態遺留
      keysPressedRef.current = {};
      setActiveKeys({});
      isTouchSprintPressedRef.current = false;
      joystickVectorRef.current = { x: 0, y: 0 };
    } else {
      // 答錯
      setQuizWrongAnswers(prev => prev + 1);
      synth.playAlert(); // 警示聲

      // 懲罰機制！
      if (difficulty === 'HARD') {
        // 惡夢難度懲罰：
        // 1. 體力清零 (受到腦力電磁震盪)
        playerRef.current.stamina = 0;
        // 2. 懲罰：增加生存計時 5 秒
        startTimeRef.current -= 5000;
        // 3. 在玩家周圍產生大量發光干擾粒子
        createExplosion(playerRef.current.pos, '#f43f5e', 35, 1.8);
      } else if (difficulty === 'NORMAL') {
        // 專業難度懲罰：
        // 1. 體力扣減 50
        playerRef.current.stamina = Math.max(0, playerRef.current.stamina - 50);
        // 2. 懲罰：增加生存計時 2.5 秒
        startTimeRef.current -= 2500;
        createExplosion(playerRef.current.pos, '#fb923c', 20, 1.2);
      }
    }
  };

  // ==========================================
  // 遊戲核心物理與實體儲存 (useRef 防止閉包 & React 渲染卡頓)
  // ==========================================
  const gameStateRef = useRef<GameStatus>('START');
  const playerRef = useRef<Player>({
    pos: { x: 400, y: 520 },
    speed: 2.5,
    sprintSpeed: 4.8,
    radius: 12,
    stamina: 100,
    maxStamina: 100,
    isSprinting: false,
    angle: 0
  });

  const enemiesRef = useRef<Enemy[]>([
    {
      id: 1,
      pos: { x: 100, y: 100 },
      speed: 1.4,
      chaseSpeed: 2.8,
      radius: 15,
      state: 'PATROL',
      patrolWaypoints: [
        { x: 100, y: 100 },
        { x: 700, y: 100 },
        { x: 700, y: 500 },
        { x: 100, y: 500 }
      ],
      currentWaypointIndex: 0,
      angle: 0,
      color: '#ef4444', // 紅色巡邏者
      spottedPlayer: false
    }
  ]);

  const itemRef = useRef<Item>({
    pos: { x: 720, y: 80 },
    radius: 10,
    isCollected: false,
    pulseTimer: 0
  });

  const item2Ref = useRef<Item>({
    pos: { x: 80, y: 80 },
    radius: 10,
    isCollected: false,
    pulseTimer: 0
  });

  const exitRef = useRef<Exit>({
    pos: { x: 400, y: 40 },
    width: 60,
    height: 30,
    isUnlocked: false
  });

  // 地圖障礙物
  const obstaclesRef = useRef<Obstacle[]>([
    { pos: { x: 180, y: 140 }, width: 60, height: 320 }, // 左邊牆體
    { pos: { x: 560, y: 140 }, width: 60, height: 320 }, // 右邊牆體
    { pos: { x: 300, y: 270 }, width: 200, height: 60 }  // 中央核心柱
  ]);

  const particlesRef = useRef<GameParticle[]>([]);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});
  
  // 計時器
  const startTimeRef = useRef<number>(0);
  const elapsedOffsetRef = useRef<number>(0);
  const alertCooldownRef = useRef<number>(0); // 警報聲音效間隔

  // ==========================================
  // 輔助函式與物理偵測
  // ==========================================
  
  // 圓形與圓形碰撞
  const checkCircleCollision = (p1: Vector2D, r1: number, p2: Vector2D, r2: number): boolean => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  };

  // 圓形與 AABB 矩形碰撞 (回傳碰撞資訊以實現平滑滑動/滑牆)
  const checkCircleRectCollision = (circle: Vector2D, radius: number, rect: Obstacle) => {
    const closestX = Math.max(rect.pos.x, Math.min(circle.x, rect.pos.x + rect.width));
    const closestY = Math.max(rect.pos.y, Math.min(circle.y, rect.pos.y + rect.height));
    
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distanceSquared = dx * dx + dy * dy;
    const collided = distanceSquared < radius * radius;
    
    return {
      collided,
      overlap: collided ? (radius - Math.sqrt(distanceSquared)) : 0,
      normalX: dx,
      normalY: dy
    };
  };

  // 玩家與出口 (矩形) 碰撞偵測
  const checkPlayerExitCollision = (playerPos: Vector2D, radius: number, exit: Exit): boolean => {
    const closestX = Math.max(exit.pos.x - exit.width / 2, Math.min(playerPos.x, exit.pos.x + exit.width / 2));
    const closestY = Math.max(exit.pos.y - exit.height / 2, Math.min(playerPos.y, exit.pos.y + exit.height / 2));
    const dx = playerPos.x - closestX;
    const dy = playerPos.y - closestY;
    return (dx * dx + dy * dy) < radius * radius;
  };

  // 釋放粒子
  const createExplosion = (pos: Vector2D, color: string, count: number, speedMultiplier: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2.5) * speedMultiplier;
      const size = 2 + Math.random() * 4;
      const maxLife = 30 + Math.random() * 30;
      particlesRef.current.push({
        pos: { ...pos },
        vel: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        color,
        size,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        maxLife,
        life: maxLife
      });
    }
  };

  // ==========================================
  // 遊戲啟動與狀態控制
  // ==========================================
  const handleStartGame = () => {
    // 初始化/重設狀態
    gameStateRef.current = 'PLAYING';
    setStatus('PLAYING');
    setIsExitUnlocked(false);
    setGameTime(0);
    setHudMessage('尋找金鑰鑰匙，開啟逃生大門！');
    setHudAlert(false);

    // 重設智慧鎖問答系統
    setActiveQuiz(null);
    activeQuizRef.current = null;
    setQuizWrongAnswers(0);

    // 重設玩家屬性 (根據難度微調)
    const pSpeed = difficulty === 'EASY' ? 2.6 : difficulty === 'NORMAL' ? 2.5 : 2.3;
    const pSprint = difficulty === 'EASY' ? 5.0 : difficulty === 'NORMAL' ? 4.8 : 4.5;
    playerRef.current = {
      pos: { x: 400, y: 520 },
      speed: pSpeed,
      sprintSpeed: pSprint,
      radius: 12,
      stamina: 100,
      maxStamina: 100,
      isSprinting: false,
      angle: -Math.PI / 2
    };

    // 重設與初始化敵人組 (根據難度)
    if (difficulty === 'EASY') {
      enemiesRef.current = [
        {
          id: 1,
          pos: { x: 100, y: 100 },
          speed: 1.1,
          chaseSpeed: 2.2,
          radius: 15,
          state: 'PATROL',
          patrolWaypoints: [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 700, y: 500 },
            { x: 100, y: 500 }
          ],
          currentWaypointIndex: 0,
          angle: 0,
          color: '#ef4444', // 紅色巡邏者
          spottedPlayer: false
        }
      ];
    } else if (difficulty === 'NORMAL') {
      enemiesRef.current = [
        {
          id: 1,
          pos: { x: 100, y: 100 },
          speed: 1.4,
          chaseSpeed: 2.8,
          radius: 15,
          state: 'PATROL',
          patrolWaypoints: [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 700, y: 500 },
            { x: 100, y: 500 }
          ],
          currentWaypointIndex: 0,
          angle: 0,
          color: '#ef4444', // 紅色巡邏者
          spottedPlayer: false
        }
      ];
    } else { // HARD / NIGHTMARE
      enemiesRef.current = [
        {
          id: 1,
          pos: { x: 100, y: 100 },
          speed: 1.6,
          chaseSpeed: 3.2,
          radius: 15,
          state: 'PATROL',
          patrolWaypoints: [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 700, y: 500 },
            { x: 100, y: 500 }
          ],
          currentWaypointIndex: 0,
          angle: 0,
          color: '#ef4444', // 紅色巡邏者
          spottedPlayer: false
        },
        {
          id: 2,
          pos: { x: 400, y: 300 },
          speed: 1.8,
          chaseSpeed: 3.4,
          radius: 12,
          state: 'PATROL',
          patrolWaypoints: [
            { x: 400, y: 370 },
            { x: 650, y: 400 },
            { x: 400, y: 500 },
            { x: 150, y: 400 }
          ],
          currentWaypointIndex: 0,
          angle: 0,
          color: '#f59e0b', // 橘黃色高機動獵擊無人機
          spottedPlayer: false,
          isLocked: true
        }
      ];
    }

    // 重設道具與大門
    itemRef.current.isCollected = false;
    item2Ref.current.isCollected = false;
    exitRef.current.isUnlocked = false;
    setHasLicenseKey(false);
    setHasLandKey(false);

    // 清空粒子
    particlesRef.current = [];
    
    // 💡 關鍵優化：重啟遊戲時徹底清空所有按鍵與虛擬搖桿狀態，防止任何殘留按鍵鎖死
    keysPressedRef.current = {};
    setActiveKeys({});
    isTouchSprintPressedRef.current = false;
    joystickVectorRef.current = { x: 0, y: 0 };

    // 計時器
    startTimeRef.current = Date.now();
    elapsedOffsetRef.current = 0;
    alertCooldownRef.current = 0;

    // 啟動音樂
    synth.startBGM();
    
    // 金色粒子慶祝起步
    createExplosion({ x: 400, y: 520 }, '#38bdf8', 15);
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleReturnToMainMenu = () => {
    gameStateRef.current = 'START';
    setStatus('START');
    setIsExitUnlocked(false);
    setGameTime(0);
    setHudMessage('稅務特工已潛入申報核心區...');
    setHudAlert(false);

    // 重設智慧鎖問答系統
    setActiveQuiz(null);
    activeQuizRef.current = null;
    setQuizWrongAnswers(0);

    // 重設道具與大門
    itemRef.current.isCollected = false;
    item2Ref.current.isCollected = false;
    exitRef.current.isUnlocked = false;
    setHasLicenseKey(false);
    setHasLandKey(false);

    // 清空粒子
    particlesRef.current = [];
    
    // 重設按鍵與虛擬搖桿狀態
    keysPressedRef.current = {};
    setActiveKeys({});
    isTouchSprintPressedRef.current = false;
    joystickVectorRef.current = { x: 0, y: 0 };

    // 停止背景音樂
    synth.stopBGM();
  };

  // 音效開關切換
  const toggleAudio = () => {
    const nextState = !audioEnabled;
    setAudioEnabled(nextState);
    synth.enabled = nextState;
    if (nextState) {
      if (gameStateRef.current === 'PLAYING') {
        synth.startBGM();
      }
    } else {
      synth.stopBGM();
    }
  };

  // 監聽鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current[key] = true;
      keysPressedRef.current[e.key] = true; // 保持原始大小寫相容
      setActiveKeys(prev => ({ ...prev, [key]: true, [e.key]: true }));
      
      // 防止網頁上下捲動
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key)) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressedRef.current[key] = false;
      keysPressedRef.current[e.key] = false;
      setActiveKeys(prev => ({ ...prev, [key]: false, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      synth.stopBGM();
    };
  }, []);

  // ==========================================
  // 核心 Game Loop (Canvas 繪製與物理計算)
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const updateAndRender = () => {
      const currentGameState = gameStateRef.current;

      // ------------------------------------------
      // 1. 物理更新 (僅在 PLAYING 狀態下 且 沒有啟動問答)
      // ------------------------------------------
      if (currentGameState === 'PLAYING' && !activeQuizRef.current) {
        // 更新遊戲計時器
        const now = Date.now();
        const elapsedSecs = Math.floor((now - startTimeRef.current) / 1000);
        if (elapsedSecs !== gameTime) {
          setGameTime(elapsedSecs);
          if (timerTextRef.current) {
            timerTextRef.current.innerText = `${elapsedSecs} 秒`;
          }
        }

        const player = playerRef.current;
        const keys = keysPressedRef.current;

        // 計算玩家移動向量
        let dx = 0;
        let dy = 0;

        if (keys['w'] || keys['W'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['S'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['A'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['D'] || keys['arrowright']) dx += 1;

        // 融入行動端觸控搖桿向量
        if (joystickVectorRef.current.x !== 0 || joystickVectorRef.current.y !== 0) {
          dx = joystickVectorRef.current.x;
          dy = joystickVectorRef.current.y;
        }

        // 衝刺控制 (Shift 與 觸控按鈕)
        const isShiftPressed = keys['shift'] || keys['Shift'] || isTouchSprintPressedRef.current;
        const hasStamina = player.stamina > 0;
        
        // 判定衝刺狀態
        if (isShiftPressed && hasStamina && (dx !== 0 || dy !== 0)) {
          if (!player.isSprinting) {
            // 觸發衝刺瞬間音效
            synth.playSprintBurst();
          }
          player.isSprinting = true;
          player.stamina = Math.max(0, player.stamina - 0.5); // 每影格扣除 0.5 體力
        } else {
          player.isSprinting = false;
          // 恢復體力
          player.stamina = Math.min(player.maxStamina, player.stamina + 0.25);
        }

        // 更新 stamina Bar 寬度 (不觸發 React 重新渲染)
        if (staminaBarRef.current) {
          staminaBarRef.current.style.width = `${player.stamina}%`;
          if (player.stamina < 30) {
            staminaBarRef.current.className = "h-full bg-gradient-to-r from-red-600 to-rose-500 transition-colors duration-200 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
          } else if (player.stamina < 60) {
            staminaBarRef.current.className = "h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-colors duration-200 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
          } else {
            staminaBarRef.current.className = "h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-colors duration-200 shadow-[0_0_8px_rgba(6,182,212,0.5)]";
          }
        }
        if (staminaTextRef.current) {
          staminaTextRef.current.innerText = `${Math.floor(player.stamina)} / ${player.maxStamina}`;
        }

        // 行動速度
        const currentSpeed = player.isSprinting ? player.sprintSpeed : player.speed;

        if (dx !== 0 || dy !== 0) {
          // 向量正規化以避免對角線超速
          const length = Math.sqrt(dx * dx + dy * dy);
          const moveX = (dx / length) * currentSpeed;
          const moveY = (dy / length) * currentSpeed;

          // 平滑玩家旋轉角度
          player.angle = Math.atan2(moveY, moveX);

          // 計算預計的新位置
          let nextX = player.pos.x + moveX;
          let nextY = player.pos.y + moveY;

          // 地圖邊界碰撞 (800x600, 底部預留 50px 安全緩衝區，防止在手機端被虛擬按鍵/手勢條遮擋)
          nextX = Math.max(player.radius, Math.min(800 - player.radius, nextX));
          nextY = Math.max(player.radius, Math.min(550 - player.radius, nextY));

          // 障礙物碰撞與「滑動牆壁」修正
          obstaclesRef.current.forEach(rect => {
            const coll = checkCircleRectCollision({ x: nextX, y: nextY }, player.radius, rect);
            if (coll.collided) {
              const dist = Math.sqrt(coll.normalX * coll.normalX + coll.normalY * coll.normalY);
              if (dist > 0) {
                // 將玩家朝向法線方向推出
                nextX += (coll.normalX / dist) * coll.overlap;
                nextY += (coll.normalY / dist) * coll.overlap;
              } else {
                // 若極端重合，則推回舊位置
                nextX = player.pos.x;
                nextY = player.pos.y;
              }
            }
          });

          player.pos.x = nextX;
          player.pos.y = nextY;

          // 衝刺時產生藍色煙霧粒子
          if (player.isSprinting && Math.random() < 0.4) {
            particlesRef.current.push({
              pos: { x: player.pos.x - Math.cos(player.angle) * 8, y: player.pos.y - Math.sin(player.angle) * 8 },
              vel: {
                x: -Math.cos(player.angle) * 1 + (Math.random() - 0.5) * 0.5,
                y: -Math.sin(player.angle) * 1 + (Math.random() - 0.5) * 0.5
              },
              color: 'rgba(34, 211, 238, 0.6)', // 青色
              size: 2 + Math.random() * 3,
              alpha: 0.8,
              decay: 0.03,
              maxLife: 20,
              life: 20
            });
          }
        }

        // ------------------------------------------
        // 惡夢難度：檢查第二隻獵殺者 (id === 2) 是否觸發解鎖
        // ------------------------------------------
        if (difficulty === 'HARD') {
          const secondHunter = enemiesRef.current.find(e => e.id === 2);
          if (secondHunter && secondHunter.isLocked) {
            // 觸發條件 1: 玩家收集了任一金鑰
            const isKeyCollected = itemRef.current.isCollected || item2Ref.current.isCollected;
            // 觸發條件 2: 玩家接近中央核心柱 (例如距離中心 (400, 300) 小於 140px)
            const dx = player.pos.x - 400;
            const dy = player.pos.y - 300;
            const distToCenter = Math.sqrt(dx * dx + dy * dy);
            const isNearCenter = distToCenter < 140;

            if (isKeyCollected || isNearCenter) {
              secondHunter.isLocked = false;
              // 將其位置瞬間移動到牆體外 (中央核心柱下方)，避開牆壁碰撞卡死
              secondHunter.pos = { x: 400, y: 370 };
              
              // 播放警報音效
              synth.playAlert();
              
              // 產生破牆而出的爆裂粒子效果
              createExplosion({ x: 400, y: 300 }, '#f59e0b', 35, 1.8);
              createExplosion({ x: 400, y: 300 }, '#ef4444', 15, 1.2);
              
              // 設定 HUD 警告文字
              setHudAlert(true);
              setHudMessage('⚠️ 警告：重力鎖瓦解！第二隻「高機動獵殺無人機」已從中央核心柱破牆而出！');
              
              // 4 秒後恢復正常
              setTimeout(() => {
                if (gameStateRef.current === 'PLAYING') {
                  setHudAlert(false);
                }
              }, 4000);
            }
          }
        }

        // ------------------------------------------
        // 敵人 (追殺者) AI 邏輯
        // ------------------------------------------
        const enemies = enemiesRef.current;
        let anyEnemyChasing = false;

        enemies.forEach(enemy => {
          if (enemy.isLocked) {
            // 鎖定狀態：保持原地不動，不觸發追逐，不進行碰撞檢測
            enemy.state = 'PATROL';
            enemy.spottedPlayer = false;
            return;
          }

          const distToPlayer = Math.sqrt(
            Math.pow(player.pos.x - enemy.pos.x, 2) + 
            Math.pow(player.pos.y - enemy.pos.y, 2)
          );

          // 視野偵測 (300px)
          if (distToPlayer <= 300) {
            enemy.state = 'CHASE';
            enemy.spottedPlayer = true;
            anyEnemyChasing = true;
          } else {
            enemy.state = 'PATROL';
            enemy.spottedPlayer = false;
          }

          // 敵人路徑與移動
          let targetAngle = enemy.angle;
          let currentSpeed = enemy.speed;

          if (enemy.state === 'CHASE') {
            // 直奔玩家
            const dx = player.pos.x - enemy.pos.x;
            const dy = player.pos.y - enemy.pos.y;
            targetAngle = Math.atan2(dy, dx);
            currentSpeed = enemy.chaseSpeed;

            // 每隔一段時間播放嘟嘟警報聲
            const timeNow = Date.now();
            if (timeNow - alertCooldownRef.current > 700) {
              synth.playAlert();
              alertCooldownRef.current = timeNow;
            }
          } else {
            // 巡邏：前往目前路點
            const targetWaypoint = enemy.patrolWaypoints[enemy.currentWaypointIndex];
            const dx = targetWaypoint.x - enemy.pos.x;
            const dy = targetWaypoint.y - enemy.pos.y;
            const distToWaypoint = Math.sqrt(dx * dx + dy * dy);

            if (distToWaypoint < 12) {
              // 抵達路點，前往下一個
              enemy.currentWaypointIndex = (enemy.currentWaypointIndex + 1) % enemy.patrolWaypoints.length;
            }

            targetAngle = Math.atan2(dy, dx);
            currentSpeed = enemy.speed;
          }

          // 平滑轉向 (角度插值)
          let angleDiff = targetAngle - enemy.angle;
          // 正規化角度在 -PI 至 PI
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          enemy.angle += angleDiff * 0.1; // 轉向靈敏度

          // 移動敵人
          let nextEnemyX = enemy.pos.x + Math.cos(enemy.angle) * currentSpeed;
          let nextEnemyY = enemy.pos.y + Math.sin(enemy.angle) * currentSpeed;

          // 敵人與地圖邊界 (與玩家同步在底部預留 50px 安全緩衝區)
          nextEnemyX = Math.max(enemy.radius, Math.min(800 - enemy.radius, nextEnemyX));
          nextEnemyY = Math.max(enemy.radius, Math.min(550 - enemy.radius, nextEnemyY));

          // 敵人與障礙物碰撞「滑牆修復」，避免卡在實體柱子中
          obstaclesRef.current.forEach(rect => {
            const coll = checkCircleRectCollision({ x: nextEnemyX, y: nextEnemyY }, enemy.radius, rect);
            if (coll.collided) {
              const dist = Math.sqrt(coll.normalX * coll.normalX + coll.normalY * coll.normalY);
              if (dist > 0) {
                nextEnemyX += (coll.normalX / dist) * coll.overlap;
                nextEnemyY += (coll.normalY / dist) * coll.overlap;
              } else {
                nextEnemyX = enemy.pos.x;
                nextEnemyY = enemy.pos.y;
              }
            }
          });

          enemy.pos.x = nextEnemyX;
          enemy.pos.y = nextEnemyY;

          // 紅色/橘色威脅微塵粒子
          if (Math.random() < 0.15) {
            particlesRef.current.push({
              pos: { ...enemy.pos },
              vel: {
                x: (Math.random() - 0.5) * 0.8,
                y: (Math.random() - 0.5) * 0.8
              },
              color: enemy.color + '77',
              size: 2 + Math.random() * 3,
              alpha: 0.6,
              decay: 0.02,
              maxLife: 25,
              life: 25
            });
          }

          // 2-1 碰撞偵測：敵人與玩家
          if (checkCircleCollision(player.pos, player.radius, enemy.pos, enemy.radius)) {
            // 觸發遊戲結束 (Game Over)
            gameStateRef.current = 'GAMEOVER';
            setStatus('GAMEOVER');
            synth.playDeath();
            // 在玩家位置產生超大血紅色粒子爆炸
            createExplosion(player.pos, '#f43f5e', 45, 1.8);
            createExplosion(player.pos, '#fb923c', 20, 1.2);
          }
        });

        // 動態調整 HUD 警報文字狀態
        if (anyEnemyChasing) {
          setHudAlert(true);
          setHudMessage('⚠️ 警告：已被追殺者鎖定！全力奔跑！');
        } else {
          setHudAlert(false);
          const collected1 = itemRef.current.isCollected;
          const collected2 = item2Ref.current.isCollected;
          if (collected1 && collected2) {
            setHudMessage('🔑 兩大稅務金鑰已集齊！安全大門已開啟，快逃往上方出口！');
          } else if (collected1) {
            setHudMessage('🔍 已取得牌照稅金鑰！請前往左上角解除「地價稅智慧鎖」！');
          } else if (collected2) {
            setHudMessage('🔍 已取得地價稅金鑰！請前往右上角解除「使用牌照稅智慧鎖」！');
          } else {
            setHudMessage('🔍 探索迷宮：尋找右上角與左上角的稅務智慧金鑰！');
          }
        }

        // ------------------------------------------
        // 3. 道具 (鑰匙) 碰撞偵測 (需答對牌照稅與地價稅題目)
        // ------------------------------------------
        const item = itemRef.current;
        if (!item.isCollected) {
          item.pulseTimer += 0.05; // 動態閃爍
          if (checkCircleCollision(player.pos, player.radius, item.pos, item.radius)) {
            // 觸發牌照稅題目挑戰
            triggerQuiz(getRandomQuiz('KEY_LICENSE'));
          }
        }

        const item2 = item2Ref.current;
        if (!item2.isCollected) {
          item2.pulseTimer += 0.05; // 動態閃爍
          if (checkCircleCollision(player.pos, player.radius, item2.pos, item2.radius)) {
            // 觸發地價稅題目挑戰
            triggerQuiz(getRandomQuiz('KEY_LAND'));
          }
        }

        // ------------------------------------------
        // 4. 出口 (Exit) 碰撞偵測 (通關前需答對房屋稅題目)
        // ------------------------------------------
        const exit = exitRef.current;
        if (exit.isUnlocked) {
          if (checkPlayerExitCollision(player.pos, player.radius, exit)) {
            // 觸發房屋稅題目挑戰
            triggerQuiz(getRandomQuiz('EXIT'));
          }
        }
      }

      // ------------------------------------------
      // 5. 粒子系統更新
      // ------------------------------------------
      particlesRef.current.forEach((p, idx) => {
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;
        p.life -= 1;
        p.alpha = Math.max(0, p.life / p.maxLife);
        
        // 移除死亡粒子
        if (p.life <= 0) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // ------------------------------------------
      // 6. Canvas 繪圖渲染 (每幀完整畫布重繪)
      // ------------------------------------------
      
      // 6-1 繪製背景 (深色科技網格)
      ctx.fillStyle = '#0f172a'; // Slate 900
      ctx.fillRect(0, 0, 800, 600);

      // 網格線 (加強科技廢土感)
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)'; // Slate 800
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < 800; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      for (let y = 0; y < 600; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }

      // 6-2 繪製障礙物
      obstaclesRef.current.forEach(rect => {
        // 障礙陰影外框 (發光效果)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;

        // 障礙本體
        ctx.fillStyle = '#1e293b'; // Slate 800
        ctx.fillRect(rect.pos.x, rect.pos.y, rect.width, rect.height);
        
        // 復位 shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 金屬裝飾飾條
        ctx.strokeStyle = '#334155'; // Slate 700
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.pos.x + 3, rect.pos.y + 3, rect.width - 6, rect.height - 6);
        
        // 對角斜紋線 (表現鋼鐵堡壘風貌)
        ctx.strokeStyle = '#223047';
        ctx.lineWidth = 1.5;
        for (let i = 10; i < rect.height; i += 30) {
          ctx.beginPath();
          ctx.moveTo(rect.pos.x + 5, rect.pos.y + i);
          ctx.lineTo(rect.pos.x + rect.width - 5, rect.pos.y + i + 15 < rect.pos.y + rect.height ? rect.pos.y + i + 15 : rect.pos.y + rect.height - 5);
          ctx.stroke();
        }
      });

      // ==========================================
      // 6-2-2 繪製底部工業風安全防護邊界 (防止生存者太靠近邊緣被手機虛擬按鍵或手指遮擋)
      // ==========================================
      ctx.fillStyle = '#0a0f1d'; // 與 D-pad 一致的深黑背景
      ctx.fillRect(0, 550, 800, 50);

      // 繪製黃黑斜紋警示線 (高對比度、專業安全感)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 550, 800, 10);
      ctx.clip();
      ctx.strokeStyle = '#f59e0b'; // 琥珀/警示黃色
      ctx.lineWidth = 4;
      for (let i = -20; i < 820; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 550);
        ctx.lineTo(i + 15, 560);
        ctx.stroke();
      }
      ctx.restore();

      // 頂部雷射發光邊緣線
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // 微弱紅色雷射防護
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 550);
      ctx.lineTo(800, 550);
      ctx.stroke();

      // 在底部安全牆上繪製精緻的警示文字與標識
      ctx.fillStyle = '#475569'; // Slate 600
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️ SECURITY DEFENSE AREA // DO NOT ENTER // 誠實申報、安全至上 🛡️', 400, 578);

      // 6-3 繪製粒子
      particlesRef.current.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 6-4 繪製出口 (Exit Gate)
      const exit = exitRef.current;
      ctx.save();

      // ==========================================
      // 地面動態引導光帶 (Floor Navigation Guidance)
      // ==========================================
      const arrowTime = Date.now() * 0.005;
      
      // 繪製從下方到大門的地板引導區域
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(exit.pos.x - 40, exit.pos.y, 80, 110);
      
      // 兩側引導光軌
      ctx.strokeStyle = exit.isUnlocked ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(exit.pos.x - 40, exit.pos.y);
      ctx.lineTo(exit.pos.x - 40, exit.pos.y + 110);
      ctx.moveTo(exit.pos.x + 40, exit.pos.y);
      ctx.lineTo(exit.pos.x + 40, exit.pos.y + 110);
      ctx.stroke();

      // 動態流動的向上箭頭 chevrons 提示安全門方位
      for (let i = 0; i < 3; i++) {
        const arrowY = exit.pos.y + 90 - ((arrowTime * 15 + i * 35) % 100);
        if (arrowY > exit.pos.y + 10 && arrowY < exit.pos.y + 100) {
          const alpha = Math.min(1, (arrowY - exit.pos.y - 10) / 20) * Math.min(1, (exit.pos.y + 100 - arrowY) / 20);
          ctx.strokeStyle = exit.isUnlocked 
            ? `rgba(52, 211, 153, ${alpha * 0.8})` 
            : `rgba(239, 68, 68, ${alpha * 0.45})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(exit.pos.x - 8, arrowY + 4);
          ctx.lineTo(exit.pos.x, arrowY);
          ctx.lineTo(exit.pos.x + 8, arrowY + 4);
          ctx.stroke();
        }
      }

      // ==========================================
      // 安全大門實體：工業風機械門柱框體
      // ==========================================
      const gateLeft = exit.pos.x - exit.width / 2;
      const gateRight = exit.pos.x + exit.width / 2;
      const gateTop = exit.pos.y - 15;
      const gateBottom = exit.pos.y + exit.height + 5;

      // 繪製厚重的金屬門框
      ctx.fillStyle = '#1e293b'; // Slate 800
      ctx.strokeStyle = '#475569'; // Slate 600
      ctx.lineWidth = 2.5;
      
      // 左門柱
      ctx.fillRect(gateLeft - 12, gateTop, 12, gateBottom - gateTop);
      ctx.strokeRect(gateLeft - 12, gateTop, 12, gateBottom - gateTop);
      // 右門柱
      ctx.fillRect(gateRight, gateTop, 12, gateBottom - gateTop);
      ctx.strokeRect(gateRight, gateTop, 12, gateBottom - gateTop);
      // 頂部橫樑
      ctx.fillRect(gateLeft - 12, gateTop - 8, exit.width + 24, 8);
      ctx.strokeRect(gateLeft - 12, gateTop - 8, exit.width + 24, 8);

      // 門柱上的黃黑斜紋警示標誌 (高對比度安全感)
      ctx.save();
      ctx.beginPath();
      ctx.rect(gateLeft - 10, gateTop + 5, 8, gateBottom - gateTop - 10);
      ctx.rect(gateRight + 2, gateTop + 5, 8, gateBottom - gateTop - 10);
      ctx.clip();
      
      ctx.strokeStyle = '#f59e0b'; // 黃色
      ctx.lineWidth = 4;
      for (let j = gateTop - 20; j < gateBottom + 20; j += 12) {
        ctx.beginPath();
        ctx.moveTo(gateLeft - 15, j);
        ctx.lineTo(gateLeft + 15, j + 15);
        ctx.moveTo(gateRight - 5, j);
        ctx.lineTo(gateRight + 25, j + 15);
        ctx.stroke();
      }
      ctx.restore();

      // ==========================================
      // 大門發光警戒燈 (Beacons) & 能量護盾
      // ==========================================
      const beaconPulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;

      if (exit.isUnlocked) {
        // ------------------------------------------
        // 【解鎖狀態：強烈綠色能量傳送門】
        // ------------------------------------------
        const portalPulse = Math.sin(Date.now() * 0.015) * 5;

        // 1. 綠色大門大範圍霓虹背光暈
        const portalGrad = ctx.createLinearGradient(gateLeft, exit.pos.y, gateRight, exit.pos.y);
        portalGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        portalGrad.addColorStop(0.3, 'rgba(52, 211, 153, 0.4)');
        portalGrad.addColorStop(0.5, 'rgba(110, 231, 183, 0.6)');
        portalGrad.addColorStop(0.7, 'rgba(52, 211, 153, 0.4)');
        portalGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = portalGrad;
        ctx.fillRect(gateLeft - 5, exit.pos.y - 12, exit.width + 10, exit.height + 20);

        // 2. 綠色動態能量粒子束 (垂直流動)
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1;
        for (let l = 0; l < 6; l++) {
          const beamX = gateLeft + 5 + ((Date.now() * 0.03 + l * 10) % (exit.width - 10));
          ctx.globalAlpha = 0.3 + 0.4 * Math.sin(beamX * 0.05);
          ctx.beginPath();
          ctx.moveTo(beamX, exit.pos.y - 10);
          ctx.lineTo(beamX, exit.pos.y + exit.height + 5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0; // 恢復透明度

        // 3. 霓虹邊緣發光實線
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 18 + portalPulse;
        ctx.beginPath();
        ctx.moveTo(gateLeft, exit.pos.y + exit.height / 2);
        ctx.lineTo(gateRight, exit.pos.y + exit.height / 2);
        ctx.stroke();

        // 4. 頂部雙綠色高亮度警示燈
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10 + 10 * beaconPulse;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(gateLeft - 6, gateTop + 5, 4 + 2 * beaconPulse, 0, Math.PI * 2);
        ctx.arc(gateRight + 6, gateTop + 5, 4 + 2 * beaconPulse, 0, Math.PI * 2);
        ctx.fill();

        // 5. 巨大、閃爍的「⚡ 安全出口解鎖 ⚡」與「RUN / 逃生」引導文字
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#10b981';
        ctx.fillStyle = '#6ee7b7';
        ctx.font = 'bold 11px "Space Grotesk", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚪 EXIT OPEN', exit.pos.x, gateTop - 25);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText('>>> 立即進入逃生 <<<', exit.pos.x, gateTop - 13);
      } else {
        // ------------------------------------------
        // 【未解鎖狀態：高強度紅色雷射安全防護盾】
        // ------------------------------------------
        
        // 1. 微弱紅色不透明背景背光
        const laserGrad = ctx.createLinearGradient(gateLeft, exit.pos.y, gateRight, exit.pos.y);
        laserGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        laserGrad.addColorStop(0.5, 'rgba(239, 68, 68, 0.12)');
        laserGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = laserGrad;
        ctx.fillRect(gateLeft, exit.pos.y - 10, exit.width, exit.height + 15);

        // 2. 繪製三道強光紅色雷射線
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10 + 5 * Math.sin(Date.now() * 0.02);
        
        const laserLinesY = [exit.pos.y - 5, exit.pos.y + exit.height / 2, exit.pos.y + exit.height + 2];
        laserLinesY.forEach((ly, index) => {
          ctx.lineWidth = index === 1 ? 3 : 1.5;
          ctx.beginPath();
          ctx.moveTo(gateLeft, ly);
          ctx.lineTo(gateRight, ly);
          ctx.stroke();
        });

        // 3. 頂部雙紅色發光警示燈
        ctx.shadowBlur = 8 + 8 * beaconPulse;
        ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + 0.6 * beaconPulse})`;
        ctx.beginPath();
        ctx.arc(gateLeft - 6, gateTop + 5, 4 + 2 * beaconPulse, 0, Math.PI * 2);
        ctx.arc(gateRight + 6, gateTop + 5, 4 + 2 * beaconPulse, 0, Math.PI * 2);
        ctx.fill();

        // 4. 醒目警告浮空字型：「🔒 安全門鎖定中」與「KEY REQUIRED」
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#ef4444';
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 10px "Space Grotesk", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ SECURITY GATE', exit.pos.x, gateTop - 25);
        
        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.fillText('[ 🔒 需取得金鑰解鎖 ]', exit.pos.x, gateTop - 13);
      }
      ctx.restore();

      // 6-5 繪製道具 (鑰匙)
      const item = itemRef.current;
      if (!item.isCollected) {
        ctx.save();
        const pulseScale = 1 + Math.sin(item.pulseTimer) * 0.15;
        const keyX = item.pos.x;
        const keyY = item.pos.y;

        // 🌟 耀眼的動態雷達脈衝波 (持續向外擴散)
        const radarTime = (Date.now() * 0.003) % 1;
        ctx.strokeStyle = `rgba(251, 191, 36, ${1 - radarTime})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(keyX, keyY, 12 + radarTime * 38, 0, Math.PI * 2);
        ctx.stroke();

        // 🌟 浮空亮黃色提示箭頭 (吸引玩家注意)
        const arrowHover = Math.sin(Date.now() * 0.008) * 4;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(keyX, keyY - 14 + arrowHover);
        ctx.lineTo(keyX - 4, keyY - 20 + arrowHover);
        ctx.lineTo(keyX + 4, keyY - 20 + arrowHover);
        ctx.closePath();
        ctx.fill();

        if (keyImageRef.current) {
          // 繪製高解析度金鑰圖片
          ctx.save();
          ctx.beginPath();
          ctx.arc(keyX, keyY, item.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            keyImageRef.current,
            keyX - item.radius,
            keyY - item.radius,
            item.radius * 2,
            item.radius * 2
          );
          ctx.restore();

          // 黃色發光圈
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 15 * pulseScale;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(keyX, keyY, item.radius * pulseScale, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // 黃色發光圈
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 15 * pulseScale;
          ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
          ctx.beginPath();
          ctx.arc(keyX, keyY, item.radius * pulseScale, 0, Math.PI * 2);
          ctx.fill();

          // 畫一柄精緻的金黃色鑰匙 (金黃色圈與軸)
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = '#f59e0b';

          // 鑰匙頂部圓環
          ctx.beginPath();
          ctx.arc(keyX, keyY - 4, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();

          // 鑰匙桿
          ctx.beginPath();
          ctx.moveTo(keyX, keyY - 1);
          ctx.lineTo(keyX, keyY + 7);
          ctx.stroke();

          // 鑰匙齒
          ctx.beginPath();
          ctx.moveTo(keyX, keyY + 4);
          ctx.lineTo(keyX + 3, keyY + 4);
          ctx.moveTo(keyX, keyY + 7);
          ctx.lineTo(keyX + 3, keyY + 7);
          ctx.stroke();
        }

        // 🌟 地面上文字提示背景方塊 (確保深色地圖下對比度最高)
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(keyX - 45, keyY + 12, 90, 16, 4);
        ctx.fill();
        ctx.stroke();

        // 🌟 中文化地面提示發光字體
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px "Space Grotesk", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔑 牌照稅智慧鎖', keyX, keyY + 20);

        ctx.restore();
      }

      // 6-5-2 繪製道具二 (地價稅金鑰)
      const item2 = item2Ref.current;
      if (!item2.isCollected) {
        ctx.save();
        const pulseScale = 1 + Math.sin(item2.pulseTimer) * 0.15;
        const keyX = item2.pos.x;
        const keyY = item2.pos.y;

        // 🌟 耀眼的動態雷達脈衝波 (持續向外擴散)
        const radarTime = (Date.now() * 0.003) % 1;
        ctx.strokeStyle = `rgba(34, 211, 238, ${1 - radarTime})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(keyX, keyY, 12 + radarTime * 38, 0, Math.PI * 2);
        ctx.stroke();

        // 🌟 浮空青色提示箭頭 (吸引玩家注意)
        const arrowHover = Math.sin(Date.now() * 0.008) * 4;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(keyX, keyY - 14 + arrowHover);
        ctx.lineTo(keyX - 4, keyY - 20 + arrowHover);
        ctx.lineTo(keyX + 4, keyY - 20 + arrowHover);
        ctx.closePath();
        ctx.fill();

        if (keyImageRef.current) {
          // 繪製高解析度金鑰圖片
          ctx.save();
          ctx.beginPath();
          ctx.arc(keyX, keyY, item2.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            keyImageRef.current,
            keyX - item2.radius,
            keyY - item2.radius,
            item2.radius * 2,
            item2.radius * 2
          );
          ctx.restore();

          // 青色發光圈
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15 * pulseScale;
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(keyX, keyY, item2.radius * pulseScale, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // 青色發光圈
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 15 * pulseScale;
          ctx.fillStyle = 'rgba(34, 211, 238, 0.25)';
          ctx.beginPath();
          ctx.arc(keyX, keyY, item2.radius * pulseScale, 0, Math.PI * 2);
          ctx.fill();

          // 畫一柄精緻的青色鑰匙
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 2.5;
          ctx.fillStyle = '#0891b2';

          // 鑰匙頂部圓環 (菱形/三角形，顯得更具科技多樣感)
          ctx.beginPath();
          ctx.moveTo(keyX, keyY - 8);
          ctx.lineTo(keyX - 5, keyY - 3);
          ctx.lineTo(keyX + 5, keyY - 3);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();

          // 鑰匙桿
          ctx.beginPath();
          ctx.moveTo(keyX, keyY - 3);
          ctx.lineTo(keyX, keyY + 7);
          ctx.stroke();

          // 鑰匙齒
          ctx.beginPath();
          ctx.moveTo(keyX, keyY + 4);
          ctx.lineTo(keyX - 3, keyY + 4);
          ctx.moveTo(keyX, keyY + 7);
          ctx.lineTo(keyX - 3, keyY + 7);
          ctx.stroke();
        }

        // 🌟 地面上文字提示背景方塊 (確保深色地圖下對比度最高)
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(keyX - 45, keyY + 12, 90, 16, 4);
        ctx.fill();
        ctx.stroke();

        // 🌟 中文化地面提示發光字體
        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 9px "Space Grotesk", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒 地價稅智慧鎖', keyX, keyY + 20);

        ctx.restore();
      }

      // 6-6 繪製追殺者 (Enemy)
      enemiesRef.current.forEach(enemy => {
        ctx.save();

        if (enemy.isLocked) {
          // 繪製一個發光的、黃色半透明的能量阻斷罩 (Cage)
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius + 12, 0, Math.PI * 2);
          ctx.stroke();

          // 繪製環繞的雷射限制線 (交叉十字)
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(enemy.pos.x - 22, enemy.pos.y);
          ctx.lineTo(enemy.pos.x + 22, enemy.pos.y);
          ctx.moveTo(enemy.pos.x, enemy.pos.y - 22);
          ctx.lineTo(enemy.pos.x, enemy.pos.y + 22);
          ctx.stroke();
        } else {
          // 繪製 300 像素的警戒/視野半徑環 (虛線，增強戰術驚悚氛圍)
          ctx.strokeStyle = enemy.state === 'CHASE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(226, 232, 240, 0.08)';
          ctx.lineWidth = enemy.state === 'CHASE' ? 1.5 : 1;
          if (enemy.state === 'CHASE') {
            ctx.setLineDash([6, 4]);
          } else {
            ctx.setLineDash([4, 6]);
          }
          ctx.beginPath();
          ctx.arc(enemy.pos.x, enemy.pos.y, 300, 0, Math.PI * 2);
          ctx.stroke();

          // 追擊連線與鎖定指示
          if (enemy.state === 'CHASE') {
            // 畫一條紅色極微弱指示線連向玩家
            ctx.setLineDash([2, 5]);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(enemy.pos.x, enemy.pos.y);
            ctx.lineTo(playerRef.current.pos.x, playerRef.current.pos.y);
            ctx.stroke();

            // 在兩者中間寫上警告
            const midX = (enemy.pos.x + playerRef.current.pos.x) / 2;
            const midY = (enemy.pos.y + playerRef.current.pos.y) / 2;
            ctx.fillStyle = '#f43f5e';
            ctx.font = 'italic bold 8px JetBrains Mono, monospace';
            ctx.textAlign = 'center';
            ctx.fillText('TARGET LOCK', midX, midY - 6);
          }
        }

        // 恢復正常繪圖 (無虛線)
        ctx.setLineDash([]);

        // 敵人陰影與發光
        const pulse = Math.sin(Date.now() * 0.015) * 3;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 12 + pulse;

        if (enemyImageRef.current) {
          // 1. 剪裁出圓形並繪製敵人圖片
          ctx.save();
          ctx.beginPath();
          ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            enemyImageRef.current,
            enemy.pos.x - enemy.radius,
            enemy.pos.y - enemy.radius,
            enemy.radius * 2,
            enemy.radius * 2
          );
          ctx.restore();

          // 2. 繪製發光外裝甲圈
          ctx.save();
          ctx.shadowColor = enemy.color;
          ctx.shadowBlur = 12 + pulse;
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          // 敵人本體外圈圓 (紅色/橘色裝甲)
          ctx.fillStyle = '#1e1b4b'; // 超深紫
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(enemy.pos.x, enemy.pos.y, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 敵人朝向眼 (發光核心)
          const eyeX = enemy.pos.x + Math.cos(enemy.angle) * 7;
          const eyeY = enemy.pos.y + Math.sin(enemy.angle) * 7;
          
          ctx.fillStyle = enemy.state === 'CHASE' ? '#ffffff' : enemy.color;
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = enemy.state === 'CHASE' ? 10 : 2;
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 4, 0, Math.PI * 2);
          ctx.fill();

          // 偵測感應線裝飾
          ctx.shadowBlur = 0;
          ctx.strokeStyle = enemy.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(enemy.pos.x, enemy.pos.y);
          ctx.lineTo(enemy.pos.x - Math.cos(enemy.angle) * 11, enemy.pos.y - Math.sin(enemy.angle) * 11);
          ctx.stroke();
        }

        // 繪製敵人警報浮動字體
        if (enemy.isLocked) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 8px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('🔒 LOCKED', enemy.pos.x, enemy.pos.y - 20);
        } else if (enemy.state === 'CHASE') {
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('!! CHASE !!', enemy.pos.x, enemy.pos.y - 20);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('PATROL', enemy.pos.x, enemy.pos.y - 20);
        }

        ctx.restore();
      });

      // 6-7 繪製玩家 (Player)
      const player = playerRef.current;
      if (currentGameState === 'PLAYING' || currentGameState === 'START') {
        ctx.save();

        // 衝刺尾流影子
        if (player.isSprinting) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
          ctx.beginPath();
          ctx.arc(player.pos.x - Math.cos(player.angle) * 8, player.pos.y - Math.sin(player.angle) * 8, player.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 玩家核心
        const playerPulse = Math.sin(Date.now() * 0.01) * 2;
        ctx.shadowColor = player.isSprinting ? '#22d3ee' : '#38bdf8';
        ctx.shadowBlur = player.isSprinting ? (15 + playerPulse) : (8 + playerPulse);

        if (playerImageRef.current) {
          // 1. 剪裁出圓形並繪製玩家圖片
          ctx.save();
          ctx.beginPath();
          ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            playerImageRef.current,
            player.pos.x - player.radius,
            player.pos.y - player.radius,
            player.radius * 2,
            player.radius * 2
          );
          ctx.restore();

          // 2. 外圈護盾 (青藍色)
          ctx.save();
          ctx.shadowColor = player.isSprinting ? '#22d3ee' : '#38bdf8';
          ctx.shadowBlur = player.isSprinting ? (15 + playerPulse) : (8 + playerPulse);
          ctx.strokeStyle = player.isSprinting ? '#22d3ee' : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          // 外圈護盾 (青藍色)
          ctx.fillStyle = '#0f172a'; // 深灰色內部
          ctx.strokeStyle = player.isSprinting ? '#22d3ee' : '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(player.pos.x, player.pos.y, player.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // 朝向箭頭 (三角形)
        ctx.shadowBlur = 0;
        ctx.fillStyle = player.isSprinting ? '#22d3ee' : '#38bdf8';
        ctx.beginPath();
        const arrowLength = 9;
        const arrowWidth = 5;
        const tipX = player.pos.x + Math.cos(player.angle) * arrowLength;
        const tipY = player.pos.y + Math.sin(player.angle) * arrowLength;
        const side1X = player.pos.x + Math.cos(player.angle + Math.PI - 0.5) * arrowWidth;
        const side1Y = player.pos.y + Math.sin(player.angle + Math.PI - 0.5) * arrowWidth;
        const side2X = player.pos.x + Math.cos(player.angle + Math.PI + 0.5) * arrowWidth;
        const side2Y = player.pos.y + Math.sin(player.angle + Math.PI + 0.5) * arrowWidth;
        
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(side1X, side1Y);
        ctx.lineTo(side2X, side2Y);
        ctx.closePath();
        ctx.fill();

        // 玩家名稱或標籤
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', player.pos.x, player.pos.y - 16);

        ctx.restore();
      }

      // ------------------------------------------
      // 7. 持續循環
      // ------------------------------------------
      animationId = requestAnimationFrame(updateAndRender);
    };

    // 啟動 Game Loop
    animationId = requestAnimationFrame(updateAndRender);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameTime, audioEnabled]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-slate-100 font-sans p-1 sm:p-3 md:p-4 select-none relative overflow-hidden">
      {/* 美麗的科技背景暈光效果 */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-rose-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 頂部華麗主標題列 - 毛玻璃卡片 */}
      <header className="w-full max-w-[800px] flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 mb-1.5 sm:mb-3 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-xl p-2 sm:p-3 shadow-xl z-10">
        <div className="flex items-center space-x-2 sm:space-x-2.5 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/5 border border-white/10 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)] shrink-0 transition-transform hover:scale-105 duration-300">
            <img 
              src={getPublicAssetUrl('images/photo1.jpg')} 
              alt="Tax Agent Game Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'text-cyan-400 font-black text-sm tracking-wider';
                  fallback.innerText = 'TAX';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-nowrap whitespace-nowrap overflow-visible">
              <h1 className="text-sm xs:text-base sm:text-lg md:text-xl font-black tracking-wider sm:tracking-widest bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent truncate">
                稅務特工：誠實納稅大逃殺
              </h1>
              <span className="text-[10px] sm:text-xs md:text-[14px] text-slate-400 bg-slate-800/40 border border-white/10 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded font-mono tracking-wider shrink-0 select-none">
                廣告
              </span>
            </div>
            <p className="text-[8px] sm:text-[10px] text-cyan-400/70 font-mono tracking-wider uppercase">SURVIVE THE SEEKERS // v1.2</p>
          </div>
        </div>
        
        {/* 控制按鈕：靜音開關與手機按鍵開關 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMobileControls(prev => !prev)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 hover:border-white/20 rounded-xl transition-all text-xs font-mono cursor-pointer"
            title="切換行動端虛擬按鍵"
          >
            <Gamepad2 className={`w-4 h-4 ${isMobileControls ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span className={`${isMobileControls ? 'text-cyan-400 font-bold' : 'text-slate-500 font-semibold'} hidden xs:inline`}>
              {isMobileControls ? "手機按鍵: 開" : "手機按鍵: 關"}
            </span>
          </button>

          <button
            onClick={toggleAudio}
            className="flex items-center space-x-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 hover:border-white/20 rounded-xl transition-all text-xs font-mono cursor-pointer"
            title={audioEnabled ? "關閉音效" : "開啟音效"}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">AUDIO: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500 font-semibold">AUDIO: OFF</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 遊戲主要區塊 */}
      <div className="relative w-full max-w-[800px] bg-[#0d1527] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl shadow-black/80 touch-none">
        
        {/* 頂部即時儀表 HUD - 玻璃發光管 - 改為 relative 防止在手機上遮擋畫布頂部的金鑰與安全大門 */}
        <div className="relative w-full h-16 bg-[#090e1a]/80 backdrop-blur-md border-b border-white/10 px-3 sm:px-4 flex items-center justify-between z-10 font-mono text-xs">
          
          {/* 即時系統廣播 message & 生存狀態標籤 */}
          <div className="flex flex-col space-y-1">
            <div className="text-[9px] text-slate-400 uppercase tracking-widest hidden xs:block">生存狀態 (STATUS)</div>
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-black tracking-wider uppercase border transition-colors duration-200 shrink-0 ${
                hudAlert 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' 
                  : isExitUnlocked 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
              }`}>
                {hudAlert ? '警告' : isExitUnlocked ? '大門開啟' : '搜索鑰匙'}
              </span>

              {/* 關卡系統金鑰即時狀態燈 */}
              <div className="flex items-center space-x-1 shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black border flex items-center space-x-1 transition-all duration-200 ${
                  hasLicenseKey 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse' 
                    : 'bg-slate-950/60 text-slate-500 border-white/5 opacity-60'
                }`} title="牌照稅智慧金鑰">
                  <span>🔑</span>
                  <span>牌照</span>
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black border flex items-center space-x-1 transition-all duration-200 ${
                  hasLandKey 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_8px_rgba(34,211,238,0.4)] animate-pulse' 
                    : 'bg-slate-950/60 text-slate-500 border-white/5 opacity-60'
                }`} title="地價稅智慧金鑰">
                  <span>🔑</span>
                  <span>地價</span>
                </span>
              </div>

              <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium tracking-wide max-w-[70px] xs:max-w-[150px] sm:max-w-[280px] truncate">
                {hudMessage}
              </span>
            </div>
          </div>

          {/* 右方：計時器與體力條 */}
          <div className="flex items-center space-x-2 sm:space-x-5">
            
            {/* 計時器 */}
            <div className="flex flex-col space-y-1 items-end">
              <div className="text-[9px] text-slate-400 uppercase tracking-widest hidden md:block">逃生耗時</div>
              <div className="flex items-center space-x-1 sm:space-x-1.5 bg-white/[0.02] border border-white/5 px-1.5 sm:px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span id="game-timer" ref={timerTextRef} className="text-emerald-400 font-bold min-w-[30px] sm:min-w-[40px] text-right text-[10px] sm:text-xs">
                  0 秒
                </span>
              </div>
            </div>

            {/* 體力度量 (Stamina) */}
            <div className="flex flex-col space-y-1 items-end">
              <div className="text-[9px] text-slate-400 uppercase tracking-widest hidden md:block">衝刺能量 (STAMINA)</div>
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/[0.02] border border-white/5 px-1.5 sm:px-2.5 py-1 rounded-lg min-w-[110px] sm:min-w-[210px]">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <div className="flex-1 h-2 sm:h-2.5 bg-slate-950/60 rounded-full overflow-hidden border border-white/10 relative">
                  <div 
                    ref={staminaBarRef}
                    className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-75"
                    style={{ width: '100%' }}
                  />
                </div>
                <span ref={staminaTextRef} className="text-[9px] sm:text-[10px] text-cyan-400 font-bold min-w-[35px] sm:min-w-[45px] text-right hidden xs:inline-block">
                  100 / 100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            科技感 HUD 疊加日誌面板 (SYSTEM LOG) - 已依用戶要求移除，避免遮擋左上角智慧鎖金鑰
           ========================================== */}
        {status === 'PLAYING' && !isMobileControls && (
          <>
            {/* 左下角隨按鍵即時發光之 WASD 虛擬按鍵 */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 pointer-events-none z-10 font-mono select-none">
              <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-black text-xs transition-all duration-100 border ${
                activeKeys['w'] || activeKeys['arrowup']
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-90 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
                  : 'bg-white/5 backdrop-blur-md border-white/10 text-slate-300'
              }`}>
                <ArrowUp className="w-3 h-3 mb-0.5" />
                <span>W</span>
              </div>
              <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-black text-xs transition-all duration-100 border ${
                activeKeys['a'] || activeKeys['arrowleft']
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-90 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
                  : 'bg-white/5 backdrop-blur-md border-white/10 text-slate-300'
              }`}>
                <span>←</span>
                <span>A</span>
              </div>
              <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-black text-xs transition-all duration-100 border ${
                activeKeys['s'] || activeKeys['arrowdown']
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-90 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
                  : 'bg-white/5 backdrop-blur-md border-white/10 text-slate-300'
              }`}>
                <span>S</span>
                <span>↓</span>
              </div>
              <div className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center font-black text-xs transition-all duration-100 border ${
                activeKeys['d'] || activeKeys['arrowright']
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 scale-90 shadow-[0_0_15px_rgba(34,211,238,0.7)]'
                  : 'bg-white/5 backdrop-blur-md border-white/10 text-slate-300'
              }`}>
                <span>→</span>
                <span>D</span>
              </div>
              <div className={`h-9 px-3 rounded-lg flex items-center justify-center font-bold text-[10px] ml-2 transition-all duration-100 border tracking-wider uppercase ${
                activeKeys['shift']
                  ? 'bg-amber-500 text-slate-950 border-amber-400 scale-90 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                  : 'bg-white/5 backdrop-blur-md border-white/10 text-slate-300'
              }`}>
                SHIFT 衝刺
              </div>
            </div>
          </>
        )}

        {/* 2D CANVAS 畫布主體 */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="block w-full h-auto aspect-[4/3] bg-slate-950 touch-none"
        />

        {/* ==========================================
            行動端實體觸控 D-Pad 控制面板 (符合「上面是畫面，下面則要有方向鍵」需求)
            💡 優化：增加底部 Safe Area Padding 防止 iOS/Android 底部導航與手勢橫條遮擋
           ========================================== */}
        {isMobileControls && !activeQuiz && status === 'PLAYING' && (
          <div className="w-full bg-[#0a0f1d] border-t border-white/10 px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:p-5 flex items-center justify-between select-none touch-none z-20">
            {/* 1. 左側：經典十字型 D-Pad 方向鍵組 (💡 放大區域及按鍵，操作極佳) */}
            <div className="flex items-center justify-center pl-10 xs:pl-20 sm:pl-28">
              <div className="grid grid-cols-3 gap-2 w-[180px] h-[180px] relative">
                {/* 空 */}
                <div />
                
                {/* 上 (UP) */}
                <div className="flex items-center justify-center">
                  <button
                    onTouchStart={(e) => { e.preventDefault(); handleDpadPress('up', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleDpadPress('up', false); }}
                    onTouchCancel={(e) => { e.preventDefault(); handleDpadPress('up', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleDpadPress('up', true); }}
                    onMouseUp={(e) => { e.preventDefault(); handleDpadPress('up', false); }}
                    onMouseLeave={() => { handleDpadPress('up', false); }}
                    className="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/30 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center transition-all duration-75 text-cyan-400 cursor-pointer select-none"
                    title="向上移動"
                  >
                    <ChevronUp className="w-8 h-8" />
                  </button>
                </div>

                {/* 空 */}
                <div />

                {/* 左 (LEFT) */}
                <div className="flex items-center justify-center">
                  <button
                    onTouchStart={(e) => { e.preventDefault(); handleDpadPress('left', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleDpadPress('left', false); }}
                    onTouchCancel={(e) => { e.preventDefault(); handleDpadPress('left', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleDpadPress('left', true); }}
                    onMouseUp={(e) => { e.preventDefault(); handleDpadPress('left', false); }}
                    onMouseLeave={() => { handleDpadPress('left', false); }}
                    className="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/30 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center transition-all duration-75 text-cyan-400 cursor-pointer select-none"
                    title="向左移動"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                </div>

                {/* 中間裝飾核心 */}
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border border-cyan-500/10 bg-cyan-500/5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-cyan-500/30 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* 右 (RIGHT) */}
                <div className="flex items-center justify-center">
                  <button
                    onTouchStart={(e) => { e.preventDefault(); handleDpadPress('right', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleDpadPress('right', false); }}
                    onTouchCancel={(e) => { e.preventDefault(); handleDpadPress('right', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleDpadPress('right', true); }}
                    onMouseUp={(e) => { e.preventDefault(); handleDpadPress('right', false); }}
                    onMouseLeave={() => { handleDpadPress('right', false); }}
                    className="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/30 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center transition-all duration-75 text-cyan-400 cursor-pointer select-none"
                    title="向右移動"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </div>

                {/* 空 */}
                <div />

                {/* 下 (DOWN) */}
                <div className="flex items-center justify-center">
                  <button
                    onTouchStart={(e) => { e.preventDefault(); handleDpadPress('down', true); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleDpadPress('down', false); }}
                    onTouchCancel={(e) => { e.preventDefault(); handleDpadPress('down', false); }}
                    onMouseDown={(e) => { e.preventDefault(); handleDpadPress('down', true); }}
                    onMouseUp={(e) => { e.preventDefault(); handleDpadPress('down', false); }}
                    onMouseLeave={() => { handleDpadPress('down', false); }}
                    className="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/30 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center transition-all duration-75 text-cyan-400 cursor-pointer select-none"
                    title="向下移動"
                  >
                    <ChevronDown className="w-8 h-8" />
                  </button>
                </div>

                {/* 空 */}
                <div />
              </div>
            </div>

            {/* 中間輔助文字與裝飾燈 */}
            <div className="hidden xs:flex flex-col items-center justify-center space-y-1.5 text-center max-w-[120px]">
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/5 shadow-[0_0_8px_rgba(34,211,238,0.1)]">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[9px] font-mono font-black text-cyan-400 tracking-widest uppercase">Tactical Controller</span>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal font-mono scale-95 select-none">
                左手移動，右手衝刺
              </p>
            </div>

            {/* 2. 右側：大型衝刺加速按鍵 */}
            <div className="flex items-center justify-center pr-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); handleSprintStart(e); }}
                onTouchEnd={(e) => { e.preventDefault(); handleSprintEnd(e); }}
                onTouchCancel={(e) => { e.preventDefault(); handleSprintEnd(e); }}
                onMouseDown={(e) => { e.preventDefault(); handleSprintStart(e); }}
                onMouseUp={(e) => { e.preventDefault(); handleSprintEnd(e); }}
                onMouseLeave={handleSprintEnd}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 active:from-amber-500 active:to-orange-700 border-2 border-amber-300/60 shadow-[0_0_20px_rgba(245,158,11,0.4)] active:shadow-[0_0_30px_rgba(245,158,11,0.6)] flex flex-col items-center justify-center active:scale-90 transition-all duration-100 text-slate-950 font-black cursor-pointer select-none"
                title="按住衝刺加速"
              >
                <Zap className="w-6 h-6 fill-current text-slate-950" />
                <span className="text-[10px] tracking-wider uppercase font-black mt-0.5">衝刺</span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            國家稅務智慧解鎖防火牆 (TAX QUIZ OVERLAY) - 毛玻璃
           ========================================== */}
        {activeQuiz && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center overflow-y-auto p-3 sm:p-4 text-center z-30 select-none">
            <div className={`my-auto max-w-[95%] w-full sm:max-w-md bg-slate-900/90 border ${quizWrongAnswers > 0 ? 'border-rose-500 shadow-rose-500/20' : 'border-cyan-500/50 shadow-cyan-500/10'} backdrop-blur-2xl p-3 xs:p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] relative transition-all duration-300 flex flex-col max-h-full sm:max-h-[95%] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
              {/* 頂部發光線 */}
              <div className={`absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r ${quizWrongAnswers > 0 ? 'from-rose-600 to-red-500 animate-pulse' : 'from-cyan-500 via-sky-400 to-emerald-400'}`} />
              
              <div className="flex justify-center mb-1.5 sm:mb-5 mt-1 shrink-0 max-sm:scale-90 max-sm:mb-1">
                <div className={`p-1.5 sm:p-3 rounded-xl sm:rounded-2xl ${quizWrongAnswers > 0 ? 'bg-rose-500/10 border border-rose-500/30 animate-bounce' : 'bg-cyan-500/10 border border-cyan-500/30'} transition-all`}>
                  <Key className={`w-4 h-4 sm:w-8 sm:h-8 ${quizWrongAnswers > 0 ? 'text-rose-400' : 'text-cyan-400'}`} />
                </div>
              </div>

              <div className="shrink-0 mb-1 sm:mb-2">
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/5 border border-white/10 rounded-full text-[8px] xs:text-[9px] sm:text-[10px] font-black tracking-widest text-cyan-400 uppercase font-mono">
                  {activeQuiz.type.startsWith('KEY') ? '🔒 安全金鑰防火牆鎖定' : '🛡️ 安全出口智慧電磁防護'}
                </span>
              </div>
              
              <h3 className="text-sm xs:text-base sm:text-lg font-bold text-white tracking-wide mb-1 sm:mb-2 font-mono shrink-0">
                智慧防禦系統問答
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-300 font-medium mb-2 sm:mb-5 leading-relaxed bg-black/30 border border-white/5 p-2.5 sm:p-4 rounded-xl text-left font-mono overflow-y-auto max-h-[100px] sm:max-h-[160px] scrollbar-thin shrink-0">
                {activeQuiz.question}
              </p>

              {/* 選項按鈕 */}
              <div className="grid grid-cols-1 gap-1.5 sm:gap-3 text-left overflow-y-auto pr-1 flex-1">
                {activeQuiz.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full text-left px-2.5 py-1.5 xs:px-3 xs:py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-cyan-500/40 hover:text-cyan-300 active:scale-[0.98] transition-all text-[10px] xs:text-[11px] sm:text-xs text-slate-200 font-mono flex items-center justify-between cursor-pointer"
                  >
                    <span className="leading-tight pr-2">{option}</span>
                    <span className="w-5 h-5 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
                      {idx === 0 ? 'A' : idx === 1 ? 'B' : idx === 2 ? 'C' : 'D'}
                    </span>
                  </button>
                ))}
              </div>

              {/* 答錯提示 */}
              {quizWrongAnswers > 0 && (
                <div className="mt-1.5 sm:mt-3 text-[10px] xs:text-xs font-semibold text-rose-400 font-mono flex items-center justify-center space-x-1 shrink-0">
                  <span>⚠️ 驗證失敗！累計錯誤 {quizWrongAnswers} 次，請重試！</span>
                </div>
              )}

              <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-2 sm:mt-4 shrink-0">
                * 智慧鎖提示：作答期間遊戲將暫停運作，計時自動凍結。
              </p>
            </div>
          </div>
        )}

        {/* ==========================================
            開始畫面覆蓋層 (START SCREEN) - 毛玻璃
           ========================================== */}
        {status === 'START' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20 select-none animate-fade-in overflow-y-auto">
            <div className="max-w-[92%] w-full sm:max-w-md bg-slate-900/95 border border-white/10 pt-0 px-5 pb-5 md:px-6 md:pb-6 rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] relative overflow-y-auto flex flex-col max-h-[95%]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-rose-500 to-amber-500 animate-pulse z-10" />
              
              {/* 遊戲頂部高科技精美橫幅 - 手機上縮小高度 */}
              <div className="w-[calc(100%+2.5rem)] md:w-[calc(100%+3rem)] h-16 xs:h-24 sm:h-28 -mx-5 md:-mx-6 mb-3 overflow-hidden relative border-b border-white/10 shrink-0">
                <img 
                  src={getPublicAssetUrl('images/hero_banner.jpg')} 
                  alt="Tax Agent Game Banner" 
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-2 left-4 flex items-center space-x-1.5 bg-slate-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">Operations Zone</span>
                </div>
              </div>

              {/* 標題與 Logo 區塊 - 手機上縮小間距 */}
              <div className="flex items-center justify-center space-x-2.5 mb-2.5 mt-0.5 shrink-0">
                <span className="text-[14px] text-slate-400 bg-slate-800/40 border border-white/10 px-1.5 py-0.5 rounded font-mono tracking-wider shrink-0 select-none">
                  廣告
                </span>
                <div className="w-9 h-9 xs:w-11 xs:h-11 rounded-lg overflow-hidden border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)] shrink-0 bg-slate-950 flex items-center justify-center">
                  <img 
                    src={getPublicAssetUrl('images/photo1.jpg')} 
                    alt="Tax Agent Game Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'text-cyan-400 font-black text-xs tracking-wider';
                        fallback.innerText = 'TAX';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>
                <div className="text-left">
                  <h2 className="text-base xs:text-lg font-black text-white tracking-widest font-mono leading-none">稅務特工：誠實納稅大逃殺</h2>
                  <p className="text-[8px] xs:text-[9px] text-cyan-400 font-mono tracking-widest uppercase mt-1">SURVIVE THE SEEKERS</p>
                </div>
              </div>
              
              {/* 遊戲說明 - 可滾動且在手機上彈性縮小 */}
              <div className="text-left bg-black/40 border border-white/5 rounded-xl p-3 mb-3.5 space-y-2 text-slate-300 text-[10px] xs:text-[11px] font-mono leading-relaxed overflow-y-auto max-h-[100px] xs:max-h-[160px] sm:max-h-[220px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1 flex-1">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-white/5 text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                  <span>🎮 遊戲逃生指引</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-white/10 border border-white/10 text-cyan-400 px-1 py-0.5 rounded text-[8px] xs:text-[9px] font-bold shrink-0">W A S D</div>
                  <span>或 <span className="text-cyan-300 font-bold">方向鍵</span> 控制角色走位，靈活躲避追獵。</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="bg-white/10 border border-white/10 text-cyan-400 px-1 py-0.5 rounded text-[8px] xs:text-[9px] font-bold shrink-0">SHIFT</div>
                  <span>按住可進行 <span className="text-amber-400 font-bold">衝刺加速</span> (會快速消耗體力)。</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold shrink-0">🔑 牌照稅鎖 (右上)：</span>
                  <span>觸發並解答 <span className="text-amber-300 font-bold">使用牌照稅開徵月份</span>。</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-cyan-400 font-bold shrink-0">🔒 地價稅鎖 (左上)：</span>
                  <span>觸發並解答 <span className="text-cyan-300 font-bold">地價稅開徵月份</span>。</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold shrink-0">🚨 獵殺機器人：</span>
                  <span>一旦進入偵測半徑將展開瘋狂追擊，可利用障礙物卡位。</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold shrink-0">🚪 安全出口 (上方)：</span>
                  <span>集齊雙金鑰後逃往出口，答對 <span className="text-emerald-300 font-bold">房屋稅開徵月份</span> 通關！</span>
                </div>
              </div>

              {/* 難度選擇器 */}
              <div className="mb-4 shrink-0 text-left">
                <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1.5 block font-black">⚙️ 選擇防護演練難度 (DIFFICULTY)</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDifficulty('EASY')}
                    className={`py-2.5 px-1.5 rounded-lg border text-[11px] font-bold font-mono transition-all uppercase tracking-wide cursor-pointer text-center ${
                      difficulty === 'EASY'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    簡單小試
                  </button>
                  <button
                    onClick={() => setDifficulty('NORMAL')}
                    className={`py-2.5 px-1.5 rounded-lg border text-[11px] font-bold font-mono transition-all uppercase tracking-wide cursor-pointer text-center ${
                      difficulty === 'NORMAL'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    專業特工
                  </button>
                  <button
                    onClick={() => setDifficulty('HARD')}
                    className={`py-2.5 px-1.5 rounded-lg border text-[11px] font-bold font-mono transition-all uppercase tracking-wide cursor-pointer text-center ${
                      difficulty === 'HARD'
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    惡夢特訓
                  </button>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-[11px] xs:text-xs sm:text-sm rounded-xl tracking-wider xs:tracking-widest shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 animate-pulse whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="whitespace-nowrap">立即啟動逃生程序</span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            死亡結束畫面覆蓋層 (GAMEOVER SCREEN) - 毛玻璃
           ========================================== */}
        {status === 'GAMEOVER' && (
          <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20 overflow-y-auto">
            <div className="max-w-[92%] w-full sm:max-w-sm bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-rose-500/30 shadow-[0_16px_48px_rgba(0,0,0,0.6)] relative overflow-y-auto flex flex-col max-h-[95%]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 shrink-0" />
              
              <div className="flex justify-center mb-5 shrink-0">
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl animate-pulse">
                  <Skull className="w-10 h-10 text-rose-400" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-rose-500 tracking-wider mb-2 font-mono shrink-0">任務失敗</h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed shrink-0">
                生命特徵已消失，你被獵殺機器人清除。
              </p>

              {/* 戰績顯示 */}
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 text-slate-300 font-mono text-xs space-y-2 text-left shrink-0">
                <div className="flex justify-between">
                  <span>生存時間:</span>
                  <span className="text-rose-400 font-bold">{gameTime} 秒</span>
                </div>
                <div className="flex justify-between">
                  <span>安全鑰匙:</span>
                  <span className={isExitUnlocked ? "text-amber-400 font-bold" : "text-slate-500"}>
                    {isExitUnlocked ? "已解除鎖定" : "未拾取"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-orange-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-[11px] xs:text-xs sm:text-sm rounded-xl tracking-wider xs:tracking-widest shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">重新啟動逃生程序</span>
              </button>

              <button
                onClick={handleReturnToMainMenu}
                className="w-full mt-3 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 text-slate-300 font-bold text-[11px] xs:text-xs sm:text-sm rounded-xl tracking-wider xs:tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 whitespace-nowrap animate-fade-in"
              >
                <Home className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="whitespace-nowrap">回到遊戲主畫面</span>
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            勝利通關畫面覆蓋層 (VICTORY SCREEN) - 毛玻璃
           ========================================== */}
        {status === 'VICTORY' && (
          <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center z-20 overflow-y-auto">
            <div className="max-w-[92%] w-full sm:max-w-sm bg-slate-900/90 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-[0_16px_48px_rgba(0,0,0,0.6)] relative overflow-y-auto flex flex-col max-h-[95%]">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shrink-0" />
              
              <div className="flex justify-center mb-5 shrink-0">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-bounce">
                  <Trophy className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-2xl font-black text-emerald-400 tracking-wider mb-2 font-mono shrink-0">成功逃生！</h2>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed shrink-0">
                成功突破封鎖！你以精準的走位躲過了所有追獵，並攜帶金鑰回到安全總部。
              </p>

              {/* 戰績顯示 */}
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 mb-6 text-slate-300 font-mono text-xs space-y-2 text-left shrink-0">
                <div className="flex justify-between">
                  <span>通關耗時:</span>
                  <span className="text-emerald-400 font-bold">{gameTime} 秒</span>
                </div>
                <div className="flex justify-between">
                  <span>大門鑰匙:</span>
                  <span className="text-amber-400 font-bold">成功帶回並開鎖</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
                  <span>生存評價:</span>
                  <span className="text-amber-400 font-bold tracking-widest animate-pulse">
                    {gameTime < 10 ? "🏆 神級生存者 (S)" : gameTime < 20 ? "⭐ 精英生存者 (A)" : "👍 合格生存者 (B)"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:scale-[1.02] active:scale-95 text-slate-950 font-black text-[11px] xs:text-xs sm:text-sm rounded-xl tracking-wider xs:tracking-widest shadow-lg shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">再次挑戰極限</span>
              </button>

              <button
                onClick={handleReturnToMainMenu}
                className="w-full mt-3 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 text-slate-300 font-bold text-[11px] xs:text-xs sm:text-sm rounded-xl tracking-wider xs:tracking-widest transition-all cursor-pointer flex items-center justify-center space-x-2 shrink-0 whitespace-nowrap"
              >
                <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="whitespace-nowrap">回到遊戲主畫面</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 底部圖例說明與指引 */}
      <div className="w-full max-w-[800px] mt-1.5 grid grid-cols-5 gap-1">
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-1 sm:p-2 flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 sm:w-3 h-2 sm:h-3 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)] shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight truncate">生存者</span>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono leading-none hidden sm:inline">WASD / 方向鍵</span>
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-1 sm:p-2 flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 sm:w-3 h-2 sm:h-3 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight truncate">獵殺者</span>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono leading-none hidden sm:inline">視野 300 像素</span>
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-1 sm:p-2 flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 sm:w-3 h-2 sm:h-3 bg-amber-400 rotate-45 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 leading-tight truncate">牌照稅鎖</span>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono leading-none hidden sm:inline">右上金黃鑰匙</span>
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-1 sm:p-2 flex items-center space-x-1 sm:space-x-2">
          <div className="w-2 sm:w-3 h-2 sm:h-3 bg-cyan-400 rotate-45 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 leading-tight truncate">地價稅鎖</span>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono leading-none hidden sm:inline">左上青色鑰匙</span>
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-lg p-1 sm:p-2 flex items-center space-x-1 sm:space-x-2">
          <div className="w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border border-cyan-400 rounded flex items-center justify-center shrink-0">
            <div className="w-0.5 sm:w-1 h-0.5 sm:h-1 bg-cyan-400 rounded-full" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight truncate">出口</span>
            <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono leading-none hidden sm:inline">答題逃出</span>
          </div>
        </div>
      </div>

      {/* 底部輔助鍵位與戰術提示區 - 毛玻璃托盤 */}
      <footer className="w-full max-w-[800px] mt-1.5 bg-white/[0.02] backdrop-blur-sm border border-white/5 p-2 sm:p-3 rounded-xl flex flex-col md:flex-row justify-between items-center text-[10px] sm:text-[11px] text-slate-400 font-mono space-y-1.5 md:space-y-0 shadow-lg">
        <div className="hidden sm:flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[10px] font-bold">W</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[10px] font-bold">A</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[10px] font-bold">S</kbd>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[10px] font-bold">D</kbd>
            <span>/</span>
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[10px] font-bold">↑↓←→</kbd>
            <span className="text-[11px] text-slate-500"> 移動角色</span>
          </span>
          <span className="flex items-center space-x-1 border-l border-white/10 pl-4">
            <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-200 text-[10px] font-bold">L-SHIFT</kbd>
            <span className="text-[11px] text-slate-500"> 衝刺 (加速)</span>
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] sm:text-[11px] leading-relaxed max-w-md">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
          <span>戰術：當獵殺者警報直奔你時，可利用障礙物卡路徑，或按住 Shift 衝刺以脫身。</span>
        </div>
      </footer>

      {/* 橫向模式警告遮罩 - 手機版只支援直式 */}
      <div className="fixed inset-0 bg-slate-950/98 z-50 flex-col items-center justify-center p-6 text-center max-lg:landscape:flex hidden select-none backdrop-blur-md">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl mb-4 animate-bounce">
          <Smartphone className="w-12 h-12 text-rose-400 rotate-90 animate-pulse" />
        </div>
        <h3 className="text-lg font-black text-white tracking-widest mb-2 font-mono">請旋轉您的裝置</h3>
        <p className="text-xs text-slate-300 leading-relaxed font-mono max-w-xs">
          「稅務特工」在行動裝置上僅支援 <span className="text-cyan-400 font-black">直式 (Portrait)</span> 模式遊玩。<br />
          請將手機旋轉為直向以啟動特工任務！
        </p>
      </div>
    </div>
  );
}
