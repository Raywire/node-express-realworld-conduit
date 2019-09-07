const mongoose = require('mongoose')
const User = mongoose.model('User')

const getCurrentUser = (req, res, next) => {
  User.findById(req.payload.id).then(function (user) {
    if (!user) {
      return res.sendStatus(401)
    }
    req.user = user
    next()
  }).catch(next)
}

module.exports = getCurrentUser
