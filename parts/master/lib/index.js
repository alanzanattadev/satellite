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
  .option("loadPluginsDir", {
    default: null
  })
  .option("deploymentFilesDest", {
    default: "/tmp/"
  })
  .option("port", {
    alias: "p",
    default: 8000
  }).argv;
const chalk = require("chalk");
const { exec, spawn } = require("child_process");
const yaml = require("js-yaml");
const EventEmitter = require("events");
const Kafka = require("node-rdkafka");
const template = require("swig");
const guid = require("uuid/v4");

template.setDefaults({ cache: false });

const pluginsDestPath = path.resolve(yargs.pluginsDestDir);

const KUBECTL_BIN = process.env.KUBECTL_BIN || "kubectl";

function createPluginsDir(cb) {
  fs.mkdir(pluginsDestPath, 0o755, function(err) {
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

const pluginList = {
  list: {},
  addPlugin(pluginName, commands) {
    this.list = { ...this.list, [pluginName]: { commands } };
    this.emitter.emit("new plugin", { plugins: this.list });
  },
  getCommands() {
    return Object.keys(this.list).reduce(
      (red, pluginName) => [...red, ...this.list[pluginName].commands],
      []
    );
  },
  emitter: new EventEmitter()
};

function loadPlugin(pluginPath, pluginName) {
  return new Promise((resolve, reject) => {
    const configPath = path.join(pluginPath, "features", "cli", "config.yml");
    try {
      const pluginConfig = yaml.safeLoad(
        fs.readFileSync(`${configPath}`, "utf8")
      );
      pluginList.addPlugin(
        pluginName,
        pluginConfig.map(c => ({
          ...c,
          ["kubernetes-file"]: path.join(
            pluginPath,
            "features",
            "deployments",
            c["kubernetes-file"]
          )
        }))
      );
      console.log(chalk.cyan(`Loaded plugin ${pluginName}`));
      resolve();
    } catch (e) {
      console.log(
        chalk.red("Impossible to read CLI config: "),
        chalk.red(e.toString())
      );
      reject("Impossible to load CLI config at " + configPath);
    }
  });
}

if (yargs.loadPluginsDir != null) {
  const resolvedPath = path.resolve(process.cwd(), yargs.loadPluginsDir);
  fs.readdir(resolvedPath, (err, files) => {
    if (err) {
      console.log(
        "Impossible to read default plugins directory:\n",
        chalk.red(err.toString())
      );
    } else {
      files.forEach(file => {
        const dirPath = path.join(resolvedPath, file);
        fs.stat(dirPath, (err, stats) => {
          if (err) {
            console.log(
              `Impossible to read plugin directory ${dirPath}:\n`,
              chalk.red(err.toString())
            );
          } else {
            if (stats.isDirectory()) {
              loadPlugin(dirPath, file).then(() => {}, () => {});
            } else {
              console.log(chalk.red(`Path ${dirPath} is not a directory`));
            }
          }
        });
      });
    }
  });
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
          loadPlugin(unzippedPluginPath, pluginName).then(
            () => {
              res.send("Ok");
            },
            err => {
              res.status(500);
              res.send(err);
            }
          );
        }
      }
    );
  } else {
    res.status(500);
    res.write("Invalid plugin name => " + pluginName);
    res.end();
  }
});

function createSocketCLIUpdater(socket) {
  return function updater() {
    socket.emit("cli-config", {
      commands: pluginList.getCommands()
    });
  };
}

function getDeploymentFileFromCommand(command) {
  return new Promise((resolve, reject) => {
    const foundCommand = pluginList
      .getCommands()
      .find(c => c.configuration === command);
    if (foundCommand) resolve(foundCommand["kubernetes-file"]);
    else reject("Deployment file not found");
  });
}

function compileTemplate(filePath, args) {
  return new Promise((resolve, reject) => {
    const deploymentFile = filePath;
    console.log(chalk.cyan(`Compiling file template ${deploymentFile}`));
    const renderedContent = template.renderFile(deploymentFile, args);
    console.log(renderedContent);
    const renderedFileName = `compiled-template-${guid()}`;
    const renderedFilePath = path.join(
      yargs.deploymentFilesDest,
      renderedFileName
    );
    console.log(chalk.cyan(`Writing rendered file to ${renderedFilePath}`));
    const renderedFile = fs.writeFile(
      renderedFilePath,
      renderedContent,
      err => {
        if (err) {
          console.log(
            chalk.red(
              `Impossible to write file ${renderedFilePath}: ${err.toString()}`
            )
          );
          reject(err.toString());
        } else {
          console.log(chalk.green(`Deployment file ready !`));
          resolve(renderedFilePath);
        }
      }
    );
  });
}

function deployOnKubernetes(deploymentFilePath) {
  return new Promise((resolve, reject) => {
    const command = `${KUBECTL_BIN} create -f ${deploymentFilePath}`;
    console.log(chalk.cyan(`Executing: ${chalk.yellow(command)} ...`));
    const kubectl = spawn(KUBECTL_BIN, ["create", "-f", deploymentFilePath]);
    kubectl.stdout.on("data", data =>
      console.log(`${chalk.cyan("[*]")} ${chalk.yellow(data)}`)
    );
    kubectl.stderr.on("data", data =>
      console.log(`${chalk.cyan("[*]")} ${chalk.yellow(data)}`)
    );
    kubectl.on("error", err => {
      console.log(chalk.red(err));
      reject(err);
    });
    kubectl.on("exit", code => {
      if (code === 0) {
        console.log(chalk.green("Kubectl finished."));
        resolve();
      } else {
        console.log(chalk.red("Kubectl couldn't create."));
        reject("Kubectl has failed to run correctly");
      }
    });
  });
}

function runCommand(command, args) {
  return getDeploymentFileFromCommand(command)
    .then(filePath => compileTemplate(filePath, args))
    .then(deploymentFilePath => deployOnKubernetes(deploymentFilePath));
}

createPluginsDir(err => {
  if (err == null) {
    server.listen(yargs.port);
    console.log(chalk.green(`Listening on port ${yargs.port}...`));
    io.on("connection", function(socket) {
      console.log(
        chalk.cyan(`Connected to client at ${socket.conn.remoteAddress}`)
      );
      const updateCLI = createSocketCLIUpdater(socket);
      updateCLI();

      const kafkaConsumer = new Kafka.KafkaConsumer({
        "group.id": socket.id,
        "metadata.broker.list": `${process.env.KAFKA_HOST}:${
          process.env.KAFKA_PORT
        }`
      });
      kafkaConsumer.on("event.error", err => {
        socket.emit("log", {
          topic: "Kafka",
          time: new Date(),
          stream: "stderr",
          message: `Cannot connect to Kafka to collect logs (${err.stack})`,
          source: "client driver"
        });
      });
      kafkaConsumer.connect();
      kafkaConsumer.on("ready", () => {
        kafkaConsumer.subscribe(["kube-logs"]);
        kafkaConsumer.consume();
      });
      kafkaConsumer.on("data", data => {
        const value = JSON.parse(data.value.toString());
        const msg = JSON.parse(value.message);
        socket.emit("log", {
          topic: data.topic,
          time: msg.time,
          stream: msg.stream,
          message: msg.log.replace(/\n/g, ""),
          source: value.source.match(/\/var\/log\/containers\/([^_]*)_/)[1]
        });
      });

      pluginList.emitter.on("new plugin", updateCLI);
      socket.on("command", function(data) {
        console.log(
          chalk.cyan(
            `Received command "${chalk.yellow(
              data.type
            )}" with args ${JSON.stringify(data.args)}`
          )
        );
        runCommand(data.type, data.args)
          .then(() => socket.emit("logs", { logs: chalk.green("Launched.") }))
          .catch(err => {
            console.log(chalk.red(err.toString()));
            socket.emit("logs", {
              logs: chalk.red(`Impossible to run command:\n${err.toString()}`)
            });
          });
      });
      socket.on("disconnect", function() {
        pluginList.emitter.removeListener("new plugin", updateCLI);
        console.log(
          chalk.yellow(
            `Disconnected from client at ${socket.conn.remoteAddress}`
          )
        );
        io.emit("user disconnected");

        kafkaConsumer.disconnect();
      });
    });
  }
});
