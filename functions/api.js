const crypto = require('crypto');

// Dummy data store
const users = {
  'user1': { password: 'pass1', balance: 1000 },
  'user2': { password: 'pass2', balance: 2000 }
};

let transactions = [];

function authenticate(username, password) {
  return users[username] && users[username].password === password;
}

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

function getBalance(username) {
  return users[username].balance;
}

function makeTransfer(from, to, amount) {
  if (users[from].balance >= amount) {
    users[from].balance -= amount;
    users[to].balance += amount;
    transactions.push({
      from,
      to,
      amount,
      timestamp: Date.now()
    });
    return true;
  }
  return false;
}

exports.handler = async function(event, context) {
  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;
  const body = JSON.parse(event.body || '{}');

  switch (`${method} ${path}`) {
    case 'POST /login':
      if (authenticate(body.username, body.password)) {
        return {
          statusCode: 200,
          body: JSON.stringify({ token: generateToken(), message: 'Login successful' })
        };
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

    case 'GET /balance':
      const username = event.queryStringParameters.username;
      return {
        statusCode: 200,
        body: JSON.stringify({ balance: getBalance(username) })
      };

    case 'POST /transfer':
      if (makeTransfer(body.from, body.to, body.amount)) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Transfer successful' })
        };
      } else {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Insufficient funds' })
        };
      }

    case 'GET /transactions':
      const user = event.queryStringParameters.username;
      const userTransactions = transactions.filter(t => t.from === user || t.to === user);
      return {
        statusCode: 200,
        body: JSON.stringify(userTransactions)
      };

    default:
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Not Found' })
      };
  }
};