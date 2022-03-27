export async function importWasm(url: string): Promise<WebAssembly.Module> {
    if (!url.endsWith(".js")) throw new Error(`${url} not js`)
    const pos_ext = url.length - ".js".length
    url = url.slice(0, pos_ext) + ".wasm"
    return await WebAssembly.compileStreaming(fetch(url))
}
