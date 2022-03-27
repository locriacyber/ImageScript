import { promises as fs } from 'fs';
import { Image } from '../ImageScript';

const panic = message => {
  console.error(message);
  process.exit(1);
};

(async () => {
  {
    const image = new Image(512, 512);
    image.drawCircle(256, 256, 128, 0xffffffff);
    const encoded = await image.encode(1, {
      creationTime: 0,
      software: ''
    });
    if (process.env.OVERWRITE_TEST) await fs.writeFile('./tests/targets/circle.png', encoded);
    const target = await fs.readFile('./tests/targets/circle.png');
    if (!Buffer.from(target).equals(Buffer.from(encoded))) panic('drawCircle 128 failed');
  }
  {
    const image = new Image(512, 512);
    image.drawCircle(256, 256, 320, 0x000000ff);
    const encoded = await image.encode(1, {
      creationTime: 0,
      software: ''
    });
    if (process.env.OVERWRITE_TEST) await fs.writeFile('./tests/targets/circle2.png', encoded);
    const target = await fs.readFile('./tests/targets/circle2.png');
    if (!Buffer.from(target).equals(Buffer.from(encoded))) panic('drawCircle 320 failed');
  }
  {
    const image = new Image(256, 512);
    image.fill(0x000000ff);
    image.cropCircle();
    const encoded = await image.encode(1, {
      creationTime: 0,
      software: ''
    });
    if (process.env.OVERWRITE_TEST) await fs.writeFile('./tests/targets/circle3.png', encoded);
    const target = await fs.readFile('./tests/targets/circle3.png');
    if (!Buffer.from(target).equals(Buffer.from(encoded))) panic('cropCircle failed');
  }
  {
    const image = new Image(256, 512);
    image.fill(0x000000ff);
    image.cropCircle(true, .5);
    const encoded = await image.encode(1, {
      creationTime: 0,
      software: ''
    });
    if (process.env.OVERWRITE_TEST) await fs.writeFile('./tests/targets/circle4.png', encoded);
    const target = await fs.readFile('./tests/targets/circle4.png');
    if (!Buffer.from(target).equals(Buffer.from(encoded))) panic('cropCircle max feathering failed');
  }
})();