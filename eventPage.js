var blockedSites = [];

function timer()
{
  alert("Timer has been set");
}

//freezing code taken from https://www.sitepoint.com/lock-freeze-web-page-jquery/

/* 
listener for alarms
*/
chrome.alarms.onAlarm.addListener(function(alarm) {
  var curId = alarm.name;
  chrome.tabs.query({}, function (tabs) {
      var found = false;
      var tabnumber;
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id.toString() == curId.toString()){
                found = true;
                tabnumber = i;
            }
        }
        if (found == false){
            return;
        } 
        else {
            chrome.tabs.update(tabs[tabnumber].id, {selected: true});
        }
        chrome.tabs.query(
          {active: true, currentWindow: true},
          (tabs) => {
              chrome.scripting.executeScript(
                  {
                      target: { tabId: tabs[0].id},
                      files: ['inject.js']
                  }
              );
          });
  });
});

/*
creating an alarm
*/
var alarmClock = {
        setup: function(curId) {
             chrome.alarms.create(curId.toString(), {delayInMinutes: 1} );
        }
};

function doToggleAlarm(curUrl, curId) {
    alarmClock.setup(curId);
    chrome.alarms.getAll(function(alarms) {
       var hasAlarm = alarms.some(function(a) {
          chrome.tabs.query(
          {active: true, currentWindow: true},
          (tabs) => {
              chrome.scripting.executeScript(
                  {
                      target: { tabId: tabs[0].id},
                      func: timer,
                  }
              );
          });
       });
    });
}


/*
listeners for tab changes
*/
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) run(tab);
});

chrome.tabs.onActivated.addListener(info => {
  chrome.tabs.get(info.tabId, run);
});

const processingTabId = {};

function checkUrl(curUrl, curId) {
  var flag = false;
  chrome.storage.sync.get(["links"], function (linkarr) {
    try {
      for (var i=0; i<linkarr.links.length; i++)
      {
        var element = linkarr.links[i];
        if (curUrl.includes(element))
        {
          flag = true;
        }
      }
      if (flag)
      {
        doToggleAlarm(currentUrl, curId);
      }
    }
    catch (err) {
      console.log("nothing in options yet");
      return; 
    }
      
});
}

function run(tab) {
  if (processingTabId[tab.id]) return;
  processingTabId[tab.id] = true;
  if (tab.url) {
    let newUrl = new URL(tab.url);
    currentHost = newUrl.host;
    currentUrl = tab.url;
    currentId = tab.id;
    //console.log(currentUrl);
    checkUrl(currentUrl, currentId);
  }
}


