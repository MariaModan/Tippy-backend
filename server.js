const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        user : 'postgres',
        password : '',
        database : 'tippy'
      } 
})

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) => {
    console.log('ok1');

    res.json('is working');
})

app.post('/signin', (req,res) => {
    const { email, password } = req.body;
    
    res.json(email)
})

app.post('/signup', (req,res) => {
    const { name, email, password } = req.body;
    
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);

    db.transaction( trx => {
        trx('login')
            .insert({
                email: email,
                hash: hash
            })
            .returning('userid')
            .then( userid => {
                return trx('users')
                        .insert({
                            name: name,
                            email: email,
                            userid: userid[0],
                            datejoined: new Date()
                        })
                        .returning('*')
            })
            .then( user => {
                //the promise return an array with just one element so we need to grab user[0] to access the user who just registered
                res.json(user[0])
            })
            .then(trx.commit)
            .catch(err => res.status(400).json('unable to register user'))
    })
    
})

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));