const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const User = require('./models/usersModel');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const userRoutes = require('./routes/newuserRoutes');
const statsRoutes = require('./routes/statsRoutes');
const rescuerRoutes = require('./routes/rescuerRoutes');
const civilianRoutes = require('./routes/civilianRoutes');

const app = express();

mongoose.connect('mongodb://0.0.0.0:27017/web', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useCreateIndex: true,
})
    .then(() => console.log('Database Connected'))
    .catch((err) => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'mysecret', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 } // 1 hour
}));
app.use(cors());
app.use(express.json());


app.use(express.static('public'));
app.use(express.static('maptry'));
app.use(express.static('scripts'));

app.set('view engine', 'ejs');

// Import Routes
const categoryRoutes = require('./routes/categoryRoutes');
const itemRoutes = require('./routes/itemRoutes');

// Authentication 
const isLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

const isAdmin = async (req, res, next) => {
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

const isCivilian = async (req, res, next) => {
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'civilian') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

const isRescuer = async (req, res, next) => {
    const user = await User.findById(req.session.userId);
    if (user && user.role === 'rescuer') {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};

// Routes
app.use(authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
//app.use('/api/categories', categoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rescuer', rescuerRoutes);
app.use('/api/civilian', civilianRoutes);


// // Multer setup for JSON file upload
// const upload = multer({ dest: 'uploads/' });

// // Upload JSON for categories
// app.post('/api/upload/categories', upload.single('jsonFile'), (req, res) => {
//     const file = req.file;
//     const filePath = file.path;

//     fs.readFile(filePath, 'utf-8', async (err, data) => {
//         if (err) return res.status(500).json({ error: 'Error reading the file' });

//         try {
//             const categories = JSON.parse(data);
//             await Category.insertMany(categories);
//             res.json({ message: 'Categories uploaded successfully' });
//         } catch (error) {
//             res.status(500).json({ error: 'Error parsing or saving data' });
//         } finally {
//             fs.unlinkSync(filePath);
//         }
//     });
// });

// // Upload JSON for items
// app.post('/api/upload/items', upload.single('jsonFile'), (req, res) => {
//     const file = req.file;
//     const filePath = file.path;

//     fs.readFile(filePath, 'utf-8', async (err, data) => {
//         if (err) return res.status(500).json({ error: 'Error reading the file' });

//         try {
//             const items = JSON.parse(data);
//             await Item.insertMany(items);
//             res.json({ message: 'Items uploaded successfully' });
//         } catch (error) {
//             res.status(500).json({ error: 'Error parsing or saving data' });
//         } finally {
//             fs.unlinkSync(filePath);
//         }
//     });
// });

app.get('/test', (req, res) => {
    res.send('Basic route test is working!');
});

app.post('/test', (req, res) => {
    console.log('Request Body:', req.body);
    res.send('Test route received data');
});



app.get('/adminDashboard', isLoggedIn, isAdmin, (req, res) => res.send('adminDashboard'));
app.get('/civilianDashboard', isLoggedIn, isCivilian, (req, res) => res.send('civilianDashboard'));
app.get('/rescuerDashboard', isLoggedIn, isRescuer, async (req, res) => {
    try {
        const rescuer = await Rescuer.findById(req.session.userId).populate('cargo.item').populate('tasks.item');
        if (!rescuer) {
            return res.status(404).send('Rescuer not found');
        }

        res.render('rescuerDashboard', {
            username: rescuer.username,
            rescuer: rescuer, // Pass rescuer data to the view
            cargo: rescuer.cargo, // Rescuer's cargo
            tasks: rescuer.tasks // Rescuer's tasks
        });
    } catch (err) {
        console.error('Error rendering rescuer dashboard:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});

app.listen(3000, () => console.log('Server running on port 3000'));

