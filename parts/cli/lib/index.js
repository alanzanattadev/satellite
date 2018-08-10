const vorpal = require("vorpal")();
const io = require("socket.io-client");
const path = require("path");
const fs = require("fs");
const yargs = require("yargs")
  .option("server", {
    alias: "s",
    default: "localhost"
  })
  .option("port", {
    alias: "p",
    default: 8000
  })
  .option("protocol", {
    default: "http"
  }).argv;
const { exec } = require("child_process");
const request = require("request");
const { URL } = require("url");

const chalk = vorpal.chalk;

console.log(chalk.cyan("initializeing CLI ..."));
const serverUri = `${yargs.protocol || "http"}://${yargs.server ||
  "localhost"}:${yargs.port || 8000}`;
console.log(chalk.cyan("connecting to satellite master..."));
const socket = io.connect(serverUri);

let commandsCache = [];

vorpal
  .command("load plugin <pluginPath>", "Load plugin onto satellite")
  .action(function(args, callback) {
    const pluginName = `${path.basename(args.pluginPath)}.zip`;
    const zipPath = path.resolve(
      process.cwd(),
      args.pluginPath.replace(/\/$/, "") + ".zip"
    );
    const relativeZipPath = path.relative(args.pluginPath, zipPath);
    exec(
      `zip -r ${relativeZipPath} ./`,
      { cwd: args.pluginPath },
      (err, stdout, stderr) => {
        if (err) {
          vorpal.log(chalk.red(err.toString()));
          callback();
        } else {
          vorpal.log(chalk.cyan(`Zip created at ${zipPath}`));
          request.post(
            {
              url: `${new URL("/plugins/load", serverUri)}`,
              formData: {
                // Pass a simple key-value pair
                pluginName: pluginName,
                // Pass data via Streams
                plugin: fs.createReadStream(zipPath)
              }
            },
            function optionalCallback(err, httpResponse, body) {
              if (err) {
                console.error(
                  chalk.red("Upload of plugin failed:" + err.toString())
                );
                callback();
              } else {
                if (
                  httpResponse.statusCode >= 200 &&
                  httpResponse.statusCode < 300
                ) {
                  vorpal.log(chalk.green("Upload of plugin successful"));
                } else {
                  vorpal.log(chalk.red("Upload of plugin failed: " + body));
                }
                callback();
              }
            }
          );
        }
      }
    );
  });

socket.on("cli-config", function({ commands = [] }, callback) {
  vorpal.log(chalk.cyan("receiving CLI config..."));
  commandsCache.forEach(command => command.remove());
  commandsCache = [];
  commands.forEach(command => {
    const c = vorpal
      .command(command.configuration, command.description)
      .action(function(args, callback) {
        socket.emit("command", {
          type: command.configuration,
          args: args
        });
        callback();
      });
    commandsCache.push(c);
  });

  vorpal.delimiter(chalk.magenta("satellite $ ")).show();
  vorpal.exec("help");
});

socket.on("connect", function() {
  vorpal.log(chalk.green(`Connected to ${serverUri}`));
});

socket.on("log", (log) => {
  vorpal.log(chalk.gray(log))
});

socket.on("connect_error", function() {
  vorpal.log(chalk.red(`Impossible to connect to ${serverUri}`));
});
