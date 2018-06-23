const app = require("express")();
const multer = require("multer");
const server = require("http").Server(app);
const io = require("socket.io")(server);
const fs = require("fs");
const path = require("path");
const yargs = require("yargs")
  .option("pluginsDestDir", {
    default: "./.plugins/"
  })
  .option("port", {
    alias: "p",
    default: 8000
  }).argv;
const chalk = require("chalk");
const { exec } = require("child_process");

const pluginsDestPath = path.resolve(yargs.pluginsDestDir);

function createPluginsDir(cb) {
  fs.mkdir(pluginsDestPath, 0755, function(err) {
    if (err) {
      if (err.code == "EEXIST") {
        console.log(chalk.green("Plugins folder already created"));
        cb(null);
      }
      // ignore the error if the folder already exists
      else {
        cb(err);
        console.error(
          chalk.red(
            "Impossible to create plugins dir",
            chalk.red(err.toString())
          )
        );
      } // something else went wrong
    } else {
      console.log(chalk.green("Plugins folder created at " + pluginsDestPath));
      cb(null);
    } // successfully created folder
  });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, pluginsDestPath);
  },
  filename: function(req, file, cb) {
    if (req.body.pluginName) cb(null, req.body.pluginName);
    else cb(new Error("Wrong pluginName field"));
  }
});

const upload = multer({ storage });

function isValidPluginName(pluginName) {
  return pluginName.split("").reduce((red, c) => {
    if (red === true) return /^[A-Z]|[a-z]|\-|\.$/.test(pluginName);
    else return red;
  }, true);
}

app.post("/plugins/load", upload.single("plugin"), (req, res) => {
  const pluginName = req.body.pluginName;
  const pluginPath = req.file.path;
  const unzippedPluginPath = path.join(
    pluginsDestPath,
    pluginName.replace(/\.[^/.]+$/, "")
  );
  if (isValidPluginName(pluginName)) {
    exec(
      `rm -rf ${unzippedPluginPath} && unzip ${pluginPath} -d ${unzippedPluginPath}`,
      (err, stdout, stderr) => {
        if (err) {
          console.log(
            chalk.red(`Failed to unzip ${pluginPath} at ${unzippedPluginPath}`)
          );
          console.log(chalk.red(err.toString()));
          res.status(500);
          res.end();
        } else {
          console.log(
            chalk.cyan(`Unzipped ${pluginName} at ${unzippedPluginPath}`)
          );
          res.send("Ok");
        }
      }
    );
  } else {
    res.status(500);
    res.write("Invalid plugin name => " + pluginName);
    res.end();
  }
});

createPluginsDir(err => {
  if (err == null) {
    server.listen(yargs.port);
    console.log(chalk.green(`Listening on port ${yargs.port}...`));
    io.on("connection", function(socket) {
      console.log(
        chalk.cyan(`Connected to client at ${socket.conn.remoteAddress}`)
      );
      socket.emit("cli-config", {
        commands: [
          {
            configuration: "sIf <profileName...>",
            description: "Search friends of profileName on Instagram"
          }
        ]
      });
      socket.on("command", function(data) {
        console.log(
          chalk.cyan(
            `Received command "${chalk.yellow(
              data.type
            )}" with args ${JSON.stringify(data.args)}`
          )
        );
      });
      socket.on("disconnect", function() {
        console.log(
          chalk.yellow(
            `Disconnected from client at ${socket.conn.remoteAddress}`
          )
        );
        io.emit("user disconnected");
      });
    });
  }
});
