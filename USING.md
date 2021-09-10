# Using Mailmerge

There are 2 main uses of the mailmerge control.

1. In the editor where a user designs their template
2. In the resulting page where the template is rendered to HTML.

# What is MailMerge?

MailMege works with your GraphQL server to provide user templates over the data available from the GraphQL server.  The MailMerge editor instrospects over the GraphQL schema and provides a comfortable<sup>1</sup> editing experience to the site users.

When writing a template when the user references a field it is automatically added to a generate GraphQL fragment so the minimum amount of data can be requested from the server. A Fragment is generated instead of a query so the `MailMerge` can be easily inserted into a page and the data required for `MailMerge` added on to the other requests the page makes.

## Example Template:
```handlebars
hello {{user.name}}
For dinner we are serving:
{{#each user.meals.dinner.foods}}
    {{adjective}} {{name}},
{{/each}}
```

Which generates a hypothetical fragment:
```graphql
fragment _ on user {
    name
    meals {
        dinner {
            name
            adjective
        }
    }
}
```


# Islands (plugins)

Out of the box MailMerge templates have full control of the layout and can introspect your grpahql server and reference global css styles on your page.

However, if you really want to integrate the <MailMerge> into the site you may want to use common react components that you've defined. Islands are the tool to do that.

You can think of an `Island` as a type of plug-in that extends the behavior of `MailMerge`. They aren't called plug-ins, though, because they have an important difference.  Most plug-ins are registered at the start or load of the page and, once registered, are always available.  `Islands`, on the other hand, are meant to be use-case specific.  Each `Island` can request data that it needs from the grpahql server in the form of adding fields to the generated GraphQL fragment.  If you define a `UserBadge` `Island` it might request the name of the currently logged in user.  If you intended to host this `MailMerge` on a part of your site that doesn't require login you might want to prevent the user from trying to show that `Island` at all.  In this way the set of valid `Island`s is context specific.

In practice you will probably have a set of common `Island`s and a set of specific islands for the page you are writing the template for.  The common islands will be things like `Button` or `Expander` which match the style of your site and are either built by hand or provided by your CSS library.


## An Island
Each `Island` has 3 parts. A "name" or tag which is how the `Island` is reference in the template. By convention these should start with an upper case letter. i.e. "Button" not "button"

You should use the `makeIsland` function to create islands.

```ts
let myIslands = [
    makeIsland("CatPic", null, () => <img src="https://placekitten.com/200/300" />)
];
```

This will result in an object of structure similar to the following. _However, this is an implementation detail and the specific structure of this could be subject to change._

```ts
    { 
        name: "CatPic"
        fragment: Frament,
        factory: (attributes, children, raiseEvent(eventName, arg), ... ?)
    }
```

### The makeIsland function
The makeIsland constructor function takes 3 arguments. 

1. The name of the Island's tag. If you register 2 islands with the same name only one with be used.
2. A Fragment which describes the data this island requires.  This will be *merged* with the fragments from the template and the fragments from any other Islands the template uses.
3. The **constructor** function for the element.  When the MailMerge template is rendered to react elements this function is called to create the element that represents this Island. This function takes a series of optional arguments which can be used to customize the behavior. None of these are required so the simplest Island is something like `() => <div />`.  The arguments are
    1. **attributes** - Map of attributes supplied to the Island in the template.  These will be a map of string keys to string values. 
    2. **children** - This is the collection of react child elements of the `Island`.  This allows you to wrap elements in things like borders or expanders. This is very similar to a react higher order component.  I.e. `(attr, children) => <div class='border'><children></div>`
    3. **raiseEvent(eventName:string, payload:object)** - Sometimes it may be useful for the `MailMerge` control to communicate up to the larger page. You can, of course, use the React context api to achieve this but it might be easier for the page to hook a single event on the `MailMerge` element and pass events out.  For example this could be used to enable user controls to raise events that get mapped directly to Redux events or a 'refresh' button might be added to indicate the page should refresh the query from the server without changing anything.  
    Each event has a name and a payload. The payload must be interpreted by the handler of the event. Events are never handled by the `MailMerge` control except to be logged if a handler is not provided.   
    **NOTE**: A special case of raiseEvent is the "SET" event which can be used to set values in the fragment parameter set.


# Mailmerge Query and Fragment type

A `Query` is made up of multiple fragments. Each `Fragment` has a single root in the graphql and two fragments with the same root can be merged if they have the same parameters.  Each fragment on a query is defined by it's alias if it has one otherwise defined by it's root key.  If a root has parameters it *must* have an alias.  For the sake of simplicity the argument names are unique across the whole query. So two different fragments which both refer to the `$date` variable will have the same value

// TODO: Should queries be immutable? If they were it would be easy to attach the orignal query to the results for debugging.
// NOTE; the fragment type can (will?) be used to memoize each island to the specific data it needs to update. 
```ts
interface Query {
    variables: Map<string,object?>
    defaultValues : Map<string,object>
    fragments: Record<string,Fragment>

    setValue : (key.value) => Query // todo: immutable?
    addFragment : (Fragment) => Query
}
interface Fragment {
    root: string
    alias: string
}
interface GraphQLNode {
    // TODO: under construction
    // type: 'scalar'|'vector'|'map'
    parameters: string[]
}
```

### Validation
There is a function `bool validate(Fragment, data)` which will return true if all the fields in Fragment are present in the data.  

# Rendering

```ts
    // Get the fragment from a template
    getFragment(islands, tempate) -> Fragment

    // Render the template
    <MailMerge template="" context={} islands={} paramsUpdated=... onEvent=... />
```
1. **template** - The user input template to render
2. **islands** - The set of valid islands in this context
3. **context** - The result of the GraphQL query.
4. **paramsUpdated** - The graphql parameters have been updated and the query may need to be re-run.
5. **onEvent** - Set of callbacks for handling events in the form of Record<string, (object) => void>. If an event is raised that isn't in the map an error is logged to the console.  To handle settings values on the Fragment you can bind the set event to the setter on Fragment. Ex: onEvent={{ 'SET': fragment.setValue }}

<MailMerge template={} data={}  />

# Mutations
You may have noticed we haven't talked about Mutations. In general MailMerge focuses on fetching and displaying data rather than changing it. If an island needs to mutate data it's OK to have it use a local mutation. If you need to coordinate mutations across a set of islands you can use the effect system to raise events which trigger the mutations.

# Examples
* [Simple Example](http://github.com/clinwiki-org/MailMerge/)  
    Barebones example of using mailmerge to query and view some data.
* [Search Example](http://github.com/clinwiki-org/MailMerge/)  
    Shows how to build a simple search page using Mailmerge
* [Dependent Query Example](http://github.com/clinwiki-org/MailMerge/)  
    Shows how to use dependent queries where interating with the result may trigger new queries. (See clinwiki agg expander).  Demonstrates use of reference equality to make the updates fast (no 'flash')
    
# Errors
    TODO: Islands should use react error boundaries to handle errors without "blank white page".
    

# FootNotes
1.  OK, "comfortable" might be stretching it a bit right now. MailMerge is a work in progress.

