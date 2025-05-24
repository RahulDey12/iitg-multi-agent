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

### Configure MinIO (Optinal if you use AWS)

```sh
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin123" \
  quay.io/minio/minio server /data --console-address ":9001"
```

Create Bucket

```sh
docker run --rm minio/mc sh -c "mc alias set myminio http://loclahost:9000 minioadmin minioadmin123 && mc mb myminio/iitg-multiagent && mc anonymous set public minio/iitg-multiagent"

```

# Install Deno

Install Deno from https://docs.deno.com/runtime/

# Run Application

```sh
deno install --allow-scripts && deno run dev -A
```

### Enjoy :tada:

Now hit the API endpoint from Postman or any API Client which is

```http
POST /message HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "message": "I want to write a blog about [YOUR TOPIC]",
}
```
