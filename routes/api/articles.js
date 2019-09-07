const express = require('express')
const auth = require('../auth')
const articlesController = require('../../controllers/articles')
const checkOwner = require('../../middlewares/checkOwner')

const articlesRouter = express.Router()

// Preload article object on routes with ':article'
articlesRouter.param('article', articlesController.preloadArticle)

// Preload comment object on routes with ':comment'
articlesRouter.param('comment', articlesController.preloadComment)

articlesRouter.route('/')
  .get(auth.optional, articlesController.getArticles)
  .post(auth.required, articlesController.createArticle)

articlesRouter.get('/feed', auth.required, articlesController.getFeeds)

articlesRouter.route('/:article')
  .get(auth.optional, articlesController.getArticle)
  .put(auth.required, checkOwner, articlesController.updateArticle)
  .delete(auth.required, checkOwner, articlesController.deleteArticle)

articlesRouter.route('/:article/favorite')
  .post(auth.required, articlesController.favoriteArticle)
  .delete(auth.required, articlesController.unfavoriteArticle)

articlesRouter.route('/:article/comments')
  .get(auth.optional, articlesController.getArticleComments)
  .post(auth.required, articlesController.createArticleComment)

articlesRouter.delete('/:article/comments/:comment', auth.required, articlesController.deleteArticleComment)

module.exports = articlesRouter
