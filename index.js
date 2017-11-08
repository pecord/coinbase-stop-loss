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

let stopLossPrice = safelyParseNumber(process.env.COINBASE_STOP_LOSS)
if(stopLossPrice <= 0) {
  throw new Error("Stop loss price must be greater than zero")
}
debug("parsed stop loss as ", stopLossPrice)

var client = new Client({
  'apiKey'   : process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET
});

async.doWhilst((done) => {
  debug("*********************************************************************")
  getSellPrice((err, sellPrice) => {
    if (err) {
      debug("get sell price returned with an error", err);
      return done(err)
    } else {
      if (!sellPrice) {
        return done(new Error("no sale price"))
      }

      debug("got sell price", sellPrice);
      let isItTimeToSell = sellPrice < stopLossPrice
      debug(`is it time to sell... ${isItTimeToSell ? "YES!" : "no"} ${sellPrice} < ${stopLossPrice}`)

      if (isItTimeToSell) {
        debug("selling EVERYTHING!!!... you are welcome :)")
        process.exit(0);
      } else {
        debug("it is not time to sell")
        return done(null)
      }
    }
  })
}, () => { return true })

function safelyParseNumber(numberToBeParsed) {
  if (!numberToBeParsed) {
    throw new Error("Number to be parsed is missing")
  } else {
    let parsedNumber = parseFloat(numberToBeParsed, 10)
    return parsedNumber
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
