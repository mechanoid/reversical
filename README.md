# reversical

> something that is utterly ridiculous and amazingly pointless. Root word: reverse.
— on [Urban Dictionary](https://www.urbandictionary.com/define.php?term=reversical) by [Griffin Williams](https://www.urbandictionary.com/author.php?author=Griffin%20Williams) (whoever that is)

but also a minimal named router for expressjs.

## Installation

```
npm install reversical
```

## Usage

Wrap your app in a NamedRouter to register new named routes:

```
import express from 'express'
import { NamedRouter, routes } from 'namename'

const app = express()
const namedRouter = new NamedRouter(app)

// register a named route
namedRouter.get('people', '/people', (req, res) => { ... })
namedRouter.post('people', '/people', (req, res) => { ... }) # second registration checks, that the same path is registered

// route chaining also works
namedRouter
  .route('person', '/people/:id')
  .get((req, res) => { ....})
  .put((req, res) => { ....})


// use `routes` for reverse routing.
// A route is generate for each provided name with arguments (params = {}, query = {})
routes.people({}, { search: 'search-term' }) // => /people?search=search-term
routes.person({ id: 12 }) // => /people/12
```

### provide routes object to your view-Stack

```
app.locals = routes
```

### Sub Apps

When mounting a sub-app to an existing express app, we receive the mountpath in the handler.
This allows for named routes and reverse routing in sub apps as well.

NOTE: Please have in mind that a `express.Router()` instance does not have access to the mountpath,
as it is just a router in the same app instance. So please create sub-apps like shown below.

sub-app.js
```
import express from 'express'
const subApp = express()

const namedRouter = new NamedRouter(subApp)

namedRouter.route('dashboard', '/dashboard')
  .get((req,res) => { ... })

export default subApp
```

app.js
```
import express from 'express'
import subApp from './sub-app.js'
const app = express()

const namedRouter = new NamedRouter(app)

namedRouter.use('/admin', subApp)

routes.dashboard() // => /admin/dashboard
```

### Named Sub Module Binding

sub-app.js
```
import express from 'express'

const subAppWithNamedRouter = bindRouter => {
  const subApp = express()
  const namedRouter = bindRouter(subApp)

  namedRouter.route('dashboard', '/dashboard')
    .get((req,res) => { ... })

}


export default subAppWithNamedRouter
```

app.js
```
import express from 'express'
import subApp from './sub-app.js'
const app = express()

const namedRouter = new NamedRouter(app)

namedRouter.use('admin', '/admin', subApp)

routes.admin.dashboard() // => /admin/dashboard
```
