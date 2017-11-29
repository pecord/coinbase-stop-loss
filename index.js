let Client = require("coinbase").Client
let async  = require("async")
let debug  = require("debug")("coinbase:stop-loss")
let _      = require("lodash")

if (!process.env.COINBASE_API_KEY) {
  throw new Error("Coinbase API key missing")
}

if (!process.env.COINBASE_API_SECRET) {
  throw new Error("Coinbase API key missing")
}

if (!process.env.COINBASE_STOP_LOSS) {
  throw new Error("Coinbase stop loss price is missing")
}

if (!process.env.COINBASE_ACCOUNT_ID) {
  throw new Error("Coinbase account id is missing")
}

let stopLossPrice = safelyParseNumber(process.env.COINBASE_STOP_LOSS)
if(stopLossPrice <= 0) {
  throw new Error("Stop loss price must be greater than zero")
}
debug("parsed stop loss as ", stopLossPrice)

var client = new Client({
  'apiKey'   : process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET
});

async.waterfall([
  getSellPrice,
  (sellPrice, done) => {
    if (!sellPrice) return done(new Error("no sale price"))
    debug("got sell price", sellPrice);

    let isItTimeToSell = sellPrice < stopLossPrice

    debug(`is it time to sell... ${isItTimeToSell ? "YES!" : "no"} ${sellPrice} < ${stopLossPrice}`)
    if (isItTimeToSell) {
      getBitcoinTotal((err, btcTotal) => {
        if (err) return done(err)
        if (!btcTotal) return done(new Error("no btc total"))
        debug("got btc total", btcTotal)
        if (btcTotal === 0) {
          debug("noting to sell, exiting")
          process.exit()
        }
        debug("selling EVERYTHING!!!... you are welcome :)")
        sellBitcoin(btcTotal, (err, xfer) => {
          debug("sell complete", xfer)
          process.exit()
        })
      })
    } else {
      debug("it is not time to sell")
      done(null)
    }
  }
], (err, results) => {
  if(err) console.log(err.stack)
  exitHandler.bind(null, {exit:true})
})

function safelyParseNumber(numberToBeParsed) {
  try {
    let parsedNumber = parseFloat(numberToBeParsed, 10)
    return parsedNumber
  } catch(err) {
    throw err
  }
}

function getSellPrice(cb) {
  debug("starting get sell price")
  client.getSellPrice({'currencyPair': 'BTC-USD'}, function(err, obj) {
    if (err) {
      debug("get sell price return with an error");
      return cb(err)
    } else {
      let sellPrice = _.get(obj, "data.amount")
      sellPrice     = safelyParseNumber(sellPrice)
      if (!sellPrice) {
        return cb(new Error(`no sell price ${sellPrice}`))
      } else {
        return cb(null, sellPrice)
      }
    }
  });
}

function getBitcoinTotal(cb) {
  client.getAccounts({}, function(err, accounts) {
    if(err) return cb(err)
    accounts.forEach(function(acct) {
      if(acct.balance.currency === "BTC") {
        //debug("acct", acct)
        return cb(null, acct.balance.amount)
      }
    })
  })
}

function sellBitcoin(amount, cb) {
  var args = {
    "amount": amount,
    "currency": "BTC"
  };
  client.getAccount(process.env.COINBASE_ACCOUNT_ID, function(err, account) {
    debug('bal: ' + account.balance.amount + ' currency: ' + account.balance.currency);
    account.sell(args, function(err, xfer) {
      if(err) return cb(err)
      debug('my xfer id is: ' + xfer.id);
      return cb(null, xfer)
    });
  });

}

function exitHandler(options, err) {
  if (options.cleanup) debug('exiting')
  if (err) console.log(err.stack);
  if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
