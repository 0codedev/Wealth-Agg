
import https from 'https';

const API_KEY = "AIzaSyCLOar4MBIcCQsRfEJxW6JFMYdP2OdEqRw";

async function listModels() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models?key=${API_KEY}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`\n--- Available Models ---`);
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    const data = JSON.parse(body);
                    data.models.forEach(m => {
                        if (m.supportedGenerationMethods.includes('generateContent')) {
                            console.log(`- ${m.name}`);
                        }
                    });
                } else {
                    console.log("Error Body:", body);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve();
        });

        req.end();
    });
}

listModels();
