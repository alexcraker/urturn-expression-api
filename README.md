[risk]: https://access.redhat.com/knowledge/docs/resources/docs/en-US/JBoss_Developer_Studio/3.0/html-single/Seam_Developer_Tools_Reference_Guide/images/seam_editors/icon_exception.png "At risk"
[warning]: http://demo.rockettheme.com/oct09/templates/rt_infuse_j15/images/menus/icon-warning.png "Warning"
[agreed]: http://f.generallinguistics.com/color-coding-genius/icon-tick.original.png "Agreed"

urturn-expression-api
=====================

Javascript Urturn Expression API.

* This will be the next API version. 
* Current alpha release is private and hidden in urturn server.
* Follow this project if you are interested in developping expression for urturn.com


## Getting started

```js
UT.Expression.ready(function(post) {
  // Create your post using the post API
})
```


## The post object

### Methods

Methods of the expression object are asynchronous, becuase ultimately they must communicate with Urturn via the postMessage API. 


#### .create( _type_, _options_ ) ![][agreed]

#### .dialog( _type_, _options_ ) ![][warning]

> It is undecided whether .dialog() should be responsible for requesting a user to crop media.


#### .height( _value_ ) ![][warning]

> The name of this method is undecided.
* .height()
* .size()


#### .proxify( _url_ ) ![][agreed]


#### .valid( _boolean_ ) ![][agreed]


#### .save() ![][agreed]



### Properties

#### .context ![][agreed]

```js
{
  player: boolean,
  editor: boolean,
  thumbnail: boolean
}
```


#### .node ![][agreed]

> Are we going to trigger 'resize' events on node?


#### .note ![][warning]

> This may be better as a method. Is setting the note async?


#### .storage ![][agreed]


#### .title ![][risk]

> This is propably deprecated 


#### .url ![][agreed]


## Events

#### .on('resize')

> See also post.node. We are undecided whether 'resize' should be triggered on post or on the DOM node.


## The media object

> ![][warning] There is some concern about having a media object that is dependent upon a specific expression object for post messaging.

### Methods

#### .toJSON()

### Properties

#### .type

#### .url


## The imageMedia object

Inherits from the media object.

### Methods

#### .crop( _options_)

#### .filter( _type_, _options_)


## The videoMedia object

Inherits from the media object.

### Methods

#### .crop( _options_)

#### .filter( _type_, _options_)


## The soundMedia object

Inherits from the media object.

### Methods

#### .toMIDI( _options_ ) ![][agreed] 

> Yes, of course I'm joking.

#### .filter( _type_, _options_ )



## Comments

Some recommendedations from @dymonaz:

https://twitter.com/stephband/status/296959513662214144


Copyright Webdoc Inc. 2012, all rights reserved
