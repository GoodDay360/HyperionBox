import { writeFile, BaseDirectory, exists, remove } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";

async function download_file_in_chunks({
    url = "",
    output_file = "",
    chunk_size = 6 * 1024 * 1024, // 6MB chunks
    start_size = 0, // Resume from this byte offset
    callback = ({}) => {}
}: {
    url: string;
    output_file: string;
    chunk_size?: number;
    start_size?: number;
    callback?: any;
}): Promise<any> {
    try {
        const response = await fetch(url, {
            headers: start_size > 0 ? { Range: `bytes=${start_size}-` } : undefined
        });

        if (!response.ok) {
            return { code: 500, message: `HTTP error! Status: ${response.status}` };
        }

        const totalSize = parseInt(response.headers.get("content-length") as string, 10) + start_size;
        let receivedSize = start_size;

        // Skip removing the file if resuming from a specific byte offset
        if (start_size === 0 && await exists(output_file)) {
            await remove(output_file, { baseDir: BaseDirectory.AppData, recursive: true });
        }

        const reader = response.body?.getReader();
        if (!reader) {
            return { code: 500, message: "Stream reader unavailable!" };
        }

        let buffer = new Uint8Array(chunk_size);
        let bufferOffset = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            for (let i = 0; i < (value?.length || 0); i++) {
                buffer[bufferOffset++] = value[i];

                if (bufferOffset === chunk_size) {
                    await writeFile(output_file, buffer, {
                        baseDir: BaseDirectory.AppData,
                        append: true
                    });

                    callback({ current_size: receivedSize, total_size: totalSize });
                    buffer = new Uint8Array(chunk_size); // Reset buffer
                    bufferOffset = 0;
                }
            }

            receivedSize += value?.length || 0;
        }

        // Write remaining buffer if not empty
        if (bufferOffset > 0) {
            await writeFile(output_file, buffer.subarray(0, bufferOffset), {
                baseDir: BaseDirectory.AppData,
                append: true
            });

            callback({ current_size: receivedSize, total_size: totalSize });
        }

        return { code: 200, message: "OK" };
    } catch (error) {
        console.error("Error downloading file:", error);
        return { code: 500, message: error };
    }
}

export default download_file_in_chunks;
