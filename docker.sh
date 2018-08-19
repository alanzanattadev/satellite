# TO LAUNCH WITH REGISTRY IP AS ARG

curl -fsSL get.docker.com -o get-docker.sh
sh get-docker.sh
echo "{ \"insecure-registries\":[\"$1:5000\"] }" | sudo tee /etc/docker/daemon.json
sudo service docker restart