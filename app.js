require('dotenv').config();
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const app = express();
const { PORT = 3001, DATABASE = 'mongodb://127.0.0.1/moviesdb' } = process.env;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

mongoose.connect(DATABASE);

app.use(requestLogger);
app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(helmet());

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Сервер сейчас упадёт');
  }, 0);
});
app.use(require('./routes/index'));

app.use(errorLogger);

app.use(errors());

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).send({ message: statusCode === 500 ? 'Server Error' : message });
  next();
});

app.listen(PORT);
