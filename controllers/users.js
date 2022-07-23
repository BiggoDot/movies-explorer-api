const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadRequestError = require('../errors/BadRequest');
const NotFoundError = require('../errors/NotFound');
const ConflictError = require('../errors/Conflict');
const UnauthorizedError = require('../errors/Unauthorized');

const { NODE_ENV, JWT_SECRET } = process.env;

module.exports.findUserMe = (req, res, next) => {
  User.findById(req.user._id)
    .then((users) => {
      res.send(users);
    })
    .catch((err) => {
      next(err);
    });
};

module.exports.createUsers = (req, res, next) => {
  const {
    email,
    name,
  } = req.body;
  bcrypt.hash(req.body.password, 10)
    .then((hash) => {
      User.create({
        email,
        name,
        password: hash,
      })
        .then(() => res.status(201).send({
          email,
          name,
        }))
        .catch((err) => {
          if (err.name === 'ValidationError') {
            next(new BadRequestError('Data is incorrect'));
            return;
          }
          if (err.code === 11000) {
            next(new ConflictError('User with this email already exists'));
            return;
          }
          next(err);
        });
    })
    .catch(next);
};

module.exports.updateUserInfo = (req, res, next) => {
  const { email, name } = req.body;
  User.findByIdAndUpdate(req.user._id, { email, name }, {
    new: true,
    runValidators: true,
    upsert: false,
  })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('User is not found');
      }
      res.send(user);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Data is incorrect'));
        return;
      }
      if (err.code === 11000) {
        next(new ConflictError('User with this email already exists'));
        return;
      }
      next(err);
    });
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;
  User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
      res.send({ token });
    })
    .catch((err) => {
      if (err.name === 'Error') {
        next(new UnauthorizedError('Email or password are incorrect'));
      } else {
        next(err);
      }
    });
};
