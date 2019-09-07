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

const getUserProfile = (req, res, next) => {
  if (req.payload) {
    User.findById(req.payload.id).then(function (user) {
      if (!user) { return res.json({ profile: req.profile.toProfileJSONFor(false) }) }

      return res.json({ profile: req.profile.toProfileJSONFor(user) })
    })
  } else {
    return res.json({ profile: req.profile.toProfileJSONFor(false) })
  }
}

const followUser = (req, res, next) => {
  const profileId = req.profile._id

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401) }

    return user.follow(profileId).then(function () {
      return res.json({ profile: req.profile.toProfileJSONFor(user) })
    })
  }).catch(next)
}

const unfollowUser = (req, res, next) => {
  const profileId = req.profile._id

  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401) }

    return user.unfollow(profileId).then(function () {
      return res.json({ profile: req.profile.toProfileJSONFor(user) })
    })
  }).catch(next)
}

module.exports = {
  preloadUser,
  getUserProfile,
  followUser,
  unfollowUser
}
