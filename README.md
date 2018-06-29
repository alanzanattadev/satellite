# satellite

## Install

### Operating System

- Download and install Ubuntu 18.04 LTS
- `git clone https://github.com/alanzanattadev/satellite && cd satellite`
- `./deploy.sh` and follow instructions

You can monitor units with `juju status` or via the web gui with `juju gui`.

#### Troubleshooting

- Cluster kubernetes down: juju destroy-model [TAB TAB]

## Contribute

### CLI

- cd into parts/cli
- yarn
- yarn start

### Master

- Install build-essentials
- cd into parts/master
- yarn
- yarn start

### Instagram fetcher

- Install build-essentials
- cd into parts/instagram-fetcher
- yarn
- yarn start