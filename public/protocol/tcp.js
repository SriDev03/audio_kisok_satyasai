const net = require("net");
const comHandler = require("../communicator");
var shell = require("shelljs");
// const { exec } = require("child_process");

TCPHandler = {
  server: null,
  sockets: [],
  startTCPServer: function (host, port) {
    // Kill the process that has occupied the TCP PORT

    console.log("shell.config.execPath", shell.config.execPath); // return null
    shell.config.execPath = shell.which("nodejs");
    console.log("shell.config.execPath", shell.config.execPath); // return null

    var killCommand = `kill -9 $(lsof -i tcp:${port} | awk 'NR==2 {print $2}')`;

    try {
      // exec(killCommand, (error, data, getter) => {
      //   if (error) {
      //     console.log("Kill Command error", error.message);
      //     return;
      //   }
      //   if (getter) {
      //     console.log("Kill data getter:", data);
      //     return;
      //   }
      //   console.log("Kill data", data);
      // });
      shell.exec("ls");
      // shell.exec(killCommand);
    } catch (e) {
      console.log(
        "startTCPServer Kill Already running TCP: AN ERROR HAS OCCURED!"
      );
      console.log("startTCPServer kill Already running TCP:" + e);
    }

    try {
      TCPHandler.server = net.createServer();
      TCPHandler.server.listen(port, host, () => {
        console.log(
          "startTCPServer: TCP Server is listening on " +
            host +
            ":" +
            port +
            "."
        );
      });
    } catch (e) {
      console.log("startTCPServer onCreateServer: AN ERROR HAS OCCURED!");
      console.log("startTCPServer onCreateServer:" + e);
    }

    try {
      TCPHandler.server.on("connection", function (sock) {
        console.log(
          "startTCPServer: CONNECTED: " +
            sock.remoteAddress +
            ":" +
            sock.remotePort
        );
        TCPHandler.sockets.push(sock);

        sock.on("data", function (data) {
          console.log(
            "startTCPServer: DATA " + sock.remoteAddress + ": " + data
          );
          const dataArr = data.toString().split(" ");

          const command = dataArr[0];
          let commandLogId = dataArr[1];
          let commandFiles = dataArr[2];

          if (command == "timestamp") {
            commandLogId = sock.remotePort;
            commandFiles = sock.remoteAddress;
            console.log(
              "command:" +
                command +
                ", commandLogId:" +
                (commandLogId ? commandLogId : "") +
                ", commandFiles:" +
                (commandFiles ? commandFiles : "")
            );
          }

          console.log(
            "command:" +
              command +
              ", commandLogId:" +
              (commandLogId ? commandLogId : "") +
              ", commandFiles:" +
              (commandFiles ? commandFiles : "")
          );

          // Send data to communcator for parsing & execution
          comHandler.sendToApp(command, commandLogId, commandFiles, "TCP");
        });

        TCPHandler.server.once("error", function (err) {
          console.log(err);
          if (err.code === "EADDRINUSE") {
            console.log(
              "startTCPServer:  port is currently in use - EADDRINUSE"
            );
          }
        });

        // Add a 'close' event handler to this instance of socket
        sock.on("close", function (data) {
          let index = TCPHandler.sockets.findIndex(function (o) {
            return (
              o.remoteAddress === sock.remoteAddress &&
              o.remotePort === sock.remotePort
            );
          });
          if (index !== -1) TCPHandler.sockets.splice(index, 1);
          console.log(
            "startTCPServer: CLOSED removing socket from scoket array: " +
              sock.remoteAddress +
              " " +
              sock.remotePort
          );
        });
      });
    } catch (e) {
      console.log(
        "startTCPServer onConnection listener: AN ERROR HAS OCCURED!"
      );
      console.log("startTCPServer onConnection listener:" + e);
    }
  },
  closeTCPServer: function () {
    try {
      TCPHandler.server.close();
      console.log("closeTCPServer TCP Server Closed");
    } catch (e) {
      console.log("closeTCPServer " + e);
    }
  },
  sendMessage: function (message) {
    TCPHandler.sockets.forEach(function (sock, index, array) {
      try {
        console.log(
          "Sending to " +
            sock.remoteAddress +
            ":" +
            sock.remotePort +
            " said " +
            message +
            "\n"
        );
        sock.write(message);
      } catch (e) {
        console.log("tcp sendMessage: While sending reply to the client " + e);

        //  If the client dropped the socket connection non--gracefully, remove the scoket from the socket array
        let index = TCPHandler.sockets.findIndex(function (o) {
          return (
            o.remoteAddress === sock.remoteAddress &&
            o.remotePort === sock.remotePort
          );
        });
        if (index !== -1) TCPHandler.sockets.splice(index, 1);
        console.log(
          "sendMessage: Forefully Closing for : " +
            sock.remoteAddress +
            " " +
            sock.remotePort
        );
      }
    });
  },
  sendMessageOnce: function (message, ip, port) {
    let sock = TCPHandler.sockets.find(
      (sock, index) => sock.remoteAddress == ip && sock.remotePort == port
    );
    console.log(sock);
    if (sock != undefined) {
      try {
        console.log(
          "Sending to " +
            sock.remoteAddress +
            ":" +
            sock.remotePort +
            " said " +
            message +
            "\n"
        );
        sock.write(message);
      } catch (e) {
        console.log("tcp sendMessage: While sending reply to the client " + e);

        //  If the client dropped the socket connection non--gracefully, remove the scoket from the socket array
        let index = TCPHandler.sockets.findIndex(function (o) {
          return (
            o.remoteAddress === sock.remoteAddress &&
            o.remotePort === sock.remotePort
          );
        });
        if (index !== -1) TCPHandler.sockets.splice(index, 1);
        console.log(
          "sendMessage: Forefully Closing for : " +
            sock.remoteAddress +
            " " +
            sock.remotePort
        );
      }
    }
  },
};

exports.TCPHandler = TCPHandler;
