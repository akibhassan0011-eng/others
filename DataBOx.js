(function() {
    'use strict';

    const GOOGLE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzorLKRe4ma8TfUmKjeOdEtTSFiFsxd49AoEfaUpkBlLVogzdCD2ubMN2wzBVVo1OCC/exec';

    let startTime = Date.now();

    function sendDataToGoogleSheet(actionType, details = '') {
        const payload = {
            url: window.location.href,
            title: document.title || 'No Title',
            action: actionType + (details ? `: ${details}` : '')
        };

        GM_xmlhttpRequest({
            method: "POST",
            url: GOOGLE_APP_SCRIPT_URL,
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            data: JSON.stringify(payload),
            anonymous: true,
            onload: function(response) {
                console.log("Data sent successfully! Response:", response.responseText);
            },
            onerror: function(error) {
                console.error("Error sending data:", error);
            }
        });
    }

    function extractDatesFromText(text) {
        if (!text) return '';
        const dateRegex = /\b(?:\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/gi;
        const matches = text.match(dateRegex);
        if (matches && matches.length > 0) {
            return [...new Set(matches)].slice(0, 5).join(', ');
        }
        return '';
    }

    window.addEventListener('load', function() {
        const pageDates = extractDatesFromText(document.body ? document.body.innerText : '');
        sendDataToGoogleSheet('Page Visit', pageDates ? `Page Dates: [${pageDates}]` : 'No dates on page');
    });

    document.addEventListener('copy', function() {
        const selection = window.getSelection().toString().trim();
        if (selection) {
            const foundDates = extractDatesFromText(selection);
            const snippet = selection.length > 100 ? selection.substring(0, 100) + '...' : selection;
            const dateInfo = foundDates ? ` | Dates in Selection: [${foundDates}]` : '';
            sendDataToGoogleSheet('Text Copied', `"${snippet}"${dateInfo}`);
        }
    });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
            const pageDates = extractDatesFromText(document.body ? document.body.innerText : '');
            sendDataToGoogleSheet('Find Attempted (Ctrl+F)', pageDates ? `Found Dates: [${pageDates}]` : 'No dates found');
        }
    });

    document.addEventListener('submit', function(e) {
        const submitTime = new Date().toLocaleString();
        let formName = e.target.getAttribute('name') || e.target.getAttribute('id') || 'Form';
        const pageDates = extractDatesFromText(document.body ? document.body.innerText : '');
        sendDataToGoogleSheet('Form Submitted', `Form: ${formName} | At: ${submitTime} | Dates: [${pageDates || 'None'}]`);
    }, true);

    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.startsWith('javascript:')) {
            if (link.hostname !== window.location.hostname) {
                sendDataToGoogleSheet('External Link Clicked', `Target: ${link.href}`);
            }
        }
    });

    window.addEventListener('beforeunload', function() {
        const timeSpentSeconds = Math.round((Date.now() - startTime) / 1000);
        sendDataToGoogleSheet('Page Leave', `Time Spent: ${timeSpentSeconds} seconds`);
    });

})();
