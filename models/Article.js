const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const slug = require('slug')
const uuidv1 = require('uuid/v1')
const User = mongoose.model('User')

const ArticleSchema = new mongoose.Schema({
  slug: { type: String, lowercase: true, unique: true },
  title: String,
  description: String,
  body: String,
  favoritesCount: { type: Number, default: 0 },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tagList: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true })

ArticleSchema.plugin(uniqueValidator, { message: 'is already taken' })

ArticleSchema.pre('validate', function (next) {
  if (!this.slug) {
    this.slugify()
  }
  next()
})

ArticleSchema.methods.slugify = function () {
  this.slug = `${slug(this.title)}-${uuidv1()}`
}

ArticleSchema.methods.updateFavoriteCount = function () {
  const article = this

  return User.count({ favorites: { $in: [article._id] } }).then(function (count) {
    article.favoritesCount = count

    return article.save()
  })
}

ArticleSchema.methods.toJSONFor = function (user) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.checkStatus(this._id, 'favorites') : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  }
}

mongoose.model('Article', ArticleSchema)
