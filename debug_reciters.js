const https = require('https');

https.get('https://quranapi.pages.dev/api/audio/1/1.json', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        const json = JSON.parse(data);
        for (const [id, details] of Object.entries(json)) {
            console.log(`ID: ${id}, Name: ${details.reciter}`);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
