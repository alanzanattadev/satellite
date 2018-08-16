# satellite

## Install

### Operating System

- Download and install Ubuntu 18.04 LTS
- `git clone https://github.com/alanzanattadev/satellite && cd satellite`
- `./deploy.sh` and follow instructions

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

## Contribute

### CLI

- cd into parts/cli
- yarn
- yarn start

### Master

- Install build-essentials python librdkafka-dev
- cd into parts/master
- yarn
- yarn start

### Instagram fetcher

- Install build-essentials
- cd into parts/instagram-fetcher
- yarn
- yarn start
