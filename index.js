/* global encodeURIComponent, URL, URLSearchParams */
import { format } from 'url'
import { join } from 'path'
import { compile } from 'path-to-regexp'
import camelCase from 'camelcase'

const hasOwn = Object.prototype.hasOwn ? Object.prototype.hasOwn : Object.prototype.hasOwnProperty

const supportedExpressMethods = [
  'checkout', 'copy', 'delete', 'get', 'head', 'lock', 'merge', 'mkactivity', 'mkcol', 'move', 'm-search', 'notify', 'options', 'patch', 'post', 'purge', 'put', 'report', 'search', 'subscribe', 'trace', 'unlock', 'unsubscribe'
]

// If no host is provided a relative URL is created, otherwise the host is used
const pathnameToUrl = (pathname, query = {}, { host = null } = {}) => {
  const fakeHost = 'http://fakehost'
  const resultUrl = new URL(pathname, host || fakeHost)
  resultUrl.search = new URLSearchParams(query)
  const cleansedUrl = format(resultUrl, { auth: false, fragment: false })
  return host ? cleansedUrl : cleansedUrl.slice(fakeHost.length)
}

class Route {
  constructor (path, { app, mountpath, registry } = {}) {
    this.path = path
    this.app = app
    this.subModuleMountPath = mountpath
    this.registry = registry
  }

  get mountpath () {
    return this.app.mountpath || this.app.reversicalMountpath || this.subModuleMountPath
  }

  get routePath () {
    const chainedMountPath = this.registry.chainedRoutePath(this.mountpath)
    return join(chainedMountPath, this.path)
  }

  render (params = {}, query = {}, { host = null } = {}) {
    try {
      const toPath = compile(this.routePath, { encode: encodeURIComponent })
      const pathname = toPath(params || {})
      return pathnameToUrl(pathname, query || {}, { host })
    } catch (e) {
      if (e instanceof TypeError) {
        console.log(`failed to expand "${this.routePath}" with params "${JSON.stringify(params)}"`, e.stack)
        return
      }
      throw e
    }
  }
}

class RouteRegistry {
  constructor ({ parentRegistry, mountpath } = {}) {
    this.routes = {}
    this.parentRegistry = parentRegistry
    this.mountpath = mountpath
  }

  register (name, path, { app, mountpath } = {}) {
    const route = new Route(path, { app, mountpath, registry: this })

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

  chainedRoutePath (routeMountpath) {
    const parentRegistries = []
    const maxDepths = 10
    let i = 0
    let parentRouteRegistry = this.parentRegistry

    while (parentRouteRegistry) {
      if (i >= maxDepths) { break } else { i++ }

      parentRegistries.unshift(parentRouteRegistry)
      parentRouteRegistry = parentRouteRegistry.parentRegistry
    }

    const paths = []
      .concat(parentRegistries.map(r => r.mountpath))
      .filter(x => !!x)

    paths.push(routeMountpath)

    return paths.length > 0 ? join(...paths) : ''
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

  all (name, path, handler) {
    this.routes.register(name, path, { app: this.app, mountpath: this.mountpath })
    return this.app.all(path, handler)
  }

  use (...args) {
    if (args.length === 3) { // named router
      const [subModuleName, mountpath, appWithNamedRouterContext] = args

      const registry = new RouteRegistry({ parentRegistry: this.routes, mountpath })
      this.routes.addSubmodule(subModuleName, registry)

      const bindRouter = app => {
        extendRouterWithMountpath(app, mountpath)
        return new NamedRouter(app, { mountpath, routeRegistry: registry })
      }
      return this.app.use(mountpath, appWithNamedRouterContext(bindRouter))
    } else if (args.length === 2) { // not named router
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
