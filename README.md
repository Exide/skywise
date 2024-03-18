# Skywise

A simple web app for getting the current weather and a 5-day forecast for a location in the US.

## How to run locally

```shell
docker run -it --rm -d -p 8080:80 --name skywise --volume $(pwd)/src:/usr/share/nginx/html nginx
```
