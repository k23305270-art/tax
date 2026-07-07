import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWavBuffer(sampleRate: number, samples: Uint8Array): Buffer {
  const numChannels = 1;
  const bitsPerSample = 8;
  const subChunk2Size = samples.length * numChannels * (bitsPerSample / 8);
  const chunkSize = 36 + subChunk2Size;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const buffer = Buffer.alloc(44 + samples.length);

  // RIFF identifier
  buffer.write('RIFF', 0);
  // file length minus RIFF and WAVE tags
  buffer.writeUInt32LE(chunkSize, 4);
  // WAVE identifier
  buffer.write('WAVE', 8);
  // format chunk identifier
  buffer.write('fmt ', 12);
  // format chunk size
  buffer.writeUInt32LE(16, 16);
  // sample format (raw PCM)
  buffer.writeUInt16LE(1, 20);
  // channel count
  buffer.writeUInt16LE(numChannels, 22);
  // sample rate
  buffer.writeUInt32LE(sampleRate, 24);
  // byte rate
  buffer.writeUInt32LE(byteRate, 28);
  // block align
  buffer.writeUInt16LE(blockAlign, 32);
  // bits per sample
  buffer.writeUInt16LE(bitsPerSample, 34);
  // data chunk identifier
  buffer.write('data', 36);
  // chunk length
  buffer.writeUInt32LE(subChunk2Size, 40);

  // write samples
  for (let i = 0; i < samples.length; i++) {
    buffer.writeUInt8(samples[i], 44 + i);
  }

  return buffer;
}

const soundsDir = path.join(__dirname, '../public/sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// 1. bgm.wav - Retro Synthwave Bass & Beat Loop
const bgmSampleRate = 11025;
const bgmDuration = 4.0;
const bgmNumSamples = bgmSampleRate * bgmDuration;
const bgmSamples = new Uint8Array(bgmNumSamples);
for (let i = 0; i < bgmNumSamples; i++) {
  const t = i / bgmSampleRate;
  // Bass notes: C2 (65.4 Hz), Eb2 (77.8 Hz), G2 (98.0 Hz), Bb2 (116.5 Hz)
  const step = Math.floor(t / 0.5) % 8;
  const freqs = [65.4, 65.4, 77.8, 77.8, 98.0, 98.0, 116.5, 87.3];
  const freq = freqs[step];
  
  // Sawtooth bass wave
  const bassWave = ((i * freq / bgmSampleRate) % 1.0) * 2.0 - 1.0;
  
  // Kick drum on beat (every 0.5 seconds)
  const beatT = t % 0.5;
  const kickFreq = 150 * Math.exp(-20 * beatT);
  const kickWave = Math.sin(2 * Math.PI * kickFreq * beatT) * Math.exp(-8 * beatT);
  
  // Snare/hi-hat accent (every 1.0 seconds, offset by 0.5)
  const snareT = (t + 0.25) % 0.5;
  let noiseWave = 0;
  if (snareT < 0.1) {
    noiseWave = (Math.random() * 2.0 - 1.0) * Math.exp(-25 * snareT);
  }

  let val = bassWave * 0.35 + kickWave * 0.45 + noiseWave * 0.15;
  val = Math.max(-1.0, Math.min(1.0, val));
  bgmSamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'bgm.wav'), createWavBuffer(bgmSampleRate, bgmSamples));

// 2. key.wav - Crisp ascending key pickup jingle
const keySampleRate = 22050;
const keyDuration = 0.15;
const keyNumSamples = Math.floor(keySampleRate * keyDuration);
const keySamples = new Uint8Array(keyNumSamples);
for (let i = 0; i < keyNumSamples; i++) {
  const t = i / keySampleRate;
  const freq = t < 0.07 ? 987.77 : 1318.51; // B5 to E6
  const wave = Math.sin(2 * Math.PI * freq * t);
  const env = Math.exp(-15 * t);
  let val = wave * env * 0.6;
  val = Math.max(-1.0, Math.min(1.0, val));
  keySamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'key.wav'), createWavBuffer(keySampleRate, keySamples));

// 3. bingo.wav - Cheerful success melody
const bingoSampleRate = 22050;
const bingoDuration = 0.35;
const bingoNumSamples = Math.floor(bingoSampleRate * bingoDuration);
const bingoSamples = new Uint8Array(bingoNumSamples);
for (let i = 0; i < bingoNumSamples; i++) {
  const t = i / bingoSampleRate;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const noteIdx = Math.floor(t / (bingoDuration / 3));
  const freq = notes[Math.min(notes.length - 1, noteIdx)];
  const wave = Math.sin(2 * Math.PI * freq * t);
  const env = Math.exp(-5 * t);
  let val = wave * env * 0.7;
  val = Math.max(-1.0, Math.min(1.0, val));
  bingoSamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'bingo.wav'), createWavBuffer(bingoSampleRate, bingoSamples));

// 4. alert.wav - Tactical alert warning chirp
const alertSampleRate = 11025;
const alertDuration = 0.25;
const alertNumSamples = Math.floor(alertSampleRate * alertDuration);
const alertSamples = new Uint8Array(alertNumSamples);
for (let i = 0; i < alertNumSamples; i++) {
  const t = i / alertSampleRate;
  const freq = 800 + Math.sin(2 * Math.PI * 12 * t) * 200;
  const wave = Math.sin(2 * Math.PI * freq * t);
  const env = Math.exp(-4 * t);
  let val = wave * env * 0.5;
  val = Math.max(-1.0, Math.min(1.0, val));
  alertSamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'alert.wav'), createWavBuffer(alertSampleRate, alertSamples));

// 5. death.wav - Crash landing explosion sound
const deathSampleRate = 11025;
const deathDuration = 0.8;
const deathNumSamples = Math.floor(deathSampleRate * deathDuration);
const deathSamples = new Uint8Array(deathNumSamples);
for (let i = 0; i < deathNumSamples; i++) {
  const t = i / deathSampleRate;
  const freq = 180 * Math.exp(-6 * t);
  const toneWave = Math.sin(2 * Math.PI * freq * t);
  const noise = Math.random() * 2.0 - 1.0;
  const env = Math.exp(-4 * t);
  let val = (toneWave * 0.4 + noise * 0.6) * env;
  val = Math.max(-1.0, Math.min(1.0, val));
  deathSamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'death.wav'), createWavBuffer(deathSampleRate, deathSamples));

// 6. victory.wav - Major scale arpeggio rise
const victorySampleRate = 22050;
const victoryDuration = 1.0;
const victoryNumSamples = Math.floor(victorySampleRate * victoryDuration);
const victorySamples = new Uint8Array(victoryNumSamples);
for (let i = 0; i < victoryNumSamples; i++) {
  const t = i / victorySampleRate;
  const noteTime = 0.15;
  const step = Math.floor(t / noteTime);
  let val = 0;
  if (step < 4) {
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    const freq = freqs[step];
    val = Math.sin(2 * Math.PI * freq * t) * 0.6;
  } else {
    val = (Math.sin(2 * Math.PI * 523.25 * t) + 
           Math.sin(2 * Math.PI * 659.25 * t) + 
           Math.sin(2 * Math.PI * 783.99 * t) + 
           Math.sin(2 * Math.PI * 1046.50 * t)) * 0.2;
  }
  const env = t < 0.6 ? 1.0 : Math.exp(-5 * (t - 0.6));
  val = val * env;
  val = Math.max(-1.0, Math.min(1.0, val));
  victorySamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'victory.wav'), createWavBuffer(victorySampleRate, victorySamples));

// 7. sprint.wav - Short sliding burst pitch
const sprintSampleRate = 11025;
const sprintDuration = 0.15;
const sprintNumSamples = Math.floor(sprintSampleRate * sprintDuration);
const sprintSamples = new Uint8Array(sprintNumSamples);
for (let i = 0; i < sprintNumSamples; i++) {
  const t = i / sprintSampleRate;
  const freq = 100 + (t / sprintDuration) * 350;
  const wave = Math.sin(2 * Math.PI * freq * t);
  const env = Math.exp(-8 * t);
  let val = wave * env * 0.5;
  val = Math.max(-1.0, Math.min(1.0, val));
  sprintSamples[i] = Math.floor((val + 1.0) * 127.5);
}
fs.writeFileSync(path.join(soundsDir, 'sprint.wav'), createWavBuffer(sprintSampleRate, sprintSamples));

console.log('Successfully synthesized and saved 7 high-quality audio wav files under public/sounds!');
