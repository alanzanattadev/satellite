# TO LAUNCH WITH REGISTRY IP AS ARG

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce
echo "{ \"insecure-registries\":[\"$1:5000\"] }" | sudo tee /etc/docker/daemon.json
sudo service docker restart