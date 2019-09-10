const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { secret } = require('../config')

const UserSchema = new mongoose.Schema({
  username: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/^[a-zA-Z0-9]+$/, 'is invalid'], index: true },
  email: { type: String, lowercase: true, unique: true, required: [true, "can't be blank"], match: [/\S+@\S+\.\S+/, 'is invalid'], index: true },
  bio: String,
  image: String,
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin: { type: Boolean, default: false },
  hash: String
}, { timestamps: true })

UserSchema.plugin(uniqueValidator, { message: 'is already taken.' })

UserSchema.pre('save', function (next) {
  const user = this

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('hash')) return next()

  bcrypt.hash(user.hash, 10, function (err, hash) {
    if (err) return next(err)

    // override the cleartext password with the hashed one
    user.hash = hash
    next()
  })
})

UserSchema.methods.comparePassword = function (password, cb) {
  bcrypt.compare(password, this.hash, function (err, isMatch) {
    if (err) return cb(err)
    cb(null, isMatch)
  })
}

UserSchema.methods.generateJWT = function () {
  const today = new Date()
  const exp = new Date(today)
  exp.setDate(today.getDate() + 60)

  return jwt.sign({
    id: this._id,
    username: this.username,
    admin: this.admin,
    exp: parseInt(exp.getTime() / 1000)
  }, secret)
}

UserSchema.methods.toAuthJSON = function () {
  return {
    username: this.username,
    email: this.email,
    bio: this.bio,
    image: this.image,
    admin: this.admin,
    token: this.generateJWT()
  }
}

UserSchema.methods.toProfileJSONFor = function (user) {
  return {
    username: this.username,
    bio: this.bio,
    image: this.image || 'https://static.productionready.io/images/smiley-cyrus.jpg',
    admin: this.admin,
    following: user ? user.checkStatus(this._id, 'following') : false
  }
}

UserSchema.method({
  // The type can be favorites or following
  performAction: function (id, type) {
    if (this[type].indexOf(id) === -1) {
      this[type].push(id)
    }
    return this.save()
  },
  // Unfavorite an article or unfollow a user
  undoAction: function (id, type) {
    this[type].remove(id)
    return this.save()
  },
  // Check status of following or favorited
  checkStatus: function (id, type) {
    return this[type].some(function (favoriteId) {
      return favoriteId.toString() === id.toString()
    })
  }
})

mongoose.model('User', UserSchema)
