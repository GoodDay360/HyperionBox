

function path_to_file_url(filePath:string) {
    let normalizedPath = filePath.replace(/\\/g, '/'); // Convert Windows backslashes to forward slashes

    // Ensure it starts with a leading slash for Windows paths (C:/ becomes /C:/)
    if (normalizedPath[0] !== '/' && /^[a-zA-Z]:/.test(normalizedPath)) {
        normalizedPath = '/' + normalizedPath;
    }

    return encodeURI(`file://${normalizedPath}`);
}

export default path_to_file_url;