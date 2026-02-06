
import https from 'https';

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const MODELS_TO_TEST = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-1.5-pro"];

async function testModel(model) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/${model}:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`\n--- Testing ${model} ---`);
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode !== 200) {
                    console.log("Error Body:", body);
                } else {
                    console.log("Success!");
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    for (const model of MODELS_TO_TEST) {
        await testModel(model);
    }
}

run();
