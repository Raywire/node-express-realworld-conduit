const express = require('express')
const auth = require('../auth')
const profilesController = require('../../controllers/profiles')
const getCurrentUser = require('../../middlewares/getCurrentUser')

const profileRouter = express.Router()

// Preload user objects on routes with ':username'
profileRouter.param('username', profilesController.preloadUser)

profileRouter.route('/:username')
  .get(auth.optional, profilesController.getUserProfile)

profileRouter.route('/:username/follow')
  .post(auth.required, getCurrentUser, profilesController.followUser)
  .delete(auth.required, getCurrentUser, profilesController.unfollowUser)

module.exports = profileRouter
