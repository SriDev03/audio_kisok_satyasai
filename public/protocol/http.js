const axios = require("axios");
const { app, BrowserWindow } = require("electron");
const DownloadManager = require("electron-download-manager");
const { system_vitals } = require("../hardare_interface");
const osInfo = require("@felipebutcher/node-os-info");

DownloadManager.register({
  downloadFolder: app.getAppPath(),
});

// setInterval(function(){
//   console.log(system_vitals)
//   // axios.post('http://192.168.1.11/heartbeat/', {"cpu":{"space":system_vitals["disk_usage"], "ram":40, "usage":"40", "temprature":80},"ip":"192.168.1.62", "auth":{
//   //   "key":1234}})
//   //   .then(function (response) {
//   //     console.log(response.data);
//   //   })
//   //   .catch(function (error) {
//   //     console.log(error);
//   //   });
// },3000)

// new_asset https://tagbin.in/assets/images/logo/logo.png
function download_asset(url, path) {
  try {
    DownloadManager.download(
      {
        url: url,
      },
      function (error, info) {
        if (error) {
          console.log(error);
          return;
        }
        // When the asset is downloaded, reload the window
        BrowserWindow.getAllWindows()[0].send("webContents2Renderer", "load");
        console.log("DONE: " + info.url);
      }
    );
  } catch (e) {
    console.log("httpService Download mander ERROR:" + e);
  }
}

exports.download_asset = download_asset;
