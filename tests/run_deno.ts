import { Image } from '../ImageScript.js'


Image.decode(await Deno.readFile('tests/targets/circle.png'))