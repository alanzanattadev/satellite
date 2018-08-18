# satellite

## Install

### Operating System

- Download and install Ubuntu 18.04 LTS
- `snap install satellite`
- `satellite.deploy` and follow instructions

You can monitor units with `juju status` or via the web gui with `juju gui`.

#### Troubleshooting

- Cluster kubernetes down: juju destroy-model [TAB TAB]

## Plugin creation

### Setup

- Create a folder
- Create a folder "features" in the first folder

These two steps can be realized either on the same machine as the CLI, either
on the same machine as the satellite Master server.

### CLI Config

- Create a folder "cli" in "yourplugin/features"
- Create a "config.yml" file in "yourplugin/features/cli"

This yaml file has to contain a list of objects. Each object contains 3 attributs:

- configuration: It's the vorpal configuration line
- description: A human readable description of the command
- kubernetes-file: The name of the associated kubernetes deployment file

```yaml
- configuration: test with required option <username>
  description: This is a test command
  kubernetes-file: test.yml

- configuration: another test <username>
  description: another test command
  kubernetes-file: test.yml
```

See vorpal commands for the configuration attribut: https://github.com/dthree/vorpal/wiki/API-%7C-vorpal.command#vorpalcommandcommanddescription

### Kubernetes deployments

- Create a folder "deployments" in "yourplugin/features"
- Create a deployment file "test.yml" in "yourplugin/features/deployments"

This file must contain a Kubernetes deployment configuration. This configuration will be sent to
Kubernetes with "kubectl create -f" and so has to be compatible with such command.

If you need to have params for your configuration, you can use the jinja2 syntax to template the
deployment file. The deployment file will be compiled with Swig (which respects jinja2 syntax).
When you define an argument or an option in the configuration attribut of the CLI config file,
the argument will be sent to the templating engine.

```yaml
---
apiVersion: batch/v1
kind: Job
metadata:
  name: spotify-habits-get-all-for-user-{{ username }}
spec:
  template:
    metadata:
      labels:
        app: spotify-habits
    spec:
      containers:
        - name: spotify-habits-get-all-for-user-{{ username }}
          image: spotify-habits
          args: ["./get_all_for_user.sh", "{{ username }}"]
      restartPolicy: Never
```

### Load plugin

#### if you want to load it from the CLI

- launch the CLI.
- type `load plugin /path/to/the/plugin`

You can load again to apply modifications of a plugin and so iterate while developing it.

#### if you want to load it from master

- launch master with the option `--loadPluginsDir /path/to/your/plugin`

Reload master to reload the plugin

## Workflow

### Install

run `snap install satellite`

### Start: Deploy

run `satellite.deploy`

The master IP will be displayed at the end.
We'll use it as "$ip"

run `satellite.cli -s $ip`

### Use

Load plugins you want to load with `load plugin ../plugin/testplugin`

You'll have now access to new commands.
Launch some commands, you'll see the progress through grey logs on the CLI.

You have access to a visualizer on http://localhost:9123/ (on the same machine as the CLI)

### Code: CLI

- install nodejs yarn
- cd into cli
- `yarn`
- launch CLI with `yarn start -s $ip`

### Code: Master

- install build-essentials python librdkafka-dev nodejs yarn
- cd into master folder
- code
- `docker build -t satellite-master .`
- `juju status`
- get the docker registry ip
- `docker push ip:5000/satellite-master`
- `juju charm-upgrade smaster`

Troubleshoot with:

- `juju ssh smaster`
- `docker logs $(docker ps -q)`

### Code: Plugin configuration

- `juju status`
- cd into plugin directory
- code scripts you need, and give them the IPs they need for MongoDB and Neo4J
- code and iterate by starting them manually
- `docker build -t pluginname .`
- `docker push ip:5000/pluginname`
- launch the CLI with `satellite.cli -s $ip`
- run `load plugin ./`
- exec the plugin commands
- see the output on the CLI
- modify the configuration
- run `load plugin ./` again
- reexec the plugin commands

### Code: Plugin code

- `juju status`
- cd into plugin directory
- code scripts you need, and give them the IPs they need for MongoDB and Neo4J
- code and iterate by starting them manually
- launch the CLI with `satellite.cli -s $ip`
- run `load plugin ./`

This is the iteration loop

- `docker build -t pluginname .`
- `docker push ip:5000/pluginname`
- exec the plugin commands
- iterate

### Code: Deployment

- `./deploy.sh`
- check if everything works with juju status
- try to use it
- modify deployment code
- `./clean.sh`
- iterate

### End: Clean

run `satellite.clean`
