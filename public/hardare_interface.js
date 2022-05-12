var os = require("os");
var network = require("network");
const osInfo = require("@felipebutcher/node-os-info");

registration_pauyload = {
  mac_addr: "989DDF878-DFDFD787878",
  ip: "127.0.0.0",
  port: "8080",
  unique_reg_code: "12232",
  os_type: os.type(),
  os_name: os.platform(),
  os_arch: os.arch(),
  multicast_ip: "192.168.10.0",
  multicast_port: "8080",
  avail_disc_space: "12GB",
  avail_cpu: "2CPV",
  avail_ram: "14GB",
  temprature: "24",
  file_array: "",
  device_token: "121223SDSD",
  version: "4",
};

//  system_vitals = {
//     "cpu_usage":0,
//     "ram_usage":0,
//     "disk_usage":0
// }

// osInfo.mem(memory => {
//     system_vitals.ram_usage = Math.round(memory * 100)
// });

// osInfo.cpu(cpu => {
//     system_vitals.cpu_usage = Math.round(cpu * 100)
// });

// osInfo.disk(disk => {
//     system_vitals.disk_usage = Math.round(disk * 100)
// });

// console.log(system_vitals)

// top -l 1 | grep -E "^CPU|^Phys"  (( Command Line utility to get CPU & RAM Usage))
function getSystemVitals() {
  var mbTotal = os.totalmem() / 1048576;
  var mbFree = os.freemem() / 1048576;
  console.log(
    "OS :" + os.type() + " Platform: " + os.platform() + "OS arch: " + os.arch()
  );
  console.log(
    "There are " +
      mbFree +
      "mb free in the memory of " +
      mbTotal +
      "mb in total"
  );
  console.log(os.cpus());
  return { avail_ram: mbFree };
}

function getHarwareSpec() {
  network.get_private_ip(function (err, ip) {
    if (!err) {
      system_vitals.ip = ip;
      console.log(ip); // err may be 'No active network interface found'.
    } else {
      console.log("Error: " + err);
    }
  });

  try {
    network.get_active_interface(function (err, obj) {
      if (!err) {
        console.log(obj); // err may be 'No active network interface found'.
      } else {
        console.log("Error: " + err);
      }
    });
  } catch (e) {
    console.log("main: AN ERROR HAS OCCURED!");
    console.log("main:" + e);
  }
}

exports.system_vitals = this.system_vitals;
