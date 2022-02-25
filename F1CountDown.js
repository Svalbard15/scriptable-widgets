// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;

// needs to be above usage... not sure why
/**
 * adds Minutes to a date
 * 
 * Source: https://stackoverflow.com/questions/1050720/adding-hours-to-javascript-date-object
 * 
 * @param {number} minutes
*/
 Date.prototype.addMinutes= function(minutes){
  let copiedDate = new Date(this.getTime());
  copiedDate.setMinutes(copiedDate.getMinutes()+minutes);
  return copiedDate;
}


const backgroundImagePath = "F1CountDown/car.jpg"


// *****************************************
// API methods to load F1 schedule
// http://ergast.com/mrd/methods/schedule/
// *****************************************

// load the data for the next race
let url = "http://ergast.com/api/f1/current/next.json"
// zandvort
// url = "http://ergast.com/api/f1/2022/15.json"
// monza
// url = "http://ergast.com/api/f1/2022/16.json"
const data = await fetchJson(url);

// variable to hold the widget
let widget = null;

// was JSON load successful?
if(data == undefined) {

  // error scenario
  // no data was received from the Web API
  // provide the static error widget

  widget = staticErrorWidget("🏎", "Cannot load Schedule!", "Got network?" ) 

} else {

  // here: data was received from the webservice
  // => build up the countdown widget

  // extract race data from the JSON object
  const race = data.MRData.RaceTable.Races[0]

  // raceId is a static element in data set per Ergast
  // here used for resolving the time zone
  // get timezone and shadowColor for location
  const raceData = getRaceData( race.Circuit.circuitId )
  // const raceTimezone = raceData.timeZone

  //
  const deviceLocalStartDateTime = getLocalStartDateTime( race.date, race.time, raceData.timeZone )

  // days remaining until the start of the race
  const daysRemaining = calcDaysUntilDate( race.date )
  
  // TODO - the last date needs to be the device local date and not the date at the race location
  widget = createWidget( daysRemaining, backgroundImagePath, race, raceData, deviceLocalStartDateTime )

}

if (config.runsInWidget) {

  Script.setWidget(widget)
  Script.complete()
} 
else {
  widget.presentSmall()
}



/**
 * builds up the widget
 *  
 * @param {number} daysRemaining - days remaining until start of race 
 * @param {string} backgroundImagePath - the background image
 * @param {object} race - the race data from the web service call
 * @param {object} raceData - the race data with timezone and color
 * @param {Date} raceDateAtDeviceLocation - the race data with timezone and color
*/
function createWidget(daysRemaining, backgroundImagePath, race, raceData, raceDateAtDeviceLocation ) {

  log("in create widget *********")
  log("daysRemaining " + daysRemaining)
  log("backgroundImagePath " + backgroundImagePath)

  let w = new ListWidget()
  
  // paddign between edge of widget and start of elements in the widget
  w.setPadding(4,4,4,4)
  w.backgroundColor = Color.black();

  // set background image
  // TODO - test if image is there
  const imageUrl = getImageUrl( backgroundImagePath );
  const image = Image.fromFile( imageUrl ); 
  w.backgroundImage = image
  
    
  // Color ideas https://github.com/yaylinda/scriptable

  // Other interesting fonts I tried
  // Futura 84
  // Futura Bold 72
  // Chalkboard SE 96
  // Avenir Book 96
  // Didot Bold 92

  // make the font smaller for 3-digit numbers
  let countDownTextFontSize = 92
  if( numberOfDigits( daysRemaining ) > 2 )
  {
    countDownTextFontSize = 72
  }

  // Top Stack for the big countdown number
  const topStack = w.addStack()
  topStack.setPadding(0,0,0,0)
  topStack.addSpacer()
  topStack.topAlignContent()

  // create and format the BIG count down number
  const countDownText = topStack.addText( daysRemaining.toString() )
  countDownText.font = new Font( "Futura PT Cond Bold", countDownTextFontSize )
  countDownText.textColor = Color.white()
  countDownText.shadowColor = Color.cyan()
  countDownText.shadowRadius = 3
  countDownText.centerAlignText()

  topStack.addSpacer()


  // Bottom Stack for location, country, date, time
  const bottomStack = w.addStack()
  bottomStack.setPadding(0,0,0,0)
  bottomStack.layoutHorizontally()
  bottomStack.bottomAlignContent()
  // bottomRows.addSpacer()

  // format the race location and date at the bottom of the widget
  const location = race.Circuit.Location.locality
  const country = race.Circuit.Location.country

  // column 1
  //                                       row1              row2 
  const locationText = bottomStack.addText( location + "\n" + country) 
  locationText.font = Font.boldSystemFont( 14 )
  locationText.textColor = Color.white()
  locationText.shadowColor = new Color( raceData.shadowColor )
  locationText.shadowRadius = 3
  locationText.textOpacity = 0.8
  locationText.leftAlignText()
  bottomStack.addSpacer()

  
  // format the race location and date at the bottom of the widget
  // help with the local: https://github.com/mzeryck/Weather-Cal/blob/main/weather-cal-code.js
  // date time format cheat sheet: https://devhints.io/wip/intl-datetime
  const month = new Intl.DateTimeFormat( this.locale, { month: 'short' }).format(raceDateAtDeviceLocation)
  const day = new Intl.DateTimeFormat( this.locale, { day: 'numeric' }).format(raceDateAtDeviceLocation)

  // column 2
  //                                    row1         row2 
  const dateText = bottomStack.addText( day + "\n" + month ) // + "\n" ) 
  dateText.font = Font.boldSystemFont( 14 )
  dateText.textColor = Color.white()

  dateText.shadowColor = new Color( raceData.shadowColor )
  dateText.shadowRadius = 3
  dateText.textOpacity = 0.8
  dateText.rightAlignText()

  return w
}


//-------------------------------------
// Widget Specific Helper Functions
//-------------------------------------

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
 * Static error widget
*/
function staticErrorWidget( row1, row2, row3) {

  let w = new ListWidget()

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






// /**
//  * Format Date for display
//  * 
//  * 
//  * @param {} date
//  */
// function formatDateForDisplay(date) {
//   return [
//     // date.getFullYear(),
//     date.getMonth() + 1,
//     date.getDate(),
//   ].join('/');
// }


/**
 * Returns the difference in days from now until the parameter future date
 *  
 * @param {String} dateStr - future date in parseable string format
*/
function calcDaysUntilDate( dateStr )
{
  // date of future event
  let futureDate = new Date( dateStr )
  
  // current date
  let now = new Date() 
  // only use date for calculation, erase time
  now.setHours( 0, 0, 0, 0 );
  
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


/**
 * Get Time Zone Name
 * 
 * This could have been solved through another webservice call
 * but I wanted to avoid having to register for another service
 * possible option: Ergast provides lat/long of race location -> could have been used to look up time zone
 * 
 * data sources:
 * http://ergast.com/api/f1/2022.json
 * https://time.is
 * https://flagcolor.com (in some cases I looked at the Jersey colors of the National Football teams)
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
      // To-Do throw an error somehow
  }  
  return data;
}

//-------------------------------------
// Date/Time Helper Functions
//-------------------------------------

/**
 * Calculates local start time at device location
 * 
 * @param {string} raceDateStr - date of race as string from web service
 * @param {string} raceTimeStr - time of race as string from web service
 * @param {string} raceTimezone - timezone of the location of the race
*/
function getLocalStartDateTime(raceDateStr,raceTimeStr,raceTimezone) {

  // calculate the timezone offset bewteen race location and GMT
  const raceDateAtLoc = new Date( raceDateStr )
  const raceLocTzOffset = getTimeZoneOffset( raceDateAtLoc, raceTimezone )

  // calculate the timezone offset bewteen the current device location and GMT
  const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localTzOffset = getTimeZoneOffset( raceDateAtLoc , localTimeZone )

  // calculate the difference between device location and race timezones in minutes
  const timeOffsetToRaceLoc = raceLocTzOffset - localTzOffset

  //adjust race date time by offset to get local start time
  const localStartTime = new Date( raceDateStr + "T" + raceTimeStr )
  // log( "local start time: " + localStartTime )

  // let lst = localStartTime.addMinutes( timeOffsetToRaceLoc )
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
  return -(lie - date) / 60 / 1000;
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
    //  console.error(`Could not load url: ${url}`)
    //  console.error(`error: ${JSON.stringify(error)}`)
    }
}
