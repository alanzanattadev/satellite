const app = require("express")();
const bodyParser = require("body-parser");
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
const neo4j = require("neo4j-driver").v1;
const Kafka = require("node-rdkafka");
const template = require("swig");
const guid = require("uuid/v4");

template.setDefaults({ cache: false });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const networkConfig = {
  kafka: { host: process.env.KAFKA_HOST || "0.0.0.0" },
  neo4j: { host: process.env.NEO4J_HOST || "0.0.0.0" },
  mongodb: { host: process.env.MONGO_HOST || "0.0.0.0" },
  vault: { host: process.env.VAULT_HOSt || "0.0.0.0" },
  kube: { host: process.env.KUBERNETES_HOST || "0.0.0.0" },
  registry: { host: process.env.REGISTRY_HOST || "0.0.0.0" }
};

const defaultPorts = {
  kafka: "9092",
  neo4j: "7687",
  mongodb: "27017",
  registry: "5000"
};

app.post("/config/:app", (req, res) => {
  const { body, params } = req;
  const { app } = params;
  networkConfig[app] = body;
  res.send("Configuration received");
  console.log(
    chalk.yellow(`Network config updated for '${app}': ${JSON.stringify(body)}`)
  );
});

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

app.get("/visu", (req, res) => {
  const driver = neo4j.driver(
    `bolt://${networkConfig.neo4j.host}:${defaultPorts.neo4j}`,
    neo4j.auth.basic("neo4j", "neo4j")
  );
  const session = driver.session();
  session.run("MATCH (a)-[r]-(b) RETURN *").then(result => {
    session.close();
    driver.close();
    res.send(result.records);
  });
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
    const renderedContent = template.renderFile(deploymentFile, {
      ...args,
      mongodb_host: networkConfig.mongodb.host,
      mongodb_port: defaultPorts.mongodb,
      neo4j_host: networkConfig.neo4j.host,
      neo4j_port: defaultPorts.neo4j,
      kafka_host: networkConfig.kafka.host,
      kafka_port: defaultPorts.kafka,
      registry_host: networkConfig.registry.host,
      registry_port: defaultPorts.registry,
      uuid: guid()
    });
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
        "metadata.broker.list": `${networkConfig.kafka.host}:${
          defaultPorts.kafka
        }`
      });
      kafkaConsumer.on("event.error", err => {
        console.log(
          chalk.red(
            `Error in Kafka connection for socket id: ${socket.id} (${
              err.stack
            })`
          )
        );
        socket.emit("log", {
          topic: "Kafka",
          time: new Date(),
          stream: "stderr",
          message: `Cannot connect to Kafka to collect logs (${err.stack})`,
          source: "Satellite"
        });
      });
      kafkaConsumer.connect();
      kafkaConsumer.on("ready", () => {
        kafkaConsumer.subscribe(["kube-logs", "log"]);
        kafkaConsumer.consume();
        console.log(
          chalk.cyan(`Connected to Kafka for socket id: ${socket.id}`)
        );
        socket.emit("log", {
          topic: "Kafka",
          time: new Date(),
          stream: "stdout",
          message: "Connected to Kafka via the satellite master",
          source: "Satellite"
        });
      });
      kafkaConsumer.on("data", data => {
        const value = JSON.parse(data.value.toString());
        if (data.topic === "log" && value.source.includes("/var/log/juju/")) {
          socket.emit("log", {
            topic: data.topic,
            time: value["@timestamp"],
            stream: "stdout",
            message: value.message,
            source: value.source.replace("/var/log/juju/", "")
          });
        } else if (data.topic === "kube-logs") {
          const msg = JSON.parse(value.message);
          socket.emit("log", {
            topic: data.topic,
            time: msg.time,
            stream: msg.stream,
            message: msg.log.replace(/\n/g, ""),
            source: value.source.match(/\/var\/log\/containers\/([^_]*)_/)[1]
          });
        }
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
          .then(() =>
            socket.emit("log", {
              topic: "Master",
              time: new Date(),
              stream: "stdout",
              message: "Command launched",
              source: "Satellite"
            })
          )
          .catch(err => {
            console.log(chalk.red(err.toString()));
            return socket.emit("log", {
              topic: "Master",
              time: new Date(),
              stream: "stderr",
              message: `Impossible to the run command: ${err.toString()}`,
              source: "Satellite"
            });
          });
      });

      const driver = neo4j.driver(
        `bolt://${networkConfig.neo4j.host}:${defaultPorts.neo4j.port}`,
        neo4j.auth.basic("neo4j", "test")
      );
      socket.on("meta-profile-create", ({ name }) => {
        const session = driver.session();
        session
          .run(
            "MERGE (mp:MetaProfil { name: $name }) ON CREATE SET mp.name = $name RETURN mp",
            { name }
          )
          .then(() => {
            socket.emit("log", {
              time: new Date(),
              message: "Meta profile successfully created",
              source: "Satellite"
            });
            session.close();
          })
          .catch(err => {
            socket.emit("log", {
              time: new Date(),
              stream: "stderr",
              message: `Impossible to create meta profile: ${err.toString()}`,
              source: "Satellite"
            });
            session.close();
          });
      });

      socket.on("meta-profile-search", ({ name }) => {
        const session = driver.session();
        session
          .run(
            `MATCH (mp:MetaProfil)
              WHERE mp.name CONTAINS $name
              RETURN mp.name`,
            { name }
          )
          .then(result => {
            socket.emit("log", {
              time: new Date(),
              message: `Results:
                ${result.records
                  .map(node => `- ${node.get("mp.name")}`)
                  .join("\n")}
              `,
              source: "Satellite"
            });
            session.close();
          })
          .catch(err => {
            socket.emit("log", {
              time: new Date(),
              stream: "stderr",
              message: `Impossible to search meta profile: ${err.toString()}`,
              source: "Satellite"
            });
            session.close();
          });
      });

      socket.on("meta-profile-link", ({ name, accountType, targetString }) => {
        const session = driver.session();
        session
          .run(
            `MATCH (mp:MetaProfil { name: $name })
              MATCH (target) WHERE $accountType IN labels(target) AND ANY (property in keys(target) WHERE target[property] = $targetString)
              MERGE (mp)-[r:HAS_ACCOUNT]->(target)
              RETURN mp`,
            { name, accountType, targetString }
          )
          .then(() => {
            socket.emit("log", {
              time: new Date(),
              message: "Meta profile successfully linked",
              source: "Satellite"
            });
            session.close();
          })
          .catch(err => {
            socket.emit("log", {
              time: new Date(),
              stream: "stderr",
              message: `Impossible to link meta profile: ${err.toString()}`,
              source: "Satellite"
            });
            session.close();
          });
      });

      socket.on("meta-profile-remove", ({ name }) => {
        const session = driver.session();
        session
          .run("MATCH (mp:MetaProfil { name: $name }) DETACH DELETE mp", {
            name
          })
          .then(() => {
            socket.emit("log", {
              time: new Date(),
              message: "Meta profile successfully removed",
              source: "Satellite"
            });
            session.close();
          })
          .catch(err => {
            socket.emit("log", {
              time: new Date(),
              stream: "stderr",
              message: `Impossible to remove meta profile: ${err.toString()}`,
              source: "Satellite"
            });
            session.close();
          });
      });

      socket.on("kubectl", ({ args }) => {
        const kubectl = spawn(KUBECTL_BIN, args);
        kubectl.stdout.on("data", data =>
          socket.emit("log", {
            topic: "Master",
            time: new Date(),
            stream: "stdout",
            message: data,
            source: "Kubectl"
          })
        );
        kubectl.stderr.on("data", data =>
          socket.emit("log", {
            topic: "Master",
            time: new Date(),
            stream: "stderr",
            message: data,
            source: "Kubectl"
          })
        );
        kubectl.on("error", error =>
          socket.emit("log", {
            topic: "Master",
            time: new Date(),
            stream: "stdout",
            message: `Kubectl error: ${error}`,
            source: "Kubectl"
          })
        );
        return kubectl.on("exit", code =>
          socket.emit("log", {
            topic: "Master",
            time: new Date(),
            stream: "stdout",
            message: `Kubectl exit with code: ${code}`,
            source: "Kubectl"
          })
        );
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
        driver.close();
      });
    });
  }
});
