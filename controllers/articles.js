const mongoose = require('mongoose')
const Article = mongoose.model('Article')
const Comment = mongoose.model('Comment')
const User = mongoose.model('User')

const preloadArticle = (req, res, next, slug) => {
  Article.findOne({ slug: slug })
    .populate('author', '-hash')
    .then(function (article) {
      if (!article) {
        const err = new Error('Article not found')
        err.status = 404
        err.name = 'Not Found'
        next(err)
      }

      req.article = article

      return next()
    }).catch(next)
}

const preloadComment = (req, res, next, id) => {
  Comment.findById(id).then(function (comment) {
    if (!comment) {
      const err = new Error('Comment not found')
      err.status = 404
      err.name = 'Not Found'
      next(err)
    }

    req.comment = comment

    return next()
  }).catch(next)
}

const getArticles = (req, res, next) => {
  const query = {}
  let limit = 20
  let offset = 0

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset
  }

  if (typeof req.query.tag !== 'undefined') {
    query.tagList = { $in: [req.query.tag] }
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
  ]).then(function (results) {
    const author = results[0]
    const favoriter = results[1]

    if (author) {
      query.author = author._id
    }

    if (favoriter) {
      query._id = { $in: favoriter.favorites }
    } else if (req.query.favorited) {
      query._id = { $in: [] }
    }

    return Promise.all([
      Article.find(query)
        .limit(Number(limit))
        .skip(Number(offset))
        .sort({ createdAt: 'desc' })
        .populate('author')
        .exec(),
      Article.countDocuments(query).exec(),
      req.payload ? User.findById(req.payload.id) : null
    ]).then(function (results) {
      const articles = results[0]
      const articlesCount = results[1]
      const user = results[2]

      return res.json({
        articles: articles.map(function (article) {
          return article.toJSONFor(user)
        }),
        articlesCount: articlesCount
      })
    })
  }).catch(next)
}

const getFeeds = (req, res, next) => {
  let limit = 20
  let offset = 0
  const { user } = req

  if (typeof req.query.limit !== 'undefined') {
    limit = req.query.limit
  }

  if (typeof req.query.offset !== 'undefined') {
    offset = req.query.offset
  }

  Promise.all([
    Article.find({ author: { $in: user.following } })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('author')
      .exec(),
    Article.countDocuments({ author: { $in: user.following } })
  ]).then(function (results) {
    const articles = results[0]
    const articlesCount = results[1]

    return res.json({
      articles: articles.map(function (article) {
        return article.toJSONFor(user)
      }),
      articlesCount: articlesCount
    })
  }).catch(next)
}

const createArticle = (req, res, next) => {
  const { user } = req
  const article = new Article(req.body.article)

  article.author = user

  return article.save().then(function () {
    return res.json({ article: article.toJSONFor(user) })
  })
}

const getArticle = (req, res, next) => {
  Promise.all([
    req.payload ? User.findById(req.payload.id) : null,
    req.article.populate('author').execPopulate()
  ]).then(function (results) {
    const user = results[0]

    return res.json({ article: req.article.toJSONFor(user) })
  }).catch(next)
}

const updateArticle = (req, res, next) => {
  if (typeof req.body.article.title !== 'undefined') {
    req.article.title = req.body.article.title
  }

  if (typeof req.body.article.description !== 'undefined') {
    req.article.description = req.body.article.description
  }

  if (typeof req.body.article.body !== 'undefined') {
    req.article.body = req.body.article.body
  }

  if (typeof req.body.article.tagList !== 'undefined') {
    req.article.tagList = req.body.article.tagList
  }

  req.article.save().then(function (article) {
    return res.json({ article: article.toJSONFor(req.user) })
  }).catch(next)
}

const deleteArticle = (req, res, next) => {
  return req.article.deleteOne().then(function () {
    return res.sendStatus(204)
  })
}

const favoriteArticle = (req, res, next) => {
  const articleId = req.article._id
  const { user } = req
  return user.favorite(articleId).then(function () {
    return req.article.updateFavoriteCount().then(function (article) {
      return res.json({ article: article.toJSONFor(user) })
    })
  })
}

const unfavoriteArticle = (req, res, next) => {
  const articleId = req.article._id
  const { user } = req
  return user.unfavorite(articleId).then(function () {
    return req.article.updateFavoriteCount().then(function (article) {
      return res.json({ article: article.toJSONFor(user) })
    })
  })
}

const getArticleComments = (req, res, next) => {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function (user) {
    return req.article.populate({
      path: 'comments',
      populate: {
        path: 'author'
      },
      options: {
        sort: {
          createdAt: 'desc'
        }
      }
    }).execPopulate().then(function (article) {
      return res.json({
        comments: req.article.comments.map(function (comment) {
          return comment.toJSONFor(user)
        })
      })
    })
  }).catch(next)
}

const createArticleComment = (req, res, next) => {
  const { user } = req
  const comment = new Comment(req.body.comment)
  comment.article = req.article
  comment.author = user

  return comment.save().then(function () {
    req.article.comments.push(comment)

    return req.article.save().then(function (article) {
      res.json({ comment: comment.toJSONFor(user) })
    })
  })
}

const deleteArticleComment = (req, res, next) => {
  if (req.comment.author.toString() === req.payload.id.toString()) {
    req.article.comments.remove(req.comment._id)
    req.article.save()
      .then(Comment.find({ _id: req.comment._id }).deleteOne().exec())
      .then(function () {
        res.sendStatus(204)
      })
  } else {
    res.sendStatus(403)
  }
}

module.exports = {
  preloadArticle,
  preloadComment,
  getArticles,
  getFeeds,
  createArticle,
  getArticle,
  updateArticle,
  deleteArticle,
  favoriteArticle,
  unfavoriteArticle,
  getArticleComments,
  createArticleComment,
  deleteArticleComment
}
