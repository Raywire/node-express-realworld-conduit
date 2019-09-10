const mongoose = require('mongoose')
const Article = mongoose.model('Article')
const Comment = mongoose.model('Comment')
const User = mongoose.model('User')
const throw404Error = require('../utils/errorHandlers')

const preloadArticle = (req, res, next, slug) => {
  Article.findOne({ slug: slug })
    .populate('author', '-hash')
    .then((article) => {
      if (!article) {
        return next(throw404Error('Article'))
      }

      req.article = article

      return next()
    }).catch(next)
}

const preloadComment = (req, res, next, id) => {
  Comment.findById(id)
    .then((comment) => {
      if (!comment) {
        return next(throw404Error('Comment'))
      }

      req.comment = comment

      return next()
    }).catch(next)
}

const getArticles = (req, res, next) => {
  const query = {}
  const { limit, offset, page } = req.query

  if (typeof req.query.tag !== 'undefined') {
    query.tagList = { $in: [req.query.tag] }
  }

  Promise.all([
    req.query.author ? User.findOne({ username: req.query.author }) : null,
    req.query.favorited ? User.findOne({ username: req.query.favorited }) : null
  ]).then(function (results) {
    const [author, favoriter] = results

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
        .populate('author', '-hash')
        .exec(),
      Article.countDocuments(query).exec(),
      req.payload ? User.findById(req.payload.id) : null
    ]).then((results) => {
      const [articles, articlesCount, user] = results

      return res.json({
        articles: articles.map((article) => {
          return article.toJSONFor(user)
        }),
        articlesCount: articlesCount,
        page
      })
    })
  }).catch(next)
}

const getFeeds = (req, res, next) => {
  const { limit, offset, page } = req.query
  const { user } = req

  Promise.all([
    Article.find({ author: { $in: user.following } })
      .limit(Number(limit))
      .skip(Number(offset))
      .populate('author', '-hash')
      .exec(),
    Article.countDocuments({ author: { $in: user.following } })
  ]).then((results) => {
    const [articles, articlesCount] = results

    return res.json({
      articles: articles.map(function (article) {
        return article.toJSONFor(user)
      }),
      articlesCount,
      page
    })
  }).catch(next)
}

const createArticle = (req, res) => {
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
    req.article.populate('author', '-hash').execPopulate()
  ]).then(function (results) {
    const user = results[0]

    return res.json({ article: req.article.toJSONFor(user) })
  }).catch(next)
}

const updateArticle = (req, res, next) => {
  Object.keys(req.body.article).map((key) => {
    req.article[key] = req.body.article[key]
  })

  req.article.save().then(function (article) {
    return res.json({ article: article.toJSONFor(req.user) })
  }).catch(next)
}

const deleteArticle = (req, res) => {
  return req.article.deleteOne().then(function () {
    return res.sendStatus(204)
  })
}

const favoriteArticle = (req, res) => {
  const articleId = req.article._id
  const { user } = req
  return user.performAction(articleId, 'favorites').then(function () {
    return req.article.updateFavoriteCount().then(function (article) {
      return res.json({ article: article.toJSONFor(user) })
    })
  })
}

const unfavoriteArticle = (req, res) => {
  const articleId = req.article._id
  const { article, user } = req
  return user.undoAction(articleId, 'favorites').then(function () {
    return article.updateFavoriteCount().then(function (article) {
      return res.json({ article: article.toJSONFor(user) })
    })
  })
}

const getArticleComments = (req, res, next) => {
  Promise.resolve(req.payload ? User.findById(req.payload.id) : null).then(function (user) {
    return req.article.populate({
      path: 'comments',
      populate: {
        path: 'author',
        select: '-hash'
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

const createArticleComment = (req, res) => {
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

const deleteArticleComment = (req, res) => {
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
