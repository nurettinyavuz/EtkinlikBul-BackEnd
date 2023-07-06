const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const pageRoute = require('./routes/pageRoute');
const userRoute = require('./routes/userRoute');

const app = express();

require('dotenv').config();

// .env dosyasındaki MONGO_URL değerini alıyoruz
const mongoURL = process.env.MONGO_URL;

mongoose
  .connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connected Successfully");

    //Middlewares
    app.use(cors());
    app.use(express.static('public'));
    app.use(bodyParser.json()); // for parsing application/json
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
    app.use(
      session({
        secret: 'my_keyboard_cat',
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({ mongoUrl: mongoURL }),
      })
    );

    //ROUTES
    app.use('*', (req, res, next) => {
      //Yıldız koymamızın nedeni hangi istek gelirse gelsin bozulmaması için * kullandık
      userIN = req.session.userID;
      next(); //next yazmamızın nedeni diğer middleware'a gitmesi için
    });
    app.use('/', pageRoute);
    app.use('/users', userRoute);

    const port = 5000;
    app.listen(port, () => {
      console.log(`Sunucu ${port} portunda başlatıldı...`);
    });
  })
  .catch((error) => {
    console.log("DB Connection Error: ", error);
  });
