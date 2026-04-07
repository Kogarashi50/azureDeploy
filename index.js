const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Let Azure pick the port (usually 8080 or 80)
const PORT = process.env.PORT || 8080; 

// On Azure Linux, /home is the best place to write persistent files
const FILE = path.join(__dirname, "visits.json");

let lock = false;

function readCounter() {
    try {
        if (!fs.existsSync(FILE)) {
            fs.writeFileSync(FILE, JSON.stringify({ count: 0 }));
        }
        const data = fs.readFileSync(FILE);
        return JSON.parse(data).count;
    } catch (err) {
        console.error("Read Error:", err);
        return 0;
    }
}

function writeCounter(count) {
    try {
        fs.writeFileSync(FILE, JSON.stringify({ count }, null, 2));
    } catch (err) {
        console.error("Write Error:", err);
    }
}

app.get("/", async (req, res) => {
    while (lock) { await new Promise(r => setTimeout(r, 10)); }
    lock = true;
    try {
        let count = readCounter();
        count++;
        writeCounter(count);
        
        res.send(`
            <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                <h1>Compteur de visites Azure</h1>
                <p style="font-size: 24px;"><strong>Nombre de visites :</strong> ${count}</p>
                <hr style="width: 50%;">
                <p><strong>Hostname :</strong> ${req.hostname}</p>
                <p><strong>Serveur Port :</strong> ${PORT}</p>
            </div>
        `);
    } finally {
        lock = false;
    }
});

app.listen(PORT, () => {
    console.log(Server started on port ${PORT});
});