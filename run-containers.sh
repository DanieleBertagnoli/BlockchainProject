#!/bin/bash

sudo docker stop DragonBlockMySQL
sudo docker stop DragonBlockFlask
sudo docker rm DragonBlockMySQL
sudo docker rm DragonBlockFlask

sudo docker network rm DragonBlockNetwork
sudo docker network create DragonBlockNetwork

cd MySQL
sudo docker build --tag mysql-docker .
sudo docker run -d -p 3306:3306 --name DragonBlockMySQL --network=DragonBlockNetwork mysql-docker
cd ..

sleep 10

cd Flask
sudo docker build --tag flask-docker .
sudo docker run -p 80:80 --mount type=bind,source=$(pwd)/ContainerFiles,target=/ContainerFiles --name DragonBlockFlask --network=DragonBlockNetwork flask-docker
cd ..
