import { test } from 'uvu'
import assert from 'assert/strict'
import express from 'express'
import { NamedRouter, routes, reset } from '../index.js'

test.before.each(() => {
  reset()
})

test('create named route via app.get', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.get('simple-get-bound-route', '/simple-route', (req, res) => {})

  assert.equal(routes.simpleGetBoundRoute(), '/simple-route')
})

test('registration for the same name should be ok, when bound path is equal to already registered', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.get('simple-get-bound-route', '/simple-route', (req, res) => {})
  assert.doesNotThrow(() => {
    namedRouter.post('simple-get-bound-route', '/simple-route', (req, res) => {})
  })

  assert.equal(routes.simpleGetBoundRoute(), '/simple-route')
})

test('registration for the same name should fail, when bound path is not equal to already registered', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.get('simple-get-bound-route', '/simple-route', (req, res) => {})

  assert.throws(() => {
    namedRouter.post('simple-get-bound-route', '/different-route', (req, res) => {})
  })
})

test('register multiple handlers via route chaining', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.route('chained-route', '/chained-routes')
    .get((req, res) => {})
    .post((req, res) => {})

  assert.equal(routes.chainedRoute(), '/chained-routes')
})

test('register route with path params', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.route('route-with-params', '/routes/:id')
    .get((req, res) => {})

  assert.equal(routes.routeWithParams({ id: 12 }), '/routes/12')
})

test('register route with query/search params', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.route('route-with-params', '/routes/:id')
    .get((req, res) => {})

  assert.equal(routes.routeWithParams({ id: 12 }, { s: 'term' }), '/routes/12?s=term')
})

test.run()
