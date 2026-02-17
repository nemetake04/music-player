const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const sounds = {
  A: "sound1.wav",
  B: "sound2.wav",
  C: "sound3.wav"
};

let buffers = {};
let scheduled = [];
let isPlaying = false;

const PIXELS_PER_SECOND = 100;

/* 音源読み込み */
async function loadSounds() {
  for (let key in sounds) {
    const response = await fetch(sounds[key]);
    const arrayBuffer = await response.arrayBuffer();
    buffers[key] = await audioCtx.decodeAudioData(arrayBuffer);
  }
}
loadSounds();

/* パレットからドラッグ */
document.querySelectorAll(".sound").forEach(sound => {
  sound.addEventListener("dragstart", e => {
    e.dataTransfer.setData("key", sound.dataset.key);
  });
});

/* レイヤーにドロップ */
document.querySelectorAll(".layer").forEach(layer => {
  layer.addEventListener("dragover", e => e.preventDefault());

  layer.addEventListener("drop", e => {
    e.preventDefault();
    const key = e.dataTransfer.getData("key");

    const block = document.createElement("div");
    block.className = "block";
    block.textContent = key;

    const duration = buffers[key].duration;
    block.style.width = (duration * PIXELS_PER_SECOND) + "px";

    const rect = layer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    block.style.left = offsetX + "px";

    layer.appendChild(block);
  });
});

/* 再生 */
async function play() {
  await audioCtx.resume();
  if (isPlaying) return;
  isPlaying = true;

  const startTime = audioCtx.currentTime;

  document.querySelectorAll(".layer").forEach(layer => {
    layer.querySelectorAll(".block").forEach(block => {
      const key = block.textContent;
      const source = audioCtx.createBufferSource();
      source.buffer = buffers[key];
      source.connect(audioCtx.destination);

      const offset = parseInt(block.style.left) / PIXELS_PER_SECOND;
      source.start(startTime + offset);

      scheduled.push(source);
    });
  });
}

/* 停止 */
function stop() {
  scheduled.forEach(src => src.stop());
  scheduled = [];
  isPlaying = false;
}
