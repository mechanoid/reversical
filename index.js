/* global encodeURIComponent, URL, URLSearchParams */
import { format } from 'url'
import { join } from 'path'
import { compile } from 'path-to-regexp'
import camelCase from 'camelcase'

const hasOwn = Object.prototype.hasOwn ? Object.prototype.hasOwn : Object.prototype.hasOwnProperty

const supportedExpressMethods = [
  'checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge', 'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe'
]

const pathnameToRelativeUrl = (pathname, query = {}) => {
  const fakeHost = 'http://fakehost'
  const resultUrl = new URL(pathname, fakeHost)
  resultUrl.search = new URLSearchParams(query)
  return format(resultUrl, { auth: false, fragment: false }).slice(fakeHost.length)
}

class Route {
  constructor (path, { app } = {}) {
    this.path = path
    this.app = app
  }

  get routePath () {
    return this.app.mountpath ? join(this.app.mountpath, this.path) : this.path
  }

  render (params = {}, query = {}) {
    const toPath = compile(this.routePath, { encode: encodeURIComponent })
    const pathname = toPath(params)
    return pathnameToRelativeUrl(pathname, query)
  }
}

class RouteRegistry {
  constructor () {
    this.routes = {}
  }

  register (name, path, { app } = {}) {
    const route = new Route(path, { app })

    if (!this.routes[name] && !hasOwn.call(this, name)) {
      this.routes[name] = route
      this[camelCase(name)] = this.routes[name].render.bind(this.routes[name])
    } else if (this.routes[name].path !== path) {
      throw new Error(`NamedRouting: registered resource for "${name}" is already registered with different path (${this.routes[name].path} conflicts with ${path}).`)
    }
    // route is already registered, do nothing
  }
}

// initialize on first import
export let routes = new RouteRegistry()

export const reset = () => {
  routes = new RouteRegistry()
}

export class NamedRouter {
  constructor (app) {
    this.app = app
    this.mountpath = app.mountpath
  }

  route (name, path) {
    routes.register(name, path, { app: this.app })
    return this.app.route(path)
  }

  use (...args) {
    return this.app.use(...args)
  }
}

for (const method of supportedExpressMethods) {
  NamedRouter.prototype[method] = function (name, path, handler) {
    routes.register(name, path, { app: this.app })
    return this.app[method](path, handler)
  }
}
