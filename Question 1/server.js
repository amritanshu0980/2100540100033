const express = require('express');
const axios = require('axios');

const WINDOW_SIZE = 10;
const TIMEOUT = 500; 

const windowStorage = { p: [], f: [], e: [], r: [] };

const apiUrls = {
    p: 'http://20.244.56.144/test/primes',
    f: 'http://20.244.56.144/test/fibo',
    e: 'http://20.244.56.144/test/even',
    r: 'http://20.244.56.144/test/rand',
};

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzI0MTY1NjY4LCJpYXQiOjE3MjQxNjUzNjgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjhiNzMwNjk3LTVkOTMtNDAxYy1hYzg4LTY5OTY4ZDBmYTI1MyIsInN1YiI6ImJhc2h1MDk4MEBiYmRuaXRtLmFjLmluIn0sImNvbXBhbnlOYW1lIjoiQkJETklUTSIsImNsaWVudElEIjoiOGI3MzA2OTctNWQ5My00MDFjLWFjODgtNjk5NjhkMGZhMjUzIiwiY2xpZW50U2VjcmV0IjoieUR4Z09ndUNjR1lBdlhCeiIsIm93bmVyTmFtZSI6IkFtcml0YW5zaHUiLCJvd25lckVtYWlsIjoiYmFzaHUwOTgwQGJiZG5pdG0uYWMuaW4iLCJyb2xsTm8iOiIyMTAwNTQwMTAwMDMzIn0.bBwxV3jdbeqJJZ72w3XyItmdUbwcbw78_KySDJPA560';

const app = express();

async function fetchNumbers(apiUrl) {
    const headers = { Authorization: `Bearer ${token}` };
    try {
        const response = await axios.get(apiUrl, { headers, timeout: TIMEOUT });
        if (response.status === 200) {
            return response.data.numbers || [];
        }
        return [];
    } catch (error) {
        return [];
    }
}

function updateWindow(numberid, newNumbers) {
    const prevWindow = [...windowStorage[numberid]];

    const uniqueNumbers = Array.from(new Set([...windowStorage[numberid], ...newNumbers]));

    if (uniqueNumbers.length > WINDOW_SIZE) {
        uniqueNumbers.splice(0, uniqueNumbers.length - WINDOW_SIZE);
    }

    windowStorage[numberid] = uniqueNumbers;
    return { prevWindow, currWindow: uniqueNumbers };
}

function calculateAverage(numbers) {
    if (numbers.length === 0) return 0.0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

app.get('/numbers/:numberid', async (req, res) => {
    const numberid = req.params.numberid;

    if (!apiUrls[numberid]) {
        return res.status(400).json({ detail: 'Invalid number ID' });
    }

    const fetchedNumbers = await fetchNumbers(apiUrls[numberid]);

    const windowStates = updateWindow(numberid, fetchedNumbers);

    const avg = calculateAverage(windowStates.currWindow);

    const response = {
        numbers: fetchedNumbers,
        windowPrevState: windowStates.prevWindow,
        windowCurrState: windowStates.currWindow,
        avg: avg,
    };
    console.log(response)
    res.json(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
