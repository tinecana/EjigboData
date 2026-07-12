require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase =require("./config/supabase");
const app = express();
const smsRoutes = require("./routes/sms")();

app.use(express.json());
app.use("/api/sms", smsRoutes);

app.use(cors());
;
const wardRoutes =
require("./routes/ward")(supabase);

app.get('/health', (req, res) => {
    res.json({
        ok: true,
        service: 'PWMS Backend'
    });
});

app.get('/api/test-supabase', async (req, res) => {

    try {

        const { data, error } = await supabase
           .from("ward_data")
            .select('*')
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

app.use(
    "/api/ward",
    wardRoutes
);

app.listen(process.env.PORT, () => {
    console.log(`Backend running on http://localhost:${process.env.PORT}`);
});