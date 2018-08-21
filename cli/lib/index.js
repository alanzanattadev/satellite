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
    default: 80
  })
  .option("protocol", {
    default: "http"
  }).argv;
const { exec } = require("child_process");
const request = require("request");
const { URL } = require("url");
const express = require("express");
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
const server = require("http").Server(app);

const chalk = vorpal.chalk;

console.log(chalk.cyan("initializeing CLI ..."));
const serverUri = `${yargs.protocol || "http"}://${yargs.server ||
  "localhost"}:${yargs.port}`;
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

vorpal.command("visualization", "Prepare visualization").action((args, callback) => {
  request.get({ url: `${new URL("/visu", serverUri)}` }, (err, http, body) => {
    if (err || http.statusCode >= 300) {
      vorpal.log(chalk.red("Visualization request failed:" + err));
      return callback();
    }
    console.log(body)
    const json = JSON.parse(body);
    const nodesWithDup = json.reduce((acc, elem) => {
      const node0 = elem._fields[elem._fieldLookup.a];
      const node1 = elem._fields[elem._fieldLookup.b];
      return acc.concat(
        [node0, node1].map(node => ({
          id: node.identity.low,
          labels: node.labels,
          properties: node.properties
        }))
      );
    }, []);
    const nodes = nodesWithDup.filter(
      (item, pos) => nodesWithDup.indexOf(item) == pos
    );

    const relationships = json.map(elem => {
      const relation = elem._fields[elem._fieldLookup.r];
      return {
        id: relation.identity.low,
        type: relation.type,
        startNode: relation.start.low,
        endNode: relation.end.low,
        properties: relation.properties
      };
    });

    app.get("/", (req, res) => {
      res.render("index", {
        data: { results: [{ data: [{ graph: { nodes, relationships } }] }] }
      });
    });
    vorpal.log(
      chalk.green("Visualization available at 'http://localhost:9123/' !")
    );
    return callback();
  });
});

vorpal
  .command("create meta profile <name>", "Create meta profile")
  .action((args, callback) => {
    socket.emit("meta-profile-create", args);
    callback();
  });

vorpal
  .command(
    "link meta profile <name> to <accountType> <targetString>",
    "Link meta profile to account"
  )
  .action((args, callback) => {
    socket.emit("meta-profile-link", args);
    callback();
  });

vorpal
  .command("remove meta profile <name>", "Remove meta profile")
  .action((args, callback) => {
    socket.emit("meta-profile-remove", args);
    callback();
  });

vorpal
  .command("search meta profile <name>", "Search meta profile")
  .action((args, callback) => {
    socket.emit("meta-profile-search", args);
    callback();
  });

vorpal
  .command("kubectl [args...]", "Launch a kubectl command")
  .action((args, callback) => {
    socket.emit("kubectl", { args: args || [] });
    callback();
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
  server.listen(9123);
});

socket.on("log", log => {
  vorpal.log(chalk.gray(`[${log.source}] ${log.message}`));
});

socket.on("connect_error", function() {
  vorpal.log(chalk.red(`Impossible to connect to ${serverUri}`));
});
