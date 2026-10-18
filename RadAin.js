(function() {
    'use strict';

    const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxCcY9dN3qtwEtB3xISuEmULPJf0aq9Ka0vbZNx2QInIIVq3Yx-M5hcy_XVwFvMBDAMYg/exec";
    const CACHE_KEY = "cached_blocked_ains";
    const LAST_FETCH_KEY = "last_fetch_time";
    const CACHE_DURATION = 2 * 60 * 1000; 

    let blockedAins = [];

    // Local Cache Load Kora
    function loadLocalCache() {
        let cachedData = GM_getValue(CACHE_KEY);
        if (cachedData) {
            try {
                let parsed = JSON.parse(cachedData);
                if (Array.isArray(parsed)) {
                    blockedAins = parsed.map(item => String(item).trim().toLowerCase());
                }
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }
    }

    // Google Sheet theke fresh data fetch ebong cache hard-replace kora
    function fetchAndUpdateSheetData(force = false) {
        let lastFetch = GM_getValue(LAST_FETCH_KEY) || 0;
        let now = new Date().getTime();

        if (force || blockedAins.length === 0 || (now - lastFetch > CACHE_DURATION)) {
            // URL er sathe timestamp jog kora hocche jate browser HTTP cache bypass kore
            let freshUrl = GOOGLE_SHEET_API_URL + "?cachebust=" + now;

            GM_xmlhttpRequest({
                method: "GET",
                url: freshUrl,
                anonymous: true,
                onload: function(response) {
                    try {
                        let freshData = JSON.parse(response.responseText);
                        if (Array.isArray(freshData)) {
                            // Purono cache sompurno muche క్రొత్త data diye replace kora
                            let cleanedData = freshData.map(item => String(item).trim());
                            blockedAins = cleanedData.map(item => item.toLowerCase());

                            // Hard overwrite in Tampermonkey storage
                            GM_setValue(CACHE_KEY, JSON.stringify(cleanedData));
                            GM_setValue(LAST_FETCH_KEY, now);

                            console.log("Cache strictly updated with latest sheet data:", cleanedData);
                            checkAinAndToggleSave(); // Update hoyei r ekbar button state check kora
                        }
                    } catch (e) {
                        console.error("Error parsing AIN list from sheet", e);
                    }
                },
                onerror: function(err) {
                    console.error("Fetch Error:", err);
                }
            });
        }
    }

    // Initialization
    loadLocalCache();
    fetchAndUpdateSheetData(true); // Page load ear sathe sathe force update hobe

    // AIN Check Function
    function checkAinAndToggleSave() {
        const agentInput = document.getElementById('agentid');
        const saveButton = document.querySelector('input.submit[value="Save"]');

        if (!agentInput || !saveButton) return;

        const currentVal = agentInput.value.trim().toLowerCase();

        // Jodi current input value-ti sheet-er blocked list-e thake
        if (blockedAins.length > 0 && currentVal !== '' && blockedAins.includes(currentVal)) {
            saveButton.disabled = true;
            saveButton.style.opacity = "0.5";
            saveButton.style.cursor = "not-allowed";
        } else {
            // Sheet-e na thakle ba muche felle Save button unlock hobe
            saveButton.disabled = false;
            saveButton.style.opacity = "1";
            saveButton.style.cursor = "pointer";
        }
    }

    // Event Listeners
    document.addEventListener('input', function(e) {
        if (e.target && e.target.id === 'agentid') {
            checkAinAndToggleSave();
        }
    });

    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'agentid') {
            checkAinAndToggleSave();
        }
    });

    setInterval(checkAinAndToggleSave, 500);

})();
