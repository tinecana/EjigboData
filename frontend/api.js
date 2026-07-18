const API_BASE = "https://ejigbodata-backend.onrender.com/api";

const API = {

    // ==========================
    // WARD DATA
    // ==========================

    loadWard(ward) {
        return this.get(`/ward/${ward}`);
    },

    saveWard(ward, data) {
        return this.post(`/ward/${ward}`, data);
    },

    // ==========================
    // VOTERS
    // ==========================

    loadVoters(ward) {
        return this.get(`/voters/${ward}`);
    },

    saveVoters(ward, data) {
        return this.post(`/voters/${ward}`, data);
    },

    // ==========================
    // SMS
    // ==========================

    sendSMS(data) {
        return this.post("/sms", data);
    },

    // ==========================
    // GENERIC GET
    // ==========================

    async get(endpoint) {

        const res = await fetch(API_BASE + endpoint);

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return await res.json();

    },

    // ==========================
    // GENERIC POST
    // ==========================

    async post(endpoint, data) {

        const res = await fetch(API_BASE + endpoint, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)

        });

        if (!res.ok) {
            throw new Error(await res.text());
        }

        return await res.json();

    }

};