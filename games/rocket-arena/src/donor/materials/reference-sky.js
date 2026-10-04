import { ci as RepeatWrapping } from '../vendor/three.js';

export const REFERENCE_SKY_URL = '/assets/lighting/reference-daylight-sky.webp';
let skyImage;
function loadSkyImage() {
  return skyImage ??= new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => { skyImage = null; reject(new Error('Experimental daylight sky could not load')); };
    image.src = REFERENCE_SKY_URL;
  });
}

// Keep the same GPU texture and sampler. A pending load must never re-enable
// the experiment after the user has switched it off.
export function createReferenceSkyController(texture, loadImage = loadSkyImage) {
  const original = { image: texture.image, wrapS: texture.wrapS, repeatX: texture.repeat.x };
  let enabled = false, loaded, pending;
  const apply = () => {
    texture.image = enabled && loaded ? loaded : original.image;
    texture.wrapS = enabled && loaded ? RepeatWrapping : original.wrapS;
    texture.repeat.x = enabled && loaded ? 1 : original.repeatX;
    texture.needsUpdate = true;
  };
  return {
    setEnabled(value) {
      if (enabled === value) return pending;
      enabled = value;
      if (value && !loaded) {
        pending ??= loadImage().then(image => {
          if (image.width !== original.image.width || image.height !== original.image.height)
            throw new Error('Experimental sky must preserve the original texture dimensions');
          loaded = image; apply();
        }).catch(error => { pending = null; enabled = false; apply(); throw error; });
      } else apply();
      return pending;
    },
    restore() { enabled = false; apply(); },
  };
}
