const express = require("express");

module.exports = function () {

    const router = express.Router();

    router.post("/", async (req, res) => {

    console.log("BODY RECEIVED:");
    console.log(req.body);

    try {

            const {
                phone,
                message,
                senderId = "PWMS"
            } = req.body;

            console.log("========== NEW SMS REQUEST ==========");
console.log("Phone:", phone);
console.log("Message:", message);
console.log("Sender:", senderId);
console.log("=====================================");

            const response = await fetch(
                "https://api.ng.termii.com/api/sms/send",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        api_key: process.env.TERMII_API_KEY,
                        to: phone,
                        from: senderId,
                        sms: message,
                        type: "plain",
                        channel: "generic"
                    })
                }
            );

            const result = await response.json();

            console.log("Termii Response:");
console.log(result);

            if (!response.ok || result.code !== "200") {
                return res.status(500).json({
                    ok: false,
                    error: result.message || "SMS failed."
                });
            }

            res.json({
                ok: true,
                result
            });

        } catch (err) {

            res.status(500).json({
                ok: false,
                error: err.message
            });

        }

    });

    return router;

};