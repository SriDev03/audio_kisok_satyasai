const http_service = require("./protocol/http");
const { TCPHandler } = require("./protocol/tcp");
const { ipcMain } = require("electron");
var exec = require("child_process").exec;
const auto_update = require("./functions/auto_update");
const heartbeat = require("./requests/heatbeat");
const { Socket } = require("dgram");

video_commands = ["load", "run", "halt", "kill", "restart", "timestamp"];
system_commands = ["sleep", "shutdown", "new_asset"];

function sendToRenderer(message) {
  global.mainWindow.webContents.send("webContents2Renderer", message);
}

let timestamp = 0 + " " + 0 + " " + "halt";
// let timestamp;
let port;
let ip;

ipcMain.handle("timestamp", (event, arg) => {
  timestamp = arg;
});

function sendToApp(command, commandLogId, commandFiles, mode) {
  if (video_commands.includes(command)) {
    console.log("Received via " + mode + ":" + command);
    sendToRenderer(command);
  }

  if (command.startsWith("new_asset")) {
    if (command.split(" ").length < 2) {
      console.log("URL missing");
      sendToNetwork("Asset URL Missing", mode);
    } else {
      http_service.download_asset(command.split(" ")[1], ".");
    }
  }
  if (system_commands.includes(command)) {
    console.log("Received :" + command);
    sendToRenderer(command);
  }

  switch (command) {
    case "tcp_logging":
      // [TODO] Impletation not done
      APP_DATA.log_over_tcp = !APP_DATA.log_over_tcp;
      break;
    case "debug":
      // [TODO] Impletation not done
      APP_DATA.debug = !APP_DATA.debug;
      break;
    case "ip":
      tcp.TCPHandler.sendMessage(APP_DATA.system_ip);
      break;
    case "mac":
      tcp.TCPHandler.sendMessage(APP_DATA.mac_address);
      break;
    case "app_data":
      tcp.TCPHandler.sendMessage(JSON.stringify(APP_DATA));
      break;
    case "timestamp":
      tcp.TCPHandler.sendMessageOnce(timestamp, commandFiles, commandLogId);
      // Socket.write("hello");
      // console.log(timestamp, commandFiles, commandLogId);
      break;
    case "shutdown":
      exec("shutdown now", function (error, stdout, stderr) {
        tcp.TCPHandler.sendMessage(stdout);
      });
      break;
    case "update_content":
      // [TODO] Impelment for windows & linux
      // var spawn = require("child_process").spawn,
      //   ls = spawn(
      //     "wget " +
      //       APP_DATA.api_root_protocol +
      //       "://" +
      //       APP_DATA.api_root +
      //       "" +
      //       APP_DATA.video_uri +
      //       " -O " +
      //       APP_DATA.home_dir +
      //       "/01.mp4",
      //     []
      //   );

      // ls.stdout.on("data", function (data) {
      //   console.log("stdout: " + data.toString());
      // });

      // ls.stderr.on("data", function (data) {
      //   console.log("stderr: " + data.toString());
      // });

      // ls.on("exit", function (code) {
      //   console.log("child process exited with code " + code.toString());
      // });
      var proc = exec(
        "wget " +
          APP_DATA.api_root_protocol +
          "://" +
          APP_DATA.api_root +
          "" +
          APP_DATA.video_uri +
          " -O " +
          APP_DATA.home_dir +
          "/01.mp4",
        function (error, stdout, stderr) {
          console.log(stdout, stderr);
          tcp.TCPHandler.sendMessage(stdout);
        }
      );
      proc.stdout.on("data", function (data) {
        console.log(data);
      });
      break;
    case "reboot":
      exec("shutdown -r now", function (error, stdout, stderr) {
        tcp.TCPHandler.sendMessage(stdout);
      });
      break;
    case "SOFTWARE_UPDATE":
      commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;
      // commandLogId
      //   ? heartbeat.sendHeartbeat(
      //       commandLogId,
      //       "ACKNOWLEDGED",
      //       "Recived tcp request for software update."
      //     )
      //   : null;

      auto_update.appUpdate(
        APP_DATA.api_root_protocol,
        APP_DATA.api_root,
        APP_DATA.software_uri,
        APP_DATA.mac_address,
        commandLogId
      );

      break;
    case "ADD_CONTENT":
      commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;
      // io.addContent(commandLogId, commandFiles);

      break;
    case "DELETE_CONTENT":
      commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;

      break;
    case "SORT_CONTENT":
      commandLogId ? tcp.TCPHandler.sendMessage(commandLogId) : null;

      break;
    default:
      console.log(command);
      break;
  }
}

function sendToNetwork(message, method) {
  if (method == "TCP") {
    console.log("Received :" + message);
    sendToRenderer(message);
  }
}

exports.sendToApp = sendToApp;
exports.sendToNetwork = sendToNetwork;
