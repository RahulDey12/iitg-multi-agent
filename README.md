# Multi Agent LLM

Made with :heart: by [Rahul Dey](https://github.com/RahulDey12)

## Pre Requisite

- Docker
- Docker Compose

## Quick Start

### Setup Env

On MacOS/Linux/Powershell Run the following command and add necessary values

```sh
cp .env.example .env
```

### Start Docker

```sh
docker-compose up
```

### Enjoy :tada:

Now hit the API endpoint from Postman or any API Client which is

```http
POST /message HTTP/1.1
Host: localhost
Content-Type: application/json

{
  "message": "I want to write a blog about [YOUR TOPIC]",
}
```
