"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProxy = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
exports.fetchProxy = (0, https_1.onRequest)({ region: 'europe-west1', cors: true }, async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!(authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer '))) {
        res.status(401).send('Unauthorized');
        return;
    }
    try {
        await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    }
    catch {
        res.status(401).send('Invalid token');
        return;
    }
    const url = req.query.url;
    if (!url) {
        res.status(400).send('Missing url parameter');
        return;
    }
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
        });
        if (!response.ok) {
            res.status(response.status).send(`Upstream returned ${response.status}`);
            return;
        }
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(await response.text());
    }
    catch (err) {
        res.status(500).send(`Fetch failed: ${err}`);
    }
});
//# sourceMappingURL=index.js.map