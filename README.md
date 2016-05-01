# Design System Framework

[![Build status: https://travis-ci.org/lipsumar/design-system-framework](https://api.travis-ci.org/lipsumar/design-system-framework.svg?branch=master)](https://travis-ci.org/lipsumar/design-system-framework)
[![Join the chat at https://gitter.im/lipsumar/design-system-framework](https://badges.gitter.im/lipsumar/design-system-framework.svg)](https://gitter.im/lipsumar/design-system-framework?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Create and maintain web component libraries for websites.

![Design System Framework UI](resources/documentation/dsf-ui.png)



## What is this ?

DSF is primarily a way for **front-end developers** to work and package websites at a **component level**. DSF helps organize code and maintain a component library. It is especially made to work with _websites_, not web apps. 

If you make themes for CMS (or static pages) and want to organize the way you work, build and communicate on web components (especially with design systems), you found the right tool.

* Define components made of HTML, CSS and JS
* Styleguide-like UI 
* Component-level build with Gulp plugins (and more to come)
* Extensible with plugins (both for UI and build)


-> [Documentation](https://github.com/lipsumar/design-system-framework/wiki) <-


### For developers

#### Keep sources separate

![Example of file system with DFS](resources/documentation/file-structure-example.png)

The only requirement is that you use one folder per component, the rest is up to you. Simply tell DSF how to find your HTML, CSS and JS:

```json
{
  "css": "*.css",
  "html": "*.hbs",
  "config": "config.json"
}
```

#### No hard coded values

The sources you work on in DSF is the code you are going to use in the application code (HTML, CSS, JS). As such, templates already use variables:

```handlebars
<div class="textfield">
  {{> Atom/Label id=id text=label}}
  <input type="text" id="{{id}}" class="textfield__field">
</div>
```

This allows to never use hard coded values: they tend to be too perfect. DFS will also help you test your components with different values to make sure your components support names such as _Hubert Blaine Wolfeschlegelsteinhausenbergerdorff_.

Handlebars is used for templating.

#### The styleguide is alive

DFS does more than generate a styleguide from your sources: it actively watches you work and rebuilds anything that needs to. You should never have to touch your browser again.

For each component DFS provides always-up-to-date HTML, CSS and JS files. These files are "standalone": they contain your base code (reset.css, your favorite CSS/JS framework) and the component's code. This way you can test faster with lighter setup and _cherry on the cake_: make sure your components do not depend on each other (tight-coupling).

#### Dependency management

DFS understands your component dependencies and will always build what you need, only what you need.

#### Build production code

Provided a small configuration, DFS can generate the smallest files possible for production. Since it enforces the separation of components, it can easily generate 2 versions of external assets: the critical path (to be inlined) and the rest (to be loaded asynchronously).


**Also:**

- Makes refactoring much easier
- Reinforces re-use of components
- Backend agnostic
- Generates test files for all components
- Statistics for each component:
  - code size
  - dependencies




### For designers and editors

#### Up to date documentation

An up-to-date documentation of the design system is an invaluable asset for designers and editors. By using the styleguide sources as the project sources, it's simply impossible for the styleguide to be out of date.

#### Quickly test copy

A living styleguide allows you to test the limits of components: _does this title fit in our homepage?_ You can simply test your copy in an actual browser, using the actual production code with no programming knowledge needed.


-> [Documentation](https://github.com/lipsumar/design-system-framework/wiki) <-
