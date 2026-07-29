const express = require("express");

module.exports = function (supabase) {

    const router = express.Router();

    // ==========================
    // LOAD WARD
    // ==========================
    router.get("/:ward", async (req, res) => {

        const ward = req.params.ward;

        const { data, error } = await supabase
            .from("ward_data")
            .select("data")
            .eq("ward", ward)
            .maybeSingle();

        if (error) {
            return res.status(500).json({
                ok: false,
                error: error.message
            });
        }

        res.json({
            ok: true,
            data: data?.data || {}
        });

    });

    // ==========================
    // SAVE WARD
    // ==========================
    
    

    
        if (error) {
            return res.status(500).json({
                ok: false,
                error: error.message
            });
        }

        res.json({
            ok: true,
            message: "Ward data saved successfully."
        });

    });

    return router;

};