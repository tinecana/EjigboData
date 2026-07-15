const { createClient } = require("@supabase/supabase-js");

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);

console.log(
    "SERVICE_ROLE_KEY:",
    process.env.SUPABASE_SERVICE_ROLE_KEY
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 25) + "..."
        : "NOT FOUND"
);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;