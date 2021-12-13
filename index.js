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
  constructor (path, { app, mountpath } = {}) {
    this.path = path
    this.app = app
    this.subModuleMountPath = mountpath
  }

  get routePath () {
    return this.mountpath ? join(this.mountpath, this.path) : this.path
  }

  get mountpath () {
    return this.app.mountpath || this.app.reversicalMountpath || this.subModuleMountPath
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

  register (name, path, { app, mountpath } = {}) {
    const route = new Route(path, { app, mountpath })

    if (!this.routes[name] && !hasOwn.call(this, name)) {
      this.routes[name] = route
      this[camelCase(name)] = this.routes[name].render.bind(this.routes[name])
    } else if (this.routes[name].path !== path) {
      throw new Error(`NamedRouting: registered resource for "${name}" is already registered with different path (${this.routes[name].path} conflicts with ${path}).`)
    }
    // route is already registered, do nothing
  }

  addSubmodule (name, registry) {
    if (!this.routes[name] && !hasOwn.call(this, name)) {
      this.routes[name] = name
      this[camelCase(name)] = registry
    }
  }
}

// initialize on first import
export let routes = new RouteRegistry()

export const reset = () => {
  routes = new RouteRegistry()
}

export class NamedRouter {
  constructor (app, { mountpath = null, routeRegistry = routes } = {}) {
    this.app = app
    this.mountpath = mountpath
    this.routes = routeRegistry
  }

  route (name, path) {
    this.routes.register(name, path, { app: this.app, mountpath: this.mountpath })
    return this.app.route(path)
  }

  use (...args) {
    if (args.length === 3) {
      const [subModuleName, mountpath, appWithNamedRouterContext] = args

      const registry = new RouteRegistry()
      this.routes.addSubmodule(subModuleName, registry)

      const bindRouter = app => {
        extendRouterWithMountpath(app, mountpath)
        return new NamedRouter(app, { mountpath, routeRegistry: registry })
      }
      return this.app.use(mountpath, appWithNamedRouterContext(bindRouter))
    } else if (args.length === 2) {
      const [mountpath, appOrRouter] = args
      extendRouterWithMountpath(appOrRouter, mountpath)
      return this.app.use(mountpath, appOrRouter)
    }

    return this.app.use(...args)
  }
}

for (const method of supportedExpressMethods) {
  NamedRouter.prototype[method] = function (name, path, handler) {
    this.routes.register(name, path, { app: this.app })
    return this.app[method](path, handler)
  }
}

function extendRouterWithMountpath (router, mountpath) {
  if (router && !router.mountpath) {
    router.reversicalMountpath = mountpath
  }
}
