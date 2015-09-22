# Optic

Optic is a library that aims to make it easier for applications to talk with APIs. It provides a framework for clients to plug and play functionality such as logging, caching, authentication, error handling, rate limit retrying, data parsing, throttling, etc ... in an api and protocol agnostic way via plugins. It also enables cool stuff like declarative data fetching for React components and optimistic updates.

## Queries

In order to support these features, Optic introduces an abstraction called an optic.Query. A query is just an object that represents a single request to fetch and/or update resources through an API. Queries can be configured with resource specific defaults but they can also be modified on a query-by-query basis using method chaining. A query is analagous to an XMLHttpRequest object but it's on a higher level of abstraction. Now that we have queries, logical requests for data are no longer tied to an actual HTTP (or other transport) request. For example, if we enable the query caching plugin (essentially memoization with a TTL), it's possible for the query to return a 200 status response without actually firing an HTTP request. A query gets passed through and mutated by the multiple layers of plugins that are specified for that query. Additionally, changing the relevant query's params is the only supported way for plugins to influence each others behavior.

## Resources

Optic is a resource oriented querying engine in the sense that the body of an optic.Response (output of a query) must be either a single or a collection of optic.Resource instances. You will usually want to create your own resource classes just like you would for custom Backbone Model classes. This is where resource-level query configuration should go. For example, if you know that all queries for some resource will use the RateLimitPlugin, then a simplified resouce definition could look like this.

var rateLimitPlugin = new RateLimitPlugin();
var UsersResource = Optic.Resource.extend({ 
  plugins: [rateLimitPlugin],     // Default plugins for all queries of this Resource
  adapter: ...,                   // More on adapters later

  // An instance method
  getName: function() {
    return this.get('name') || 'anon';
  }
});

Now we can create a new query that requests the user with id 'food_bar'.

// Create a "fetch" query for the UsersResource with one param for the id.
var query = UsersResource.fetch().params({id: 'food_bar'});

// Any resource level query configs can be overridden at the query level.
query.removePlugin(rateLimitPlugin);

// And now submit it.
query.submit(function(response) {
  if (response.isSuccessful()) {
    console.log('Name is: ' + response.body.getName());
  }
});

## Plugins & Lenses

A plugin is actually just a set of lenses that work together to achieve a common goal. A lens can either be a query lens or a response lens. Response lenses are functions that intercept and potentially modify responses after they get emitted but before the client sees them. So response lenses are basically response middlewares. On the other hand, query lenses are a bit more powerful because not only are they "query middlewares" that can accept a query and emit a modified version of it, but they can also override the destination state of that query. This means that if a query lens intercepts a query on its way to the 'done' state and reroutes it to the 'submitting' state instead, then the query lens effectively just resubmitted the query on behalf of the client. The following sections will elaborate about lenses, but plugins are just bundles of lenses that belong together.

### Query Lenses

A query always has a state that is one of following: idle, submitting, done, or canceled. Knowing how and when a query moves between states is central to understanding how query lenses get invoked.

### Response Lenses

### Plugin example

