// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const os = require("os");
const tcp = require("./protocol/tcp");
const udp = require("./protocol/udp");
var ip = require("ip");
const fs = require("fs");
const https = require("https");
const mac_interface = require("getmac");
const osInfo = require("@felipebutcher/node-os-info");
const axios = require("axios");
const { Console } = require("console");
const isDev = require("electron-is-dev");
const { exec } = require("child_process");

// File imports
var pjson = require("../package.json");
const auto_update = require("./functions/auto_update");

const dbFilename = "applicationStorage.db";
// Initialise Persistent Database
var Datastore = require("newdb"),
  db = new Datastore({ filename: dbFilename, autoload: true });

//Initialse app directory
const user_info = os.userInfo();

let APP_DATA = {
  app_version: "0.0",
  api_root_protocol: "https",
  api_root: "192.168.1.113",
  heartbeat_api_endpoint: "/heartbeat/",
  registration_api_endpoint: "/node_register/",
  video_uri: "/static/exhibits/01.mp4",
  content_uri: "/media/content/",
  software_uri: "/media/software/",
  enable_heartbeat: false,
  enable_registration: true,
  tcp_port: 2626,
  udp_port: 2625,
  system_ip: "X.X.X.X",
  mac_address: "00:00:00:00:00:00",
  heartbeat_response: null,
  auth_token: "XXXX",
  system_vitals: {
    cpu_usage: 0,
    ram_usage: 0,
    disk_usage: 0,
    ip: "X.X.X.X",
    temprature: 0,
    uptime: 0,
  },
  log_over_tcp: false,
  home_dir: user_info.homedir,
};

// Initialise IP address
try {
  APP_DATA.system_vitals.ip = ip.address();
  APP_DATA.system_ip = ip.address();
  console.log("IP Assigned: " + APP_DATA.system_ip);
} catch (e) {
  console.log("Error: IP Address Not found" + e);
}
// Initialise MAC address
try {
  APP_DATA.mac_address = mac_interface.default();

  console.log("Mac address: " + mac_interface.default());
} catch (error) {
  console.log("Error: MAC Not found" + error);
}

process.env.ENVIRONMENT = "DEBUG";
mainWindow = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require("electron-squirrel-startup")) {
  app.quit();
}

// function createWindow() {
//   // Create the browser window.
//   const win = new BrowserWindow({
//     fullscreen: true,
//     alwaysOnTop: true,
//     autoHideMenuBar: true,
//     webPreferences: {
//       nodeIntegration: true,
//     },
//   });

//   // and load the index.html of the app.
//   // win.loadFile("index.html");
//   win.loadURL(
//     isDev
//       ? "http://localhost:3000"
//       : `file://${path.join(__dirname, "../build/index.html")}`
//   );

//   // Open the DevTools.
//   if (isDev) {
//     win.webContents.openDevTools({ mode: "detach" });
//   }
// }

ipcMain.handle("broadcast", async (event, message) => {
  tcp.TCPHandler.sendMessage(message);
  return "ok";
});

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    resizable: process.env.ENVIRONMENT == "DEBUG" ? true : false,
    closable: process.env.ENVIRONMENT == "DEBUG" ? true : false,
    alwaysOnTop: true,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  mainWindow.setFullScreen(true);

  // and load the index.html of the app.
  // mainWindow.loadFile("index.html");

  try {
    console.log(path.join(__dirname, "unclutter"));
    executeCommand(path.join(__dirname, "unclutter") + " -idle 10 ");
  } catch (e) {
    console.log(e);
  }

  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send(
      "webContents2Renderer",
      'Browser "did-finish-load"'
    );
  });

  // START TCP SERVER
  tcp.TCPHandler.startTCPServer("0.0.0.0", APP_DATA.tcp_port);

  mainWindow.webContents.send(
    "webContents2Renderer",
    JSON.stringify({ action: "System IP", data: APP_DATA.system_ip })
  );

  //Check for exiting Token in the app
  db.find({}, function (err, doc) {
    console.log(err, doc);
    if (doc.length == 1) {
      APP_DATA.device_token = doc[0].success.device_token;
      APP_DATA.enable_heartbeat = true;
      APP_DATA.auth_token = doc[0].success.auth_token;
      console.log("Device Token found starting Heartbeat");
    } else if (doc.length == 0) {
      console.log("Device not registered yet!");
      // START REGISTRATION LOOP
      startRegistration();
    } else {
      console.log("Unablle to Raad Database file");
      mainWindow.webContents.send(
        "webContents2Renderer",
        JSON.stringify({
          action: "Critical Error",
          data: "More than one entry in Database",
        })
      );
    }
  });

  global.mainWindow = mainWindow;
  global.tcp = tcp;
  global.APP_DATA = APP_DATA;

  process.on("uncaughtException", function (err) {
    console.log(err);
    console.log("Something terrible happened");

    mainWindow.webContents.send("webContents2Renderer", {
      type: "ERROR",
      data: err,
    });
  });

  //const win = mainWindow.getFocusedWindow();

  mainWindow.webContents.on("before-input-event", (event, input) => {
    console.log(input);
    if (input.key == "d" || input.key == "D") {
      // mainWindow.loadFile("heartbeat.html");
      mainWindow.loadURL(
        isDev
          ? "http://localhost:3000"
          : `file://${path.join(__dirname, "../build/index.html")}`
      );
    }
    if (input.key == "m" || input.key == "M") {
      // mainWindow.loadFile("index.html");
      mainWindow.loadURL(
        isDev
          ? "http://localhost:3000"
          : `file://${path.join(__dirname, "../build/index.html")}`
      );
    }
  });
}

ipcMain.on("renderer2main", (event, arg) => {
  console.log(arg); // prints "ping"
  event.reply("main2renderer", "main2renderer");
  tcp.TCPHandler.sendMessage(arg);
  //console.log(tcp.TCPHandler.sendMessage(arg));
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  APP_DATA.app_version = app.getVersion();
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("ready", () => {
  // Initialise IP address
  try {
    APP_DATA.system_vitals.ip = ip.address();
    APP_DATA.system_ip = ip.address();
    console.log("IP Assigned: " + APP_DATA.system_ip);
  } catch (e) {
    console.log("Error: IP Address Not found" + e);
  }
  // Initialise MAC address
  try {
    APP_DATA.mac_address = mac_interface.default();

    console.log("Mac address: " + mac_interface.default());
  } catch (error) {
    console.log("Error: MAC Not found" + error);
  }

  auto_update.appUpdate(
    APP_DATA.api_root_protocol,
    APP_DATA.api_root,
    APP_DATA.software_uri,
    APP_DATA.mac_address
  );
});

app.on("window-all-closed", function () {
  tcp.TCPHandler.closeTCPServer();
  if (process.platform !== "darwin") app.quit();
});

const executeCommand = (cmd, successCallback, errorCallback) => {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      // console.log(`error: ${error.message}`);
      if (errorCallback) {
        errorCallback(error.message);
      }
      return;
    }
    if (stderr) {
      //console.log(`stderr: ${stderr}`);
      if (errorCallback) {
        errorCallback(stderr);
      }
      return;
    }
    //console.log(`stdout: ${stdout}`);
    if (successCallback) {
      successCallback(stdout);
    }
  });
};

let svg = "";

// Print Name
// ipcMain.on("timestamp", (even, arg) => {
//   console.log(arg);
// });

ipcMain.on("printName", (event, arg) => {
  const { nameSvg, noteSvg } = arg;
  console.log(nameSvg);
  console.log(noteSvg);
  var nameCommand = "axicli nameSVG.svg";
  var noteCommand = "axicli " + noteSvg;
  var nameTextSVG = arg?.nameSvg;

  svg += '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
  svg +=
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
  svg +=
    '<svg  width="297mm" height="210mm" xmlns="http://www.w3.org/2000/svg">\n';

  svg += `<text x="170" y="185" font-size="32px" font-weight="lighter" font-family="Arial, Helvetica, cursive" >${nameTextSVG}</text>\n`;
  svg += "</svg>";

  console.log("SVG text created");

  // fs.unlinkSync("tempSVG.svg", function (err) {
  //   if (err) {
  //     console.log(err);
  //   }
  //   console.log("tempSVG deleted!");
  // });

  fs.writeFile("tempSVG.svg", svg, (err) => {
    // throws an error, you could also catch it here
    if (err) throw console.log("error: " + err);

    // success case, the file was saved
    console.log("tempSVG written!");

    svg = "";

    try {
      console.log("Exec entry point");
      exec(
        "inkscape --export-filename=nameSVG.svg --export-text-to-path tempSVG.svg",
        function (error, data, getter) {
          console.log("Error", error);
          console.log("Data", data);
          console.log("Getter", getter);
          if (error) {
            console.log("error", error.message);
            return;
          }
          if (data) {
            console.log("data", data);
            return;
          }

          exec(nameCommand, (error, data, getter) => {
            if (error) {
              console.log("error", error.message);
              return;
            }
            if (getter) {
              console.log("data getter 2", data);
            }
            console.log("data ji", data);
            exec(noteCommand, (error, data, getter) => {
              if (error) {
                console.log("error", error.message);
                return;
              }
              if (getter) {
                console.log("data getter 3", data);
                return;
              }
              console.log("data", data);
              event.sender.send("notePrinted");
            });
          });
        }
      );
    } catch (error) {
      console.log(error);
    }
  });
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/////////////////////////////////////////////////////////////////
/////////////////////////SEND HEARTBEAT//////////////////////////
/////////////////////////////////////////////////////////////////

setInterval(function () {
  // Send Heartbeat Signal if enabled
  if (APP_DATA.enable_heartbeat) {
    console.log("Sending Heartbeat");
    try {
      osInfo.mem((memory) => {
        APP_DATA.system_vitals.ram_usage = Math.round(memory * 100);
      });

      osInfo.cpu((cpu) => {
        APP_DATA.system_vitals.cpu_usage = Math.round(cpu * 100);
      });

      osInfo.disk((disk) => {
        APP_DATA.system_vitals.disk_usage = Math.round(disk * 100);
      });

      APP_DATA.system_vitals.uptime = os.uptime();

      axios
        .post(
          APP_DATA.api_root_protocol +
            "://" +
            APP_DATA.api_root +
            "" +
            APP_DATA.heartbeat_api_endpoint,
          {
            disc_space_usage: APP_DATA.system_vitals.disk_usage,
            cpu_usage: APP_DATA.system_vitals.cpu_usage,
            ram_usage: APP_DATA.system_vitals.ram_usage,
            temparature: APP_DATA.system_vitals.temprature,
            uptime: APP_DATA.system_vitals.uptime,
            version: APP_DATA.app_version,
          },
          {
            headers: {
              Authorization: `Token ${APP_DATA.auth_token}`,
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          }
        )
        .then(function (response) {
          APP_DATA.heartbeat_response = response.data;
          console.log(response.data);
          global.mainWindow.webContents.send("webContents2Renderer", {
            type: "DATA",
            data: response.data,
          });

          //
        })
        .catch(function (error) {
          APP_DATA.heartbeat_response = error;
          console.log(
            "/////////////////////////////////////////////////////////////////"
          );
          console.log(error.response.status);

          global.mainWindow.webContents.send("webContents2Renderer", {
            action: "EROR",
            data: error,
          });
          // [TODO]: Implememt Uanuthorised, DELETE DATABASE & START REGISTRATION AGAIN
          if (error.response.status == 401) {
            try {
              fs.unlinkSync(dbFilename);
              APP_DATA.enable_heartbeat = false;
              APP_DATA.enable_registration = true;
              global.mainWindow.webContents.send("webContents2Renderer", {
                action: "DATA",
                data: "Uanuthorised, resetting the application.",
              });
              startRegistration();
              //file removed
            } catch (err) {
              console.error(err);
              global.mainWindow.webContents.send("webContents2Renderer", {
                action: "EROR",
                data: "Unable to delete Database file",
              });
            }
          }
        });
    } catch (e) {
      console.log("main Error While sending Heartbeat" + e);
    }
  }
}, 10000);

/////////////////////////////////////////////////////////////////
/////////////////////////SEND REGISTRATION///////////////////////
/////////////////////////////////////////////////////////////////

function startRegistration(params) {
  // mainWindow.loadFile("heartbeat.html");
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // One time Registration code to be used while initialising
  UNIQUE_REG_CODE = Math.floor(Math.random() * 90000) + 10000;

  // DEVICE token  to be used for encrypting messages over TCP
  DEVICE_TOKEN = Math.floor(Math.random() * 90000) + 10000;

  global.mainWindow.webContents.send(
    "webContents2Renderer",
    "REG_INIT:" + UNIQUE_REG_CODE
  );

  setInterval(function () {
    // Send Registration Signal if enabled
    if (APP_DATA.enable_registration) {
      try {
        // Initialise IP address
        try {
          APP_DATA.system_ip = ip.address();
          console.log("IP Assigned: " + APP_DATA.system_ip);
        } catch (e) {
          console.log("Error: IP Address Not found" + e);
        }
        // Initialise MAC address
        try {
          APP_DATA.mac_address = mac_interface.default();

          console.log("Mac address: " + mac_interface.default());
        } catch (error) {
          console.log("Error: MAC Not found" + error);
        }

        global.mainWindow.webContents.send(
          "webContents2Renderer",
          "sending REGISTARTION to:" +
            APP_DATA.api_root_protocol +
            "://" +
            APP_DATA.api_root +
            "" +
            APP_DATA.registration_api_endpoint
        );

        axios
          .post(
            APP_DATA.api_root_protocol +
              "://" +
              APP_DATA.api_root +
              "" +
              APP_DATA.registration_api_endpoint,
            {
              name: UNIQUE_REG_CODE,
              node_name: "Node Name: " + UNIQUE_REG_CODE,
              description: pjson.description,
              mac_addr: APP_DATA.mac_address,
              ip: APP_DATA.system_ip,
              port: APP_DATA.tcp_port,
              unique_reg_code: UNIQUE_REG_CODE,
              os_type: os.type(),
              os_name: os.platform(),
              os_arch: os.arch(),
              // total_disc_space: "12GB",
              // total_cpu: "2CPV",
              // total_ram: "14GB",
              // temprature: "24",
              version: APP_DATA.app_version,
              // content_metadata: "test",
              // pem_file: "test",
            },
            {
              httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            }
          )
          .then(function (response) {
            APP_DATA.heartbeat_response = response.data;
            console.log(response.data);
            global.mainWindow.webContents.send(
              "webContents2Renderer",
              response.data
            );

            if (!response.data.error) {
              if (response.data.success.status == "REG_APPROVED") {
                // Insert Token in Database
                db.insert(response.data, function (err, newDoc) {
                  if (err) {
                    console.log("Error occured while saving TOKEN");
                  } else {
                    APP_DATA.enable_heartbeat = true;
                    APP_DATA.enable_registration = false;
                    APP_DATA.auth_token = response.data.success.auth_token;
                    APP_DATA.device_token = response.data.success.device_token;
                    // mainWindow.loadFile("index.html");
                    mainWindow.loadURL(
                      isDev
                        ? "http://localhost:3000"
                        : `file://${path.join(
                            __dirname,
                            "../build/index.html"
                          )}`
                    );
                  }
                });
              } else if (response.data.success.status == "REG_COMPLETE") {
                console.log(response.data.message);
                mainWindow.webContents.send("webContents2Renderer", {
                  type: "DATA",
                  action: "REG_COMPLETE",
                  data: {
                    unique_reg_code: UNIQUE_REG_CODE,
                    message: response.data.message,
                  },
                });
              } else if (response.data.message.success.status == "REG_INIT") {
                console.log(response.data.message.message);
                mainWindow.webContents.send("webContents2Renderer", {
                  type: "DATA",
                  action: "REG_INIT",
                  data: {
                    unique_reg_code: UNIQUE_REG_CODE,
                    message: response.data.message,
                  },
                });
              }
            }
          })
          .catch(function (error) {
            // TODO Handle the error properly,
            //  - MMS  unreachable
            // - Reponse from API
            APP_DATA.heartbeat_response = error;
            console.log(error);
            mainWindow.webContents.send("webContents2Renderer", {
              type: "EROR",
              data: error,
            });
          });
      } catch (e) {
        console.log("main Error While sending REGISTARTION" + e);
      }
    }
  }, 3000);
}
