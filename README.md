# Payments-API Spawn Example

This is a [Spawn](https://github.com/eigr/spawn) example app

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

You can now invoke actors with:

```
# to capture
curl -i -H 'Accept: application/json' -H 'Content-Type: application/json' -X POST -d '{"id":"spawn.txn_01","amount":1000,"currency":"usd","orderRefid":"order_01"}' http://localhost:9980/payments/capture

# to refund
curl -i -H 'Accept: application/json' -H 'Content-Type: application/json' -X POST -d '{"id":"spawn.txn_02","amount":500,"currency":"usd","captureTransactionId":"spawn.txn_01"}' http://localhost:9980/payments/refund

# to get the breakdown
curl -i -H 'Accept: application/json' -H 'Content-Type: application/json' http://localhost:9980/payments/breakdown
```

> **NOTE**: This uses the HTTP transcoding from the protobuf definition, you can also invoke this actor from other Spawn hosts.

# Documentation

See [SDK Documentation](https://github.com/eigr/spawn-node-sdk/tree/main?tab=readme-ov-file#documentation)
