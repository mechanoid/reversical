import { test } from 'uvu'
import assert from 'assert/strict'
import express from 'express'
import { NamedRouter, routes } from '../index.js'

test('create named route via app.get', () => {
  const app = express()
  const namedRouter = new NamedRouter(app)

  namedRouter.get('simple-get-bound-route', '/simple-route', (req, res) => {})

  assert.equal(routes['simple-get-bound-route'](), '/simple-route')
})

test.run()
