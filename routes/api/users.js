const express = require('express')
const auth = require('../auth')
const usersController = require('../../controllers/users')
const getCurrentUser = require('../../middlewares/getCurrentUser')

const userRouter = express.Router()

// Preload user object on routes with ':user'
userRouter.param('user', usersController.preloadUser)

userRouter.route('/user')
  .get(auth.required, getCurrentUser, usersController.getCurrentUser)
  .put(auth.required, getCurrentUser, usersController.updateUser)

userRouter.post('/users/login', usersController.login)

userRouter.post('/users', usersController.signup)

userRouter.delete('/user/:user', auth.required, usersController.deleteUser)

module.exports = userRouter
