export async function importWasm(url: string): Promise<WebAssembly.Module> {
    if (!url.endsWith(".js")) throw new Error(`${url} not js`)
    url = url.slice(0, url.length - ".js".length) + ".wasm"
    return await WebAssembly.compileStreaming(await fetch(url))
}