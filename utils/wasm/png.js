let ref = { deref() { } };

import { importWasm } from '../wasm-import.ts'
const wasm_mod = await importWasm(import.meta.url)

function wasm() {
  let u8;

  const {
    wfree, walloc, decode, memory,
    width: wwidth, height: wheight,
  } = new WebAssembly.Instance(wasm_mod, {
    env: {
      emscripten_notify_memory_growth() {
        u8 = new Uint8Array(memory.buffer);
      },
    },
  }).exports;

  u8 = new Uint8Array(memory.buffer);

  return {
    decode(buffer) {
      const ptr = walloc(buffer.length);

      u8.set(buffer, ptr);
      const status = decode(ptr, buffer.length);

      wfree(ptr);
      if (0 > status) throw new Error(`png: failed to decode (${status})`);

      const width = wwidth();
      const height = wheight();
      const framebuffer = u8.slice(status, status + 4 * width * height);

      wfree(status);
      return { width, height, framebuffer };
    },
  };
}

export function decode(buffer) {
  return (ref.deref() || (ref = new WeakRef(wasm())).deref()).decode(buffer);
}