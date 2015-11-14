function doGet() {
// you only need to modify the next three lines of this code then publish web app
  var email = 'ReplaceMe'; //what you use to login to nest
  var password = 'ReplaceMe' //what you use to login to nest
  var sheetid = 'ReplaceMe';  //on your spreadsheet url its everything between /d/ <sheet id> /edit
  
/*  to publish web app just:
  1) Make sure the four variables are set above before you publish
  2) Click Publish --> Deploy as web app
  3) Describe the web app and save a new version
  4) Execute the app as: me (your google account)
  5) Who has access to the app: Anyone, even anonymous (this what allows the timebased() triggers to run as expected)
  6) Click Deploy
  7) Set your timebased() trigger to run getData() which just does a url fetch of this script and invokes doGet()
*/

  var login_auth = performLogin(email,password);
             
  var headers = {
    "Authorization" : 'Basic '+login_auth['access_token'],
    "X-nl-user-id"  : login_auth['userid'],
    "X-nl-protocol-version" : '1',
    'Accept-Language': 'en-us',
    'Connection'    : 'keep-alive',
    'Accept'        : '*/*',
  };
  
  var options = {
    'headers' : headers
  };
  
  var request=UrlFetchApp.fetch(login_auth['urls']['transport_url']+'/v2/mobile/user.'+login_auth['userid'], options);
  var result=JSON.parse(request.getContentText());
//  Logger.log(result);
 
  var structure_id = result['user'][login_auth['userid']]['structures'][0].split('.')[1]
  var device_id    = result['structure'][structure_id]['devices'][0].split('.')[1]
 
  var current_temp = ((result["shared"][device_id]["current_temperature"]*9)/5)+32; //converts current_temp to Fahrenheit
  var target_temp  = ((result["shared"][device_id]["target_temperature"]*9)/5)+32; //converts target_temp to Fahrenheit
  var humidity     = result["device"][device_id]["current_humidity"]/100; //converts humidity to percent
  var heater_state = result["shared"][device_id]["hvac_heater_state"];
  
  var device_id2    = result['structure'][structure_id]['devices'][1].split('.')[1]
 
  var current_temp2 = ((result["shared"][device_id2]["current_temperature"]*9)/5)+32; //converts current_temp to Fahrenheit
  var target_temp2  = ((result["shared"][device_id2]["target_temperature"]*9)/5)+32; //converts target_temp to Fahrenheit
  var humidity2     = result["device"][device_id2]["current_humidity"]/100; //converts humidity to percent
  var heater_state2 = result["shared"][device_id2]["hvac_heater_state"];
  
  var time = new Date();
  
  var ss = SpreadsheetApp.openById(sheetid);
  var sheet = ss.getSheets()[0];
 
  // Appends a new row with 3 columns to the bottom of the
  // spreadsheet containing the values in the array
  sheet.appendRow( [ "Dining Room", time, target_temp, current_temp, humidity, heater_state] ); //Device id 1
  sheet.appendRow( [ "MBR", time, target_temp2, current_temp2, humidity2, heater_state2] ); //Device id 2
  
  //email ifttt for ios alert
  var emailAddress = "trigger@recipe.ifttt.com"; //Setup ifttt mail trigger first
  var message = "DR :: Target " + target_temp + " Current " + current_temp + " Heating " + heater_state + " " + " || MBR :: Target " + target_temp2 + " Current " + current_temp2 + " Heating " + heater_state2;
  var subject = "Morning Nest Report :: " + time;
  MailApp.sendEmail({to: emailAddress, subject: subject, htmlBody: message});

}

function performLogin(email, password) {
  var payload = {
    "username" : email,
    "password" : password
  };
  
  var options = {
    "method"  : "post",
    "payload" : payload
  };
 
  var response = JSON.parse(UrlFetchApp.fetch('https://home.nest.com/user/login', options).getContentText());
  if ('error' in response) {
    throw "Invalid login credentials";
  }  
  return response
}

function getData(){  
  var url = ScriptApp.getService().getUrl();
  var response = UrlFetchApp.fetch(url);
}
