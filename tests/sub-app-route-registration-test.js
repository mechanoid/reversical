import { test } from 'uvu'
import assert from 'assert/strict'
import express from 'express'
import { NamedRouter, routes, reset } from '../index.js'

test.before.each(() => {
  console.log('resetting routes')
  reset()
})

test('register routes for path mounted sub-app', () => {
  const app = express()
  const subApp = express()
  const namedAppRouter = new NamedRouter(app)
  const namedSubAppRouter = new NamedRouter(subApp)

  namedSubAppRouter.get('records', '/records', (req, res) => { })

  namedAppRouter.use('/not-named-sub-app-mount', subApp)

  assert.equal(routes.records(), '/not-named-sub-app-mount/records')
})

test('register routes for plain mounted sub-app', () => {
  const app = express()
  const subApp = express()
  const namedAppRouter = new NamedRouter(app)
  const namedSubAppRouter = new NamedRouter(subApp)

  namedSubAppRouter.get('records', '/records', (req, res) => { })

  namedAppRouter.use(subApp) // mounting plain to the main app

  assert.equal(routes.records(), '/records')
})

test('register routes for "named" path mounted sub-app', () => {
  const app = express()
  const namedAppRouter = new NamedRouter(app)

  const subAppWithNamedRouter = bindRouter => {
    const subApp = express()
    const namedRouter = bindRouter(subApp)

    namedRouter.get('records', '/records', (req, res) => {})

    return subApp
  }

  namedAppRouter.use('admin', '/admin', subAppWithNamedRouter) // mounting plain to the main app

  assert.equal(routes.admin.records(), '/admin/records')
})

test('register routes for path mounted router', () => {
  const app = express()
  const router = express.Router()
  const namedAppRouter = new NamedRouter(app)
  const namedSubAppRouter = new NamedRouter(router)

  namedSubAppRouter.get('records', '/records', (req, res) => { })

  namedAppRouter.use('/not-named-sub-app-mount', router)

  assert.equal(routes.records(), '/not-named-sub-app-mount/records')
})

test.run()
