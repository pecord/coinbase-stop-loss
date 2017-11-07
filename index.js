var Client = require('coinbase').Client;

if (!process.env.COINBASE_API_KEY) {
  throw new Error("Coinbase API key missing")
}

if (!process.env.COINBASE_API_SECRET) {
  throw new Error("Coinbase API key missing")
}

if (!process.env.COINBASE_STOP_LOSS) {
  throw new Error("Coinbase stop loss price missing")
}

try {
  parseFloat(process.env.COINBASE_STOP_LOSS, 10)
} catch (error) {
  throw new Error("Coinbase stop loss price not valid")
}

var client = new Client({
  'apiKey'   : process.env.COINBASE_API_KEY,
  'apiSecret': process.env.COINBASE_API_SECRET
});

// Listing available accounts
client.getAccounts({}, function(err, accounts) {
  if (err) throw err
  accounts.forEach(function(acct) {
    console.log('my bal: ' + acct.balance.amount + ' for ' + acct.name);
  });
});

// Current buy price
client.getBuyPrice({'currencyPair': 'BTC-USD'}, function(err, obj) {
  console.log('total amount: ' + obj.data.amount);
});

// Sell command
// var args = {
//   "amount": "12",
//   "currency": "BTC"
// };
// account.sell(args, function(err, xfer) {
//   console.log('my xfer id is: ' + xfer.id);
// });

while(true) {
  // Get balance
  // Get sell price
  // Compare sell price to stop loss
  // if stop loss triggered
  //  - sell balance
  // else loop again
}
