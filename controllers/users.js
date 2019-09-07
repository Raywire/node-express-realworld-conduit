const mongoose = require('mongoose')
const passport = require('passport')
const User = mongoose.model('User')

const getCurrentUser = (req, res, next) => {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401) }

    return res.json({ user: user.toAuthJSON() })
  }).catch(next)
}

const updateUser = (req, res, next) => {
  User.findById(req.payload.id).then(function (user) {
    if (!user) { return res.sendStatus(401) }

    // only update fields that were actually passed...
    if (typeof req.body.user.username !== 'undefined') {
      user.username = req.body.user.username
    }
    if (typeof req.body.user.email !== 'undefined') {
      user.email = req.body.user.email
    }
    if (typeof req.body.user.bio !== 'undefined') {
      user.bio = req.body.user.bio
    }
    if (typeof req.body.user.image !== 'undefined') {
      user.image = req.body.user.image
    }
    if (typeof req.body.user.password !== 'undefined') {
      user.setPassword(req.body.user.password)
    }

    return user.save().then(function () {
      return res.json({ user: user.toAuthJSON() })
    })
  }).catch(next)
}

const login = (req, res, next) => {
  if (!req.body.user.email) {
    return res.status(422).json({ errors: { email: "can't be blank" } })
  }

  if (!req.body.user.password) {
    return res.status(422).json({ errors: { password: "can't be blank" } })
  }

  passport.authenticate('local', { session: false }, function (err, user, info) {
    if (err) { return next(err) }

    if (user) {
      user.token = user.generateJWT()
      return res.json({ user: user.toAuthJSON() })
    } else {
      return res.status(422).json(info)
    }
  })(req, res, next)
}

const signup = (req, res, next) => {
  const user = new User()

  user.username = req.body.user.username
  user.email = req.body.user.email
  user.setPassword(req.body.user.password)

  user.save().then(function () {
    return res.json({ user: user.toAuthJSON() })
  }).catch(next)
}

const deleteUser = (req, res, next) => {
  if (req.payload.admin === true || req.user.username === req.payload.username) {
    return req.user.deleteOne().then(function () {
      return res.sendStatus(204)
    })
  } else {
    const err = new Error('Only an admin can delete another user')
    err.status = 403
    err.name = 'Forbidden'
    next(err)
  }
}

const preloadUser = (req, res, next, username) => {
  User.findOne({ username: username })
    .then(function (user) {
      if (!user) {
        const err = new Error('User not found')
        err.status = 404
        err.name = 'Not Found'
        next(err)
      }
      req.user = user
      return next()
    }).catch(next)
}

module.exports = {
  getCurrentUser,
  updateUser,
  login,
  signup,
  deleteUser,
  preloadUser
}
