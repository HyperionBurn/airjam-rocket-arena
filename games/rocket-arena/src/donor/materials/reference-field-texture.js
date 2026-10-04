// Static art generation runs off the render thread. Keep only one active job
// and the latest sun direction when a user drags the lighting slider.
export function createReferenceFieldTexture(texture, direction, {
  createCanvas = () => document.createElement('canvas'),
  createWorker = () => new Worker('/src/materials/reference-field-worker.js', { type: 'module' }),
} = {}) {
  const original = texture.image, canvas = createCanvas();
  canvas.width = original.width; canvas.height = original.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(original, 0, 0);
  const baseline = context.getImageData(0, 0, canvas.width, canvas.height);
  const worker = createWorker();
  let active = true, running = null, queued = null, nextId = 0, ready;
  const dispatch = job => {
    running = job;
    const pixels = baseline.data.slice().buffer;
    worker.postMessage({ id: job.id, direction: job.direction, width: canvas.width, height: canvas.height, pixels }, [pixels]);
  };
  const update = sunDirection => {
    ready = new Promise((resolve, reject) => {
      const job = { id: ++nextId, direction: sunDirection, resolve, reject };
      if (!active) { resolve(false); return; }
      if (running) { queued?.resolve(false); queued = job; }
      else dispatch(job);
    });
    return ready;
  };
  worker.onmessage = ({ data }) => {
    if (!active || data.id !== running?.id) return;
    const finished = running; running = null;
    if (queued) {
      finished.resolve(false);
      const latest = queued; queued = null; dispatch(latest);
      return;
    }
    const image = context.createImageData(canvas.width, canvas.height);
    image.data.set(new Uint8ClampedArray(data.pixels));
    context.putImageData(image, 0, 0);
    texture.image = canvas; texture.needsUpdate = true;
    finished.resolve(true);
  };
  worker.onerror = error => {
    running?.reject(new Error(error.message || 'Experimental field could not bake'));
    queued?.reject(new Error(error.message || 'Experimental field could not bake'));
    running = queued = null;
    texture.image = original; texture.needsUpdate = true;
  };
  update(direction);
  return {
    get ready() { return ready; },
    update,
    restore() {
      active = false; worker.terminate(); running?.resolve(false); queued?.resolve(false);
      running = queued = null; texture.image = original; texture.needsUpdate = true;
    },
  };
}
