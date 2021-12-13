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

test.run()
