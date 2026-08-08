require("dotenv").config();

const express = require("express");
const cors = require("cors");
const supabase = require("./config/supabase");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Legacy ward blob storage (Sprint 1 Supabase path)
app.use("/api/ward", require("./routes/api-v2/ward")(supabase));

// SMS endpoint
app.use("/api/sms", require("./routes/api-v2/sms")());

// Enterprise PostgreSQL CRUD API (Sprint 2+)
app.use("/api/v2", require("./routes/api-v2/index"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[SERVER] PWMS backend running on port ${PORT}`);
});
