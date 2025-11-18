const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: "ep-falling-frost-a4hdm4ge-pooler.us-east-1.aws.neon.tech"
});

app.get('/api/datos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM personal');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

app.listen(3001, () => {
    console.log('Server is running on port 3001');
});