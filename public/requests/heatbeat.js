const { app, BrowserWindow, remote } = require("electron");
const axios = require("axios");

//// SEND HEARTBEAT ////
function sendHeartbeat(commandLogId, commandStatus, commandMessage) {
  console.log(`Data: ${commandLogId}, ${commandStatus}, ${commandMessage}`);

  if (APP_DATA.enable_heartbeat) {
    console.log("Sending Heartbeat");
    try {
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
            command_log_id: commandLogId ? commandLogId : null,
            command_status: commandStatus ? commandStatus : null,
            command_message: commandMessage ? commandMessage : null,
          },
          {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          },
          {
            headers: {
              Authorization: `Token ${APP_DATA.auth_token}`,
            },
          }
        )
        .then(function (response) {
          APP_DATA.heartbeat_response = response.data;
          console.log(`HEARTBEAT RESPONSE ${response.data}`);
          console.log(`HEARTBEAT RESPONSE MESSAGE ${response.data?.message}`);
          global.mainWindow.webContents.send("webContents2Renderer", {
            type: "DATA",
            data: response.data,
          });
        })
        .catch(function (error) {
          APP_DATA.heartbeat_response = error;
          console.log(error.response.status);
          global.mainWindow.webContents.send("webContents2Renderer", {
            action: "EROR",
            data: error,
          });
        });
    } catch (e) {
      console.log("Main Error While sending Heartbeat" + e);
    }
  }
}

exports.sendHeartbeat = sendHeartbeat;
