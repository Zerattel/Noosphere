// Менеджер звуков карты.
// Все звуки скачиваются и декодируются ОДИН раз при открытии карты,
// поэтому при наведении/клике они стартуют мгновенно, без подгрузки.

let ctx = null;
const buffers = new Map(); // url -> декодированный звук
const loading = new Map(); // url -> промис загрузки (чтобы не качать дважды)

function getCtx() {
  if (typeof window === 'undefined') return null; // сборка на сервере
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
}

// Скачать и декодировать список звуков заранее
export function preloadSounds(urls) {
  const c = getCtx();
  if (!c) return Promise.resolve();

  return Promise.all(
    urls.map((url) => {
      if (buffers.has(url)) return Promise.resolve();
      if (loading.has(url)) return loading.get(url);

      const promise = fetch(url)
        .then((res) => res.arrayBuffer())
        .then(
          (data) =>
            new Promise((resolve, reject) => {
              c.decodeAudioData(data, resolve, reject);
            })
        )
        .then((decoded) => {
          buffers.set(url, decoded);
        })
        .catch((err) => {
          console.warn('Не удалось загрузить звук:', url, err);
        })
        .finally(() => {
          loading.delete(url);
        });

      loading.set(url, promise);
      return promise;
    })
  );
}

// Браузеры держат звук "заблокированным", пока пользователь не взаимодействовал
// со страницей. Эту функцию вызываем при первом касании/клике.
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') {
    c.resume().catch(() => {});
  }
}

export function playSound(url, volume = 1) {
  const c = getCtx();
  const buffer = buffers.get(url);

  if (c && buffer) {
    if (c.state === 'suspended') c.resume().catch(() => {});
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(c.destination);
    source.start(0);
    return;
  }

  // Запасной вариант: звук ещё не успел догрузиться
  const audio = new Audio(url);
  audio.volume = volume;
  audio.play().catch(() => {});
}
