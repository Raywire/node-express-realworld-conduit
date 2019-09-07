const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const User = mongoose.model('User')

passport.use(new LocalStrategy({
  usernameField: 'user[email]',
  passwordField: 'user[password]'
}, function (email, password, done) {
  User.findOne({ email: email }).then(function (user) {
    if (!user) {
      return done(null, false, { errors: { email: 'is invalid' } })
    }
    user.comparePassword(password, function (err, isMatch) {
      if (err) throw err
      if (isMatch) {
        return done(null, user)
      }
      return done(null, false, { errors: { password: 'is invalid' } })
    })
  }).catch(done)
}))
