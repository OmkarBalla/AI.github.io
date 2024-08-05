require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = 3000;

// OpenAI API Key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Set up static files serving
app.use(express.static('public'));

// Set up file upload
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const workbook = xlsx.readFile(file.path);
        const sheetNames = workbook.SheetNames;
        const result = {};

        sheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);
            result[sheetName] = data;
        });

        // Clean up the uploaded file
        fs.unlinkSync(file.path);

        // AI processing example
        const aiResults = await processWithAI(result);
        res.json({ data: result, aiResults });
    } catch (error) {
        res.status(500).send('Error processing file.');
    }
});

async function processWithAI(data) {
    // Example AI processing: Sending data to OpenAI API
    try {
        const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'text-davinci-003',
            prompt: `Analyze the following data and provide insights:\n${JSON.stringify(data, null, 2)}`,
            max_tokens: 150,
        }, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].text;
    } catch (error) {
        console.error('AI Processing Error:', error);
        return 'Error processing with AI.';
    }
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
