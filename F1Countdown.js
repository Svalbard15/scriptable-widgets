// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: globe;

// adapt to your needs
const BACKGROUND_IMAGE_FOLDER = "F1Countdown/car.jpg"

const ONE_DAY_IN_MS  = 86400000 // (1000ms * 60s * 60m * 24h)
const ONE_HOUR_IN_MS =  3600000 // (1000ms * 60s * 60m)

// *****************************************************
// Ergast F1 API
// API documentation  http://ergast.com/mrd/
// 2022 Race Calendar http://ergast.com/api/f1/2022.json
// *****************************************************

// load the data for the next race
let URL = "http://ergast.com/api/f1/current/next.json"

// test data to un-comment
// zandvort
// url = "http://ergast.com/api/f1/2022/15.json"
// monza
// url = "http://ergast.com/api/f1/2022/16.json"

const data = await fetchJson( URL );

// variable to hold the widget
let widget = undefined;

// Did the web service return JSON data?
if( data == undefined ) {

  // error scenario
  // no data was received from the Web API
  // provide the static error widget

  widget = staticErrorWidget("🏎", "Cannot load Schedule!", "Got network?" ) 

} else {

  // we got data from the web service
  // lets build up the countdown widget

  // extract the next race from the JSON object
  const race = data.MRData.RaceTable.Races[0]

  // Per Ergast: the circuitId is a static element in the data set 
  // here used for resolving the time zone which I provided in code
  // raceData contains timezone and shadowColor (for location)
  const raceData = getRaceData( race.Circuit.circuitId )

  // call function to build the widget
  widget = createWidget( BACKGROUND_IMAGE_FOLDER, race, raceData )
}

// display the widget
if (config.runsInWidget) {
  Script.setWidget(widget)
  Script.complete()
} 
else {
  widget.presentSmall()
}


//-------------------------------------
// Widget Specific Helper Functions
//-------------------------------------

/**
 * returns the fully styled widget
 *  
 * @param {string} backgroundImagePath - the background image
 * @param {object} race - the race data from the web service call
 * @param {object} raceData - the race data with timezone and color
*/
function createWidget( backgroundImagePath, race, raceData ) {

  let widget = new ListWidget()
  
  // paddign between edge of widget and start of elements in the widget
  widget.setPadding(4,6,10,6)
  widget.backgroundColor = new Color( "#468499" )
  
  // set background image
  // TODO - test if image is there
  const imageUrl = getImageUrl( backgroundImagePath )
  const image = Image.fromFile( imageUrl )
  widget.backgroundImage = image

  // get race date (time) at location of device/user
  let raceDateAtDeviceLocation = getDeviceLocalStartDateTime( race.date, race.time, raceData.timeZone )
  
  // * TEST DATA ************************************************************
  // "date":"2022-03-20","time":"15:00:00Z"
  // raceDateAtDeviceLocation = new Date( "2022-03-15" + "T" + "02:00:00Z" )

  let timeRemainingMs = calcMsUntilEvent( raceDateAtDeviceLocation )

  const WHITE = "#ffffff"
  const CYAN = "#00ffff"
  const FONT_NAME = "AvenirNext-DemiBold"
  const SMALL_FONT_NAME = FONT_NAME

  // Other interesting fonts
  // Futura 84
  // Futura Bold 72
  // Chalkboard SE 96
  // Avenir Book 96
  // Didot Bold 92

  let timeRemaining = -1;

    if( timeRemainingMs > ONE_DAY_IN_MS ) {

    // here we have days left (more than 24 hours) **************************************
    timeRemaining = Math.floor( timeRemainingMs / ONE_DAY_IN_MS )

    // - no headline
    // - center cell: show remaining days

    // make the font smaller for 3-digit day numbers
    let countDownTextFontSize = 82
    if( numberOfDigits( timeRemaining ) > 2 ) {
      countDownTextFontSize = 64
    }

    widget.addSpacer();

    // center cell: display countdown number in days
    addSingleCenteredCell( widget, timeRemaining.toString() , FONT_NAME, countDownTextFontSize, WHITE, CYAN, 3 )

    // - bottom cell: use default below

  } else if( timeRemainingMs > ONE_HOUR_IN_MS ) {
      
      // here we have less than 24 hours, but more than 2 hours left ********************

      timeRemaining = Math.floor( timeRemainingMs / ONE_HOUR_IN_MS )

      widget.addSpacer();

      // - headline: Today!
      addSingleCenteredCell( widget, "TODAY!", FONT_NAME , 22, WHITE, CYAN, 3 )
      
      widget.addSpacer();
      widget.addSpacer();

      // - center cell: show hour countdown
      addSingleCenteredCell( widget, timeRemaining.toString() + " hrs", FONT_NAME, 36, WHITE, CYAN, 3 )
    
      widget.addSpacer();
      widget.addSpacer();

      // - bottom cell: use default below

  } else {      

      // here we have less than 1 hours left ********************************************
            
      timeRemaining = Math.floor( timeRemainingMs / ONE_HOUR_IN_MS )

      widget.addSpacer();
      // - headline: Today!
      addSingleCenteredCell( widget, "TODAY!", FONT_NAME , 22, WHITE, CYAN, 3 )
      
      widget.addSpacer();
      widget.addSpacer();
      widget.addSpacer();

      const time = new Intl.DateTimeFormat( this.locale, { hour: 'numeric', minute: 'numeric' }).format( raceDateAtDeviceLocation )
      // - center cell: show local race time
      addSingleCenteredCell( widget, time, FONT_NAME, 24, WHITE, CYAN, 3 )
    
      widget.addSpacer();
      widget.addSpacer();
      widget.addSpacer();
  }

  // create the 2 bottom rows:

  const location = race.Circuit.Location.locality
  const country = race.Circuit.Location.country
  
  // apply the device local format to the race month and date
  // localization: https://github.com/mzeryck/Weather-Cal/blob/main/weather-cal-code.js
  // date time format cheat sheet: https://devhints.io/wip/intl-datetime
  const month = new Intl.DateTimeFormat( this.locale, { month: 'short' }).format( raceDateAtDeviceLocation )
  const day = new Intl.DateTimeFormat( this.locale, { day: 'numeric' }).format( raceDateAtDeviceLocation )

  // widget.addSpacer();

  // 2 bottom rows for location and date
  addRowWTwoColumns( widget, location, day, SMALL_FONT_NAME, 14, WHITE, raceData.shadowColor, 3 )
  addRowWTwoColumns( widget, country, month, SMALL_FONT_NAME, 14, WHITE, raceData.shadowColor, 3 )

  widget.addSpacer();

  return widget
}

/**
 * Static error widget
*/
function staticErrorWidget( row1, row2, row3 ) {

  let w = new ListWidget()
  w.backgroundColor = Color.black();

  const topStack = w.addStack()
  topStack.setPadding(0,0,0,0)
  topStack.addSpacer()
  topStack.topAlignContent()

  // topstack contents and format
  const raceCarText = topStack.addText( row1 )
  raceCarText.font = new Font( "Futura PT Cond Bold", 92 )
  raceCarText.textColor = Color.white()
  raceCarText.shadowColor = Color.cyan()
  raceCarText.shadowRadius = 3
  raceCarText.centerAlignText()
  topStack.addSpacer()
  topStack.addSpacer()

  // bottomstack contents and format
  const bottomStack = w.addStack()
  bottomStack.setPadding(0,0,0,0)
  bottomStack.layoutVertically()
  bottomStack.bottomAlignContent()
  
  const text = bottomStack.addText( row2 )
  text.font = Font.boldSystemFont( 10 )
  text.textColor = Color.white()
  text.shadowColor = Color.red()
  text.shadowRadius = 3
  //text.textOpacity = 0.8
  text.leftAlignText()
  bottomStack.addSpacer()

  const text2 = bottomStack.addText( row3 ) 
  text2.font = Font.boldSystemFont( 10 )
  text2.textColor = Color.white()
  text2.shadowColor = Color.red()
  text2.shadowRadius = 3
  //text2.textOpacity = 0.8
  text2.leftAlignText()
  bottomStack.addSpacer()

  return w
}


//-------------------------------------
// Layout Helper Functions
//-------------------------------------

/**
 * returns a widget row that is centered
 *  
 * @param {object} parent - the object that this text attaches to
 * @param {String} text - the text displayed
 * @param {String} fontName - the name of the font to style the text
 * @param {String} fontSize - the size of the font to style the text
 * @param {String} textColor - the color of the text displayed
 * @param {String} shadowColor - the color of the shadow of the text displayed
 * @param {number} shadowRadius - the radius of the shadow of the text displayed
*/
function addSingleCenteredCell(parent,text,fontName,fontSize,textColor,shadowColor,shadowRadius) {

  const styledText = parent.addText( text );
  styledText.font = new Font( fontName, fontSize );
  styledText.centerAlignText();
  if( textColor != undefined ){
    styledText.textColor = new Color( textColor )
  }
  if( shadowColor != undefined ){
    styledText.shadowColor = new Color( shadowColor)
  }
  if( shadowRadius != undefined ){
    styledText.shadowRadius = shadowRadius
  }
  
}


/**
 * returns a widget row that is centered
 *  
 * @param {object} parent - the object that this text attaches to
 * @param {String} textLeft - the text displayed in the left column
 * @param {String} textRight - the text displayed in the right column
 * @param {String} fontName - the name of the font to style the text
 * @param {String} fontSize - the size of the font to style the text
 * @param {String} textColor - the color of the text displayed
 * @param {String} shadowColor - the color of the shadow of the text displayed
 * @param {number} shadowRadius - the radius of the shadow of the text displayed
*/
function addRowWTwoColumns(parent,textLeft,textRight,fontName,fontSize,textColor,shadowColor,shadowRadius) {

  // horizontal alignment is default for stacks
  const row = parent.addStack();
  row.setPadding(0,0,0,0)
  
  // left column
  addSingleCenteredCell( row, textLeft, fontName, fontSize, textColor, shadowColor, shadowRadius)

  row.addSpacer();

  // right column
  addSingleCenteredCell( row, textRight, fontName, fontSize, textColor, shadowColor, shadowRadius)

}


/**
 * Returns the number of digits of the parameter number
 * better performance than number.toString().length
 * 
 * source/author: https://stackoverflow.com/questions/14879691/get-number-of-digits-with-javascript/28203456#28203456
 * 
 * @param {number} number
 */
 function numberOfDigits(number) {
  return (Math.log10((number ^ (number >> 31)) - (number >> 31)) | 0) + 1;
}


/**
 * Loads a local image by name
 *  
 * @param {string} name of image file
*/
function getImageUrl(name) 
{
  const fm = FileManager.iCloud();
  const dir = fm.documentsDirectory();
  return fm.joinPath(dir, `${name}`);
}


//-------------------------------------
// Date/Time Helper Functions
//-------------------------------------

/**
 * Get Time Zone Name
 * 
 * This could have been solved through another webservice call
 * but I wanted to avoid having to register for a(nother) service
 * possible option: Ergast provides lat/long of race location -> could have been used to look up time zone
 * 
 * data sources:
 * http://ergast.com/api/f1/2022.json
 * https://time.is
 * https://flagcolor.com (in some cases I looked at the Jersey colors of the National Football teams) (And yes, it's called Football!)
 *  
 * @param {string} raceId - static per Ergast 
*/
function getRaceData( raceId ) {
  let data = ""
  switch(raceId) {   
    case "BAK": data = { "timeZone":"Asia/Baku","shadowColor":"#0092bc" }; break; // blue 
    case "albert_park": data = { "timeZone":"Australia/Melbourne","shadowColor":"#ffcd00" }; break; // tangerine yellow
    case "americas": data = { "timeZone":"America/Chicago","shadowColor":"#bf0d3e" }; break; // red
    case "bahrain": data = { "timeZone":"Asia/Bahrain","shadowColor":"#cc0000" }; break; // red
    case "catalunya": data = { "timeZone":"Europe/Madrid","shadowColor":"#f1bf00" }; break; // yellow
    case "hungaroring": data = { "timeZone":"Europe/Budapest","shadowColor":"#c8102e" }; break; // red
    case "imola": data = { "timeZone":"Europe/Rome","shadowColor":"#0000ff" }; break; // blue
    case "interlagos": data = { "timeZone":"America/Sao_Paulo","shadowColor":"#fedd00" }; break; // yellow
    case "jeddah": data = { "timeZone":"Asia/Riyadh","shadowColor":"#008000" }; break; // green      
    case "marina_bay": data = { "timeZone":"Asia/Singapore","shadowColor":"#ef3340" }; break; // red
    case "miami": data = { "timeZone":"America/New_York","shadowColor":"#ffffff" }; break; // white
    case "monaco": data = { "timeZone":"Europe/Monaco","shadowColor":"#c8102e" }; break; // red
    case "monza": data = { "timeZone":"Europe/Rome","shadowColor":"#0000ff" }; break; // blue
    case "red_bull_ring": data = { "timeZone":"Europe/Vienna","shadowColor":"#ef3340" }; break;  // red
    case "ricard": data = { "timeZone":"Europe/Paris","shadowColor":"#0055a4" }; break; // blue
    case "rodriguez": data = { "timeZone":"America/Mexico_City","shadowColor":"#006341" }; break; // green
    case "silverstone": data = { "timeZone":"Europe/London","shadowColor":"#012169" }; break; // blue
    case "sochi": data = { "timeZone":"Europe/Moscow","shadowColor":"#ef3340" }; break; // red
    case "spa": data = { "timeZone":"Europe/Brussels","shadowColor":"#c8102e" }; break; // red
    case "suzuka": data = { "timeZone":"Asia/Tokyo","shadowColor":"#ef3340" }; break; // red
    case "villeneuve": data = { "timeZone":"America/Toronto","shadowColor":"#ef3340" }; break; // red
    case "yas_marina": data = { "timeZone":"Asia/Dubai","shadowColor":"#009639" }; break; // green
    case "zandvoort": data = { "timeZone":"Europe/Amsterdam","shadowColor":"#ff9b00" }; break;// orange
    default: 
     text = "raceId not found in function getTimeZoneName( " + raceId +" )";
      // TODO throw an error
  }  
  return data;
}


/**
 * Returns the difference in ms from now until the parameter future date
 *  
 * @param {String} futureDate - future date
*/
function calcMsUntilEvent( futureDate )
{
  // date of future event
  // let futureDate = new Date( dateStr )
  
  // current date
  let now = new Date() 
  // only use date for calculation, erase time
  // now.setHours( 0, 0, 0, 0 );
  
  //today.setHours( futureDate.getHours(), futureDate.getMinutes(), futureDate.getSeconds(), futureDate.getMilliseconds() );
  //log('h:' + futureDate.getHours())
  //log('m:' + futureDate.getMinutes())
  //log('s:' + futureDate.getSeconds())
  //log('ms:' + futureDate.getMilliseconds())

  let diff_ms = futureDate.getTime() - now.getTime()
  // 1 day = 86400000ms (1000ms * 60s * 60m * 24h)
  // let diff_days = Math.round( diff_ms / 86400000 )
  // diff_day++ // compensate for hours
  return diff_ms
}


/**
 * Returns the difference in days from now until the parameter future date
 *  
 * @param {String} futureDate - future date
*/
function calcDaysUntilDate( futureDate )
{
  // date of future event
  // let futureDate = new Date( dateStr )
  
  // current date
  let now = new Date() 
  // only use date for calculation, erase time
  // now.setHours( 0, 0, 0, 0 );
  
  //today.setHours( futureDate.getHours(), futureDate.getMinutes(), futureDate.getSeconds(), futureDate.getMilliseconds() );
  //log('h:' + futureDate.getHours())
  //log('m:' + futureDate.getMinutes())
  //log('s:' + futureDate.getSeconds())
  //log('ms:' + futureDate.getMilliseconds())

  let diff_ms = futureDate.getTime() - now.getTime()
  // 1 day = 86400000ms (1000ms * 60s * 60m * 24h)
  let diff_days = Math.round( diff_ms / 86400000 )
  // diff_day++ // compensate for hours
  return diff_days
}

/**
 * Returns the difference in hours from now until the parameter future date
 *  
 * @param {String} futureDate - future date
*/
function calcHoursUntilEvent( futureDate )
{
  // current date
  let now = new Date() 
  let diff_ms = futureDate.getTime() - now.getTime()

  // return difference in hours
  return Math.round( diff_ms / ONE_HOUR_IN_MS )
}

/**
 * Calculates local start time at device location
 * 
 * @param {string} raceDateStr - date of race as string from web service
 * @param {string} raceTimeStr - time of race as string from web service
 * @param {string} raceTimezone - timezone at the location of the race
*/
function getDeviceLocalStartDateTime(raceDateStr,raceTimeStr,raceTimezone) {

  // seems to be all not needed
  // TODO - more testing for other race locations at race dates
  // ***********************************************************

  // // calculate the timezone offset bewteen race location and GMT
  // const raceDateAtLoc = new Date( raceDateStr )
  // const raceLocTzOffset = getTimeZoneOffset( raceDateAtLoc, raceTimezone )

  // // calculate the timezone offset bewteen the current device location and GMT
  // const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  // const localTzOffset = getTimeZoneOffset( raceDateAtLoc , localTimeZone )

  // // calculate the difference between device location and race timezones in minutes
  // const timeOffsetDeviceToRaceLocation = raceLocTzOffset - localTzOffset

  //adjust race date time by offset to get local start time
  const localStartTime = new Date( raceDateStr + "T" + raceTimeStr )
  log( "local start time: " + localStartTime )

  // ***REALLY INCORRECT?*** let lst = localStartTime.addMinutes( timeOffsetDeviceToRaceLocation )
  // log( "LST + offset minutes: " + lst )

  return localStartTime;
}


/**
 * Calculates the timezone offset at a given date
 * 
 * Source: https://stackoverflow.com/questions/29265389/how-do-i-calculate-the-difference-of-2-time-zones-in-javascript
 * Author: https://stackoverflow.com/users/634824/matt-johnson-pint
 *  * 
 * @param {date} date
 * @param {string} timezone
*/
function getTimeZoneOffset(date, timeZone) {

  // Abuse the Intl API to get a local ISO 8601 string for a given time zone.
  let iso = date.toLocaleString('en-CA', { timeZone, hour12: false }).replace(', ', 'T');

  // Include the milliseconds from the original timestamp
  iso += '.' + date.getMilliseconds().toString().padStart(3, '0');

  // Lie to the Date object constructor that it's a UTC time.
  const lie = new Date(iso + 'Z');

  // Return the difference in timestamps, as minutes
  // Positive values are West of GMT, opposite of ISO 8601
  // this matches the output of `Date.getTimeZoneOffset`

  // 60000 = 60s * 1000ms
  return -(lie - date) / 60000;
}

//-------------------------------------
// Network Helper Functions
//-------------------------------------

/**
 * Make a REST request and return the response
 * 
 * @param {string} url URL to make the request to
 * 
 * Adapted from: https://github.com/yaylinda/scriptable
*/
async function fetchJson(url) {
   try {
     const req = new Request(url);
     const resp = await req.loadJSON();
     return resp;
    } catch (error) {
    // if I log this to error console I don't see the error widget
    //  console.error(`Could not load url: ${url}`)
    //  console.error(`error: ${JSON.stringify(error)}`)
    // so logging this to the standard console
      log(`Could not load url: ${url}`)
    }
}
