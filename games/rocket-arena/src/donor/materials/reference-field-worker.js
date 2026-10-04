import { createReferenceFieldLight } from './reference-field-light.js';
import { bakeReferenceFieldPixels } from './reference-field-pixels.js';

let field;
self.onmessage = ({ data: { id, pixels, width, height, direction } }) => {
  if (field) field.update(direction);
  else field = createReferenceFieldLight(direction);
  const bytes = new Uint8ClampedArray(pixels);
  bakeReferenceFieldPixels(bytes, width, height, field.data, field.size);
  self.postMessage({ id, pixels: bytes.buffer }, [bytes.buffer]);
};
