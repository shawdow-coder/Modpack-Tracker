const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// 📸 Image Upload Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// 📂 Helper functions
function readData() {
    try {
        if (!fs.existsSync("data.json")) {
            fs.writeFileSync("data.json", "[]");
        }

        const raw = fs.readFileSync("data.json");

        if (!raw || raw.length === 0) {
            return [];
        }

        return JSON.parse(raw);
    } catch (err) {
        console.error("Data read error:", err);
        return [];
    }
}
function writeData(data) {
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// 🚀 Submit Feedback
app.post("/submit", upload.single("image"), (req, res) => {
    const data = readData();

    const newItem = {
        id: uuidv4(),
        ticketId: uuidv4().slice(0, 8),
        name: req.body.name,
        type: req.body.type,
        description: req.body.description,
        image: req.file ? req.file.filename : null,
        reply: "",
        status: "Open",
        createdAt: new Date()
    };

    data.push(newItem);
    writeData(data);

    res.json({ ticketId: newItem.ticketId });
});

// 📥 Get ALL feedback
app.get("/feedback", (req, res) => {
    res.json(readData());
});

// 🔍 Track
app.get("/track/:id", (req, res) => {
    const data = readData();
    const item = data.find(x => x.ticketId === req.params.id);
    res.json(item || null);
});

// 💬 Reply
app.post("/reply/:id", (req, res) => {
    const data = readData();
    const item = data.find(x => x.id === req.params.id);

    if (item) {
        item.reply = req.body.reply;
        writeData(data);
    }

    res.json({ message: "Reply saved" });
});

// 🟢 Update Status
app.post("/status/:id", (req, res) => {
    const data = readData();
    const item = data.find(x => x.id === req.params.id);

    if (item) {
        item.status = req.body.status;
        writeData(data);
    }

    res.json({ message: "Status updated" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));