const script = document.createElement("script");
script.type = "text/javascript";
script.src =
  "https://cdnjs.cloudflare.com/ajax/libs/across-tabs/1.3.1/across-tabs.min.js";

let callbacks = {};
let pollingCallbackState = {};
let pollingCallback = null;

var parent;

script.onload = () => {
  parent = new AcrossTabs.default.Parent(config);
};

document.body.appendChild(script);

var config = {
  removeClosedTabs: true,
  onHandshakeCallback: function (data) {
    let callback = callbacks[data.id];
    if (callback) {
      callback(true);
    } else {
      console.log("UnHandledHandshakeTab", data);
    }
  },
  onPollingCallback: function () {
    if (pollingCallback) {
      pollingCallback();
    }
  },
  onChildCommunication: function (data) {
    let callback = callbacks[data.id];
    if (callback) {
      callback(data.result, data.error);
    } else {
      console.log("UnHandledMessage", data);
    }
  },
};

async function isConnected(tabId) {
  let tabs = await parent.getAllTabs();
  return tabs.some((tab) => tab.id === tabId);
}

function connect(onConnect, onWebPackReady) {
  let tab = parent.openNewTab({
    url: "https://web.whatsapp.com/",
    windowName: "AcrossTab",
  });
  const tabId = tab.id;

  // console.log(callbacks)

  onConnect(tabId);
  onWebPackReady(tabId);
  // callbacks[tabId] = function (result) {
  //   delete callbacks[tabId];
  // };
  // callbacks["WebPackReady"] = function (result) {
  //   delete callbacks["webpack.ready"];
  // };
}

function dispose() {
  parent.closeAllTabs();
}

function evaluateJs(code, tryPromise) {
  var codeText = code;
  if (tryPromise) {
    codeText = `(async function() {
      const result = await ${code};
      return result;
    })()`;
  }

  let data = {
    code: codeText,
    isEvent: false,
  };

  console.log('Debugg evaluate json');
  return new Promise((resolve, reject) => {
    console.log('Promise result ' + resolve + ' reject ' + reject);
    parent.broadCastAll(data, (result, error) => {
      if (error) {
        console.log(error);
        reject('');
      } else {
        console.log(result);
        resolve(null);
      }
    });
  });
}


async function setEvent(eventName, callback) {
  const randomId = Math.random().toString(36).substring(2, 8);
  let data = {
    id: randomId,
    code: eventName,
    isEvent: true,
  };
  parent.broadCastAll(data);
  callbacks[randomId] = function (result, error) {
    callback(JSON.stringify(result));
  };
}

async function setTabConnectionListener(tabId, callback) {
  pollingCallback = async function () {
    let state = await isConnected(tabId);
    if (pollingCallbackState[tabId] !== state) {
      callback(state);
      pollingCallbackState[tabId] = state;
    }
  };
}

async function getQrCode() {
  // Get QrCode from flutter web
}
