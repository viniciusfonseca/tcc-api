const request = require('request')

export function redirectImage (uri, targetStream) {
    return new Promise(resolve => {
        request.head(uri, () => {
            request(uri).pipe(targetStream).on('close', resolve);
        });
    })
}