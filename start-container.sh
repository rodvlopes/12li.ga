#!/usr/bin/env bash

docker run -d --name 12liga --restart=always -v `pwd`:/app -p 127.0.0.1:8200:3005 12liga
