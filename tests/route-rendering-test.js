import { test } from 'uvu'
import assert from 'assert/strict'
import express from 'express'
import { NamedRouter, routes, reset } from '../index.js'

test.before.each(() => {
  reset()
})

test('render route with different signature callings', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.get('simple-get-bound-route', '/simple-route', (req, res) => {})
  namedRouter.get('get-bound-route-with-id', '/simple-route/:id', (req, res) => {})

  assert.equal(routes.simpleGetBoundRoute(), '/simple-route')
  assert.equal(routes.simpleGetBoundRoute(null), '/simple-route')
  assert.equal(routes.simpleGetBoundRoute(null, null), '/simple-route')
  assert.equal(routes.simpleGetBoundRoute(null, { q: 1 }), '/simple-route?q=1')
  assert.equal(routes.simpleGetBoundRoute(null, null, { host: 'http://fubar.de' }), 'http://fubar.de/simple-route')
  assert.equal(routes.getBoundRouteWithId({ id: 5 }), '/simple-route/5')
  assert.equal(routes.getBoundRouteWithId({ id: 5 }, { q: 1 }), '/simple-route/5?q=1')
  assert.equal(routes.getBoundRouteWithId({ id: 5 }, null, { host: 'http://fubar.de' }), 'http://fubar.de/simple-route/5')
})

test.run()
