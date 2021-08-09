# Using Mailmerge

There are 2 main uses of the mailmerge control.

1. In the editor where a user designs their template
2. In the resulting page where the template is rendered to HTML.

# What is MailMerge?

MailMege works with your GraphQL server to provide user templates over the data available from the GraphQL server.  The MailMerge editor instrospects over the GraphQL schema and provides a comfortable<sup>1</sup> editing experience to the site users.

When writing a template when the user references a field it is automatically added to a generate GraphQL fragment so the minimum amount of data can be requested from the server. A Fragment is generated instead of a query so the `MailMerge` can be easily inserted into a page and the data required for `MailMerge` added on to the other requests the page makes.

## Example Template:
```
hello {{user.name}}
For dinner we are serving:
{{#each user.meals.dinner.foods}}
    {{adjective}} {{name}},
{{/each}}
```

Which generates a hypothetical fragment:
```
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

        let myIslands = [
            makeIsland("CatPic", null, () => <img src="https://placekitten.com/200/300" />)
        ];

This will result in an object of structure similar to the following. _However, this is an implementation detail and the specific structure of this could be subject to change._

    { 
        name: "CatPic"
        fragment: Frament,
        factory: (attributes, children, setValue(key=value), raiseEvent(eventName, arg), ... ?)
    }

### The makeIsland function
The makeIsland constructor function takes 3 arguments. 

1. The name of the Island's tag. If you register 2 islands with the same name only one with be used.
2. A Fragment which describes the data this island requires.  This will be *merged* with the fragments from the template and the fragments from any other Islands the template uses.
3. The **constructor** function for the element.  When the MailMerge template is rendered to react elements this function is called to create the element that represents this Island. This function takes a series of optional arguments which can be used to customize the behavior. None of these are required so the simplest Island is something like `() => <div />`.  The arguments are
    1. **attributes** - Map of attributes supplied to the Island in the template.  These will be a map of string keys to string values. 
    2. **children** - This is the collection of react child elements of the `Island`.  This allows you to wrap elements in things like borders or expanders. This is very similar to a react higher order component.  I.e. `(attr, children) => <div class='border'><children></div>`
    3. **setValue(key:string, value:object)** - When defining the GraphQL fragment you can provide "holes" or mutable values which can supplied or changed by the template.  For example you might want to include a text area which when changed sets the search parameter of the query.  Once setValue is called the GraphQL query will be invalidated and the `MailMerge  may be re-rendered.
    4. **raiseEvent(eventName:string, payload:object)** - Sometimes it may be useful for the `MailMerge` control to communicate up to the larger page. You can, of course, use the React context api to achieve this but it might be easier for the page to hook a single event on the `MailMerge` element and pass events out.  For example this could be used to enable user controls to raise events that get mapped directly to Redux events or a 'refresh' button might be added to indicate the page should refresh the query from the server without changing anything.
    Each event has a name and a payload. The payload must be interpreted by the handler of the event. Events are never handled by the `MailMerge` control except to be logged if a handler is not provided. 
        *TODO*: Should setValue just be raiseEvent('SET', 'key=value')?


# Mailmerge Fragment type
TODO: This section is under construction...
    {
        root: String
        params : string list // list of variable names
        // TODO: think about this
        // fragmentName - actually not important. 
        // fragment identity is determined by the root
    }

# Rendering

    // Get the fragment from a template
    getFragment(islands, tempate) -> Fragment

    // Render the template
    <MailMerge template="" context={} islands={} paramsUpdated=... onEvent=... />
1. **template** - The user input template to render
2. **islands** - The set of valid islands in this context
3. **context** - The result of the GraphQL query.
4. **paramsUpdated** - The graphql parameters have been updated and the query may need to be re-run.
5. **onEvent** - An event has been raised. //TODO: Would it be better to pass in a dictionary of event handlers by name? That would allow the MM to deterine unhandled events more precisely

<MailMerge template={} data={}  />

# Examples
    TODO: Agg like tree where there are expanders that need to make new unrelated sub-queries which get merged into the context
          Mailmerge should use reference equality to to supress re-render of islands where needed.
    
# Errors
    TODO: Islands should use react error boundaries to handle errors without "blank white page".
    

# FootNotes
1.  OK, "comfortable" might be stretching it a bit right now. MailMerge is a work in progress.

