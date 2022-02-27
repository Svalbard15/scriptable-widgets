
# F1 Countdown widget

![widget](https://github.com/Svalbard15/scriptable-widgets/blob/main/widget40.png "F1 Countdown widget")

## Features:

* The widget loads the race schedule from https://ergast.com/mrd/ and shows the countdown in days until the next race


### How to use this widget?

1. Install Scriptable from the [app store](https://apps.apple.com/us/app/scriptable/id1405459188)
1. Check if the folder "Scriptable" was created in your iCloud app
1. Copy the source code of the file [`F1Countdown.js`](/F1Countdown.js) into the "Scriptable" folder in the iCloud app ([raw JS here](https://raw.githubusercontent.com/Svalbard15/scriptable-widgets/main/F1Countdown.js))
1. Create a folder "F1Countdown" at the same level as the `F1Countdown.js`-file 
1. In that folder store a (square) background image of your liking for the widget and name it `car.jpg` - just square the image. You'll find suitable images from the 2022 launch events on https://twitter.com/f1
1. Lauch scriptable on your phone
1. It should recognize the `F1Countdown.js` file and create a button "F1Countdown"
1. Click the F1Countdown button to see a preview


### Putting the widget on your home screen

1. Touch and hold the Home Screen background where you want to add the widget until the apps begin to jiggle
1. Click (+)
1. Select Scriptable, then select the small square widget and place it on your home screen
1. Hold down the widget until the dialog appears, click "Edit Widget"
1. As script select "F1Countdown"
1. When Interacting select "Run Script"

And that's it. 



## Remaining To-Do's for version 0.2:
* add an hourly countdown for the last 24 hours before the race
* if less than an hour is left before the start display the start time
