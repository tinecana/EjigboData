require('dotenv').config();

const express = require('express');
const cors = require('cors');

const supabase = require("./config/supabase");

const app = express();

const smsRoutes = require("./routes/sms")();
const wardRoutes = require("./routes/ward")(supabase);

// =====================
// Middlewares
// =====================
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// =====================
// Routes
// =====================
app.use("/api/sms", smsRoutes);
app.use("/api/ward", wardRoutes);

// Root Route
app.get("/", (req, res) => {
    res.send("PWMS Backend Running");
});

// Backend Test
app.get("/api/test", (req, res) => {
    res.json({
        ok: true,
        message: "PWMS Backend Online"
    });
});

// Health Check
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        service: "PWMS Backend"
    });
});

// Supabase Test
app.get("/api/test-supabase", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("ward_data")
            .select("*")
            .limit(1);

        if (error) {
            return res.status(500).json({
                ok: false,
                error: error.message
            });
        }

        res.json({
            ok: true,
            connected: true,
            data
        });

    } catch (err) {

        res.status(500).json({
            ok: false,
            error: err.message
        });

    }

});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});