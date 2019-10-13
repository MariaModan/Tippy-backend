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
        password : 'aA123adata',
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
    
    db.select(['hash','userid']).from('login').where('email', '=', email)
        .then(data => {
            const hash = data[0].hash;
            const userid = data[0].userid;
            if (bcrypt.compareSync(password, hash)){
                db.select('*').from('users').where('userid', '=', userid)
                    .then( user => res.json(user[0]))
                    .catch( err => res.json('error getting user data'))
            }else {
                res.json('invalid credentials')
            }
        })
        .catch(err => res.status(400).json('error logging in'))  
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

app.post('/addproject', (req,res) => {
    const { projectTitle, userid } = req.body;

    db('projects')
        .insert({
            project_title: projectTitle,
            userid: userid
        })
        .returning('projectid')
        .then(projectid => res.json(projectid[0]))
})

app.post('/listprojects', (req,res) => {
    const { userid } = req.body;

    db.select('project_title', 'projectid').from('projects').where('userid', '=', userid)
    .then(projects => res.json(projects))
    .catch(err => res.status(400).json('error retrieving the project list'))
})

app.delete('/delproject', (req,res) => {
    const { projectid } = req.body;

    db('projects')
        .where('projectid' , '=', projectid)
        .del()
        .returning('*')
        .then( project => res.json('project deleted'))
        .catch( err => res.json(err))
})

app.post('/addtodo', (req,res) => {
    const { projectid, userid, task_title } = req.body;

    db('todo_tasks')
        .insert({
            projectid: projectid,
            userid: userid,
            task_title: task_title
        })
        .returning('task_title')
        .then(newTask=> res.json('added new task'))
        .catch(err => res.status(400).json('error deleting project'))
})

app.post('/listtodo', (req,res) => {
    const { projectid } = req.body;

    db.select('task_title', 'taskid').from('todo_tasks').where('projectid', '=', projectid)
    .then(todos => res.json(todos))
    .catch(err => res.status(400).json('error getting the todo list'))
})

app.post('/addInProgress', (req,res) => {
    const { projectid, taskid, userid, task_title} = req.body;

    db.transaction( trx => {
        trx('inprogress_tasks')
        .insert({
            projectid: projectid,
            userid: userid,
            taskid: taskid,
            task_title: task_title
        })
        .returning('taskid')
        .then(taskid => {
            return trx('todo_tasks')
                    .where('taskid', '=', taskid[0])
                    .del()
                    .returning('*')
        })
        .then(movedTask=> res.json('moved task to inProgress'))
        .then(trx.commit)
        .catch(trx.rollback)
    })
    
})

app.post('/listinprogress', (req,res) => {
    const { projectid } = req.body;

    db.select('task_title', 'taskid').from('inprogress_tasks').where('projectid', '=', projectid)
    .then(inprogress => res.json(inprogress))
    .catch(err => res.status(400).json('error getting the in progress list'))
})

app.post('/addFinished', (req,res) => {
    const { projectid, taskid, userid, task_title} = req.body;
    
    db.transaction( trx => {
        trx('finished_tasks')
        .insert({
            projectid: projectid,
            userid: userid,
            taskid: taskid,
            task_title: task_title
        })
        .returning('taskid')
        .then(taskid => {
            return trx('inprogress_tasks')
                    .where('taskid', '=', taskid[0])
                    .del()
                    .returning('*')
        })
        .then(movedTask=> res.json('moved task to finished'))
        .then(trx.commit)
        .catch(trx.rollback)
    })
    
})

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`App is running on port ${PORT}`));