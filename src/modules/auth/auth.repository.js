const dbAuth = require('../../database/auth');

// re-export what this module needs, with names that make sense at this layer
module.exports = {
  findByUsername:    dbAuth.getUserByUsername,
  findById:          dbAuth.getUserById,
  authenticate:      dbAuth.authenticateUser,
  changePIN:         dbAuth.changeUserPIN,
  createAccount:     dbAuth.createUserAccount,
  markFirstComplete: dbAuth.markFirstLoginComplete,
};
