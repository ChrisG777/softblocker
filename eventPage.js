function timer()
{
  alert("Timer has been set");
}

/*
helper function to check if any of the tabs have a certain id
*/
function checkIfContains (tabs, curId)
{
  flag = false;
  for (var i=0; i < tabs.length; i++)
  {
    if (tabs[i].id.toString() == curId)
    {
      flag = true;
      break;
    }
  }
  return flag;
} 


/* 
listener for alarms; calls the blocking script if an alarm goes off, and also sets up a new alarm
*/
chrome.alarms.onAlarm.addListener(function(alarm) {
  var curId = alarm.name;
  chrome.tabs.query({}, function (tabs) {
        var flag = false;
        var tabnumber;
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].id.toString() == curId.toString()){
                flag = true;
                tabnumber = i;
            }
        }
        if (flag == false){
            return;
        } 
        chrome.tabs.update(tabs[tabnumber].id, {selected: true});
        chrome.tabs.query(
          {active: true, currentWindow: true},
          (actualtabs) => {
              chrome.scripting.executeScript(
                  {
                      target: { tabId: actualtabs[0].id},
                      files: ['inject.js']
                  }
              );
              doToggleAlarm(tabs[tabnumber].id);
          });
  });
});

/*
creates alarm + notifies user that alarm has been created
*/
function doToggleAlarm(curId) {
    chrome.storage.sync.get(["timertime"], function (timer) {
      chrome.alarms.create(curId.toString(), {delayInMinutes: parseInt(timer.timertime)} );
    })
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
}


/*
listeners for tab changes
*/
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) run(tab);
});

chrome.tabs.onActivated.addListener(info => {
    chrome.tabs.query( {},
      (tabs) => {
        if (checkIfContains(tabs, info.tabId))
        {
          chrome.tabs.get(info.tabId, run);
        }
      }
      )
});

chrome.tabs.onCreated.addListener(function(tab) {
  setTimeout(function() {chrome.tabs.query( {},
      (tabs) => {
        if (checkIfContains(tabs, tab.id))
        {
          chrome.tabs.get(tab.id, run);
        }
      }
      );}, 5000);
})

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
        chrome.alarms.getAll(function (alarmarr){
          var flag2 = false;
          for (var i=0; i<alarmarr.length; i++)
          {
            if (alarmarr[i].name == curId.toString())
            {
              flag2 = true;
              break;
            }
          }
          if (!flag2)
          {
            doToggleAlarm(curId);
          }
        });
      }
    }
    catch (err) {
      //nothing in options yet
      return; 
    }
      
});
}

function run(tab) {
  if (typeof tab == 'undefined'){
    return;
  }
  if (processingTabId[tab.id]) return;
  processingTabId[tab.id] = true;
  if (tab.url) {
    let newUrl = new URL(tab.url);
    currentHost = newUrl.host;
    currentUrl = tab.url;
    currentId = tab.id;
    checkUrl(currentUrl, currentId);
  }
  setTimeout(function () {processingTabId[tab.id] = false;}, 1000);
}


