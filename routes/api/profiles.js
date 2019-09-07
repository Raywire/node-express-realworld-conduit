const express = require('express')
const auth = require('../auth')
const profilesController = require('../../controllers/profiles')

const profileRouter = express.Router()

// Preload user objects on routes with ':username'
profileRouter.param('username', profilesController.preloadUser)

profileRouter.route('/:username')
  .get(auth.optional, profilesController.getUserProfile)

profileRouter.route('/:username/follow')
  .post(auth.required, profilesController.followUser)
  .delete(auth.required, profilesController.unfollowUser)

module.exports = profileRouter
