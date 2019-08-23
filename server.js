const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'postgresql',
        password : '',
        database : 'tippy'
      } 
})

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) => {
    res.json('is working');
})

app.post('/signin', (req,res) => {
    const { email, password } = req.body;

    res.json(email)
})

app.post('/signup', (req,res) => {
    const { name, email, password } = req.body;


    res.json(name, email)

})

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));