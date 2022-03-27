const streams = new Map;
let ref = { deref() {} };
const utf8encoder = new TextEncoder;

import { importWasm } from '../wasm-import.ts'
const wasm_mod = await importWasm(import.meta.url)

function wasm() {
  return ref.deref() || (ref = new WeakRef(new WebAssembly.Instance(wasm_mod, {
    env: {
      push_to_stream(id, ptr) {
        streams.get(id).cb(mem.u8(ptr, mem.length()).slice());
      },
    },
  }).exports)).deref();
}

class mem {
  static length() { return wasm().wlen(); }
  static alloc(size) { return wasm().walloc(size); }
  static free(ptr, size) { return wasm().wfree(ptr, size); }
  static u8(ptr, size) { return new Uint8Array(wasm().memory.buffer, ptr, size); }
  static u32(ptr, size) { return new Uint32Array(wasm().memory.buffer, ptr, size); }

  static copy_and_free(ptr, size) {
    let slice = mem.u8(ptr, size).slice();
    return (wasm().wfree(ptr, size), slice);
  }
}

export class Encoder {
  constructor(width, height, loops = -1) {
    this.slices = [];
    this._w = wasm();
    streams.set(0, this);
    this.ptr = wasm().encoder_new(0, width, height, loops);
  }

  cb(buffer) {
    this.slices.push(buffer);
  }

  free() {
    this.ptr = wasm().encoder_free(this.ptr);
    streams.delete(0);
  }

  u8() {
    this.free();
    let offset = 0;
    const u8 = new Uint8Array(this.slices.reduce((sum, array) => sum + array.length, 0));

    for (const x of this.slices) {
      u8.set(x, offset);
      offset += x.length;
    }

    return u8;
  }

  add(x, y, delay, width, height, buffer, dispose, quality) {
    const ptr = mem.alloc(buffer.length);
    mem.u8(ptr, buffer.length).set(buffer);
    wasm().encoder_add(this.ptr, ptr, buffer.length, x, y, width, height, delay, dispose, quality);
  }

  set comment(comment) {
    const buffer = utf8encoder.encode(comment);

    const ptr = mem.alloc(buffer.length);
    mem.u8(ptr, buffer.length).set(buffer);
    wasm().encoder_add_comment(this.ptr, ptr, buffer.length);
  }

  set application(application) {
    const buffer = utf8encoder.encode(application);

    const ptr = mem.alloc(buffer.length);
    mem.u8(ptr, buffer.length).set(buffer);
    wasm().encoder_add_application(this.ptr, ptr, buffer.length);
  }
}

export class Decoder {
  constructor(buffer, limit = 0) {
    this._w = wasm();
    const bptr = mem.alloc(buffer.length);
    mem.u8(bptr, buffer.length).set(buffer);
    this.ptr = wasm().decoder_new(bptr, buffer.length, limit);
    if (0 === this.ptr) throw new Error('gif: failed to parse gif header');

    this.width = wasm().decoder_width(this.ptr);
    this.height = wasm().decoder_height(this.ptr);
  }

  free() {
    this.ptr = wasm().decoder_free(this.ptr);
  }

  *frames() {
    let frame;
    while (frame = this.frame()) yield frame;
  }

  frame() {
    const ptr = wasm().decoder_frame(this.ptr);

    if (1 === ptr) return null;
    if (0 === ptr) throw (this.free(), new Error('gif: failed to decode frame'));

    const framebuffer = {
      x: wasm().decoder_frame_x(ptr),
      y: wasm().decoder_frame_y(ptr),
      delay: wasm().decoder_frame_delay(ptr),
      width: wasm().decoder_frame_width(ptr),
      height: wasm().decoder_frame_height(ptr),
      dispose: wasm().decoder_frame_dispose(ptr),
      buffer: mem.u8(wasm().decoder_frame_buffer(ptr), mem.length()).slice(),
    };

    return (wasm().decoder_frame_free(ptr), framebuffer);
  }
}
