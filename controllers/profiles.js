const mongoose = require('mongoose')
const User = mongoose.model('User')

const preloadUser = (req, res, next, username) => {
  User.findOne({ username: username }).then(function (user) {
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User Not Found'
      })
    }

    req.profile = user

    return next()
  }).catch(next)
}

const getUserProfile = (req, res) => {
  if (req.payload) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) { return res.json({ profile: req.profile.toProfileJSONFor(false) }) }

      return res.json({ profile: req.profile.toProfileJSONFor(user) })
    })
  } else {
    return res.json({ profile: req.profile.toProfileJSONFor(false) })
  }
}

const followUser = (req, res) => {
  const profileId = req.profile._id
  const { profile } = req

  return req.user.performAction(profileId, 'following').then(function () {
    return res.json({
      profile: profile.toProfileJSONFor(req.user)
    })
  })
}

const unfollowUser = (req, res) => {
  const profileId = req.profile._id
  const { user } = req

  return user.undoAction(profileId, 'following').then(function () {
    return res.json({ profile: req.profile.toProfileJSONFor(user) })
  })
}

module.exports = {
  preloadUser,
  getUserProfile,
  followUser,
  unfollowUser
}
