/* ===========================================================
   audio.js — 소리 (배경음악 · 효과음 · 타이핑음 · 볼륨 · 음소거)
=========================================================== */

const bgm = new Audio(SOUND.bgm);
bgm.loop = true;
const typingSound = new Audio(SOUND.typing);
typingSound.loop = true;

let bgmVolume = DEFAULT_VOLUME.bgm;
let sfxVolume = DEFAULT_VOLUME.sfx;
let muted = false;

const clamp01 = v => Math.min(1, Math.max(0, Number(v)));
const sfxVolumeFor = src => clamp01(sfxVolume * (SOUND_VOLUME[src] ?? 1));

/* 효과음 재생 — 매번 새로 만들어서 여러 소리가 겹쳐도 서로 끊기지 않음 */
function playSfx(src){
  if (!src) return;
  const a = new Audio(src);
  a.volume = sfxVolumeFor(src);
  a.muted = muted;
  a.play().catch(() => {});
}

function setBgmVolume(v){ bgmVolume = clamp01(v); bgm.volume = bgmVolume; }
function setSfxVolume(v){ sfxVolume = clamp01(v); typingSound.volume = sfxVolumeFor(SOUND.typing); }
function setMuted(on){ muted = on; bgm.muted = typingSound.muted = on; }

function startTypingSound(){ typingSound.currentTime = 0; typingSound.play().catch(() => {}); }
function stopTypingSound(){ typingSound.pause(); typingSound.currentTime = 0; }

setBgmVolume(bgmVolume);
setSfxVolume(sfxVolume);

/* 브라우저가 자동재생을 막으면, 첫 클릭/키 입력 때 재생 */
bgm.play().catch(() => {
  const resume = () => bgm.play().catch(() => {});
  document.addEventListener('click', resume, { once: true });
  document.addEventListener('keydown', resume, { once: true });
});
