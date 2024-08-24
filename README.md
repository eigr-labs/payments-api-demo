# payments_api

This is a [Spawn](https://github.com/eigr/spawn) app

# Running in dev mode

Make sure the proxy is running with:

```
spawn dev run -p ./protos -s spawn-system -W
```

Run your application with:

```
yarn start
```

### Invoking your Actor

You can now invoke your Actor with:

```
curl -vvv -H 'Accept: application/json' http://localhost:9980/v1/hello_world?message=World
```

> **NOTE**: This uses the HTTP transcoding from the protobuf definition, you can also invoke this actor from other Spawn hosts.

# Setup for production

```
spawn new prod
```

# Documentation

See [SDK Documentation](https://github.com/eigr/spawn-node-sdk/tree/main?tab=readme-ov-file#documentation)
