const express = require('express');
const bodyParser = require('body-parser');
const cookieSession =  require('cookie-session');
const usersRepo =  require('./repositories/users');
const users = require('./repositories/users');

const app = express();

app.use(bodyParser.urlencoded({ extended : true}));
app.use(cookieSession({
    keys: ['bdf43yeklny280gi7o']
}));

app.get('/signup', (req,res) => {
    res.send(`
    <div>
        Your id is :${req.session.userId}
        <form method="POST">
            <input name="email" placeholder="email" />
            <input name="password" placeholder="password" />
            <input name="passwordConfirmation" placeholder="password confirmation" />
            <button>Sign Up</button>
        </form>
    </div>
    `);
});

/*const bodyParser = (req,res, next) => {
    if (req.method === "POST"){
        req.on('data', data => {
            const parsed = data.toString('utf8').split('&');
            const formData = {};
            for (let pair of parsed){
                const [key, value] = pair.split('=');
                formData[key] = value;
            }
            req.body = formData;
            next();
        });
    }
    else{
        next();
    }
}
*/
app.post('/signup', async (req,res) =>{
    const { email, password, passwordConfirmation } = req.body;

    const existingUser = await usersRepo.getOneBy({email});
    
    if(existingUser){
        res.send('Email already in use!');
    }
    if(password !== passwordConfirmation){
        res.send('Passwords do not match!');
    }


    //create a user
    const user = await usersRepo.create({email, password});

    //store id of user in cookie
    req.session.userId = user.id; //added by cookie-session

    res.send('Account Created!!')
});

app.get('/signout', (req, res) => {
    req.session = null;
    res.send('You are logged out!')
});

app.get('/signin', (req,res) => {
    res.send(`
    <div>
        <form method="POST">
            <input name="email" placeholder="email" />
            <input name="password" placeholder="password" />
            <button>Sign In</button>
        </form>
    </div>
    `)
});

app.post('/signin', async (req,res) => {
    const {email, password} = req.body;
    const user = await usersRepo.getOneBy({email});
    if(!user){
        return res.send('Invalid login credentials!');
    }

    /*if(user.password !== password){
        return res.send('Invalid login credentials!');
    }*/

    const validPassword = await usersRepo.comparePassword(
        user.password,
        password
    );

    if(!validPassword){
        return res.send('Invalid login credentials!');
    }

    req.session.userId = user.id;
    
    res.send('You are signed in!');
});

app.listen(3000, () => {
    console.log('LISTENING!!!');
});