import { test } from 'uvu'
import assert from 'assert/strict'
import express from 'express'
import { NamedRouter, routes, reset } from '../index.js'

test.before.each(() => {
  reset()
})

test('render routes with host', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.get('simple-get-bound-route', '/simple-route', (req, res) => {})

  assert.equal(routes.simpleGetBoundRoute({}, {}, {}), '/simple-route')
  assert.equal(routes.simpleGetBoundRoute({}, {}, { host: 'https://fubar.de' }), 'https://fubar.de/simple-route')
})

test.run()
