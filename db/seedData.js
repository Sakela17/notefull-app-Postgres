const knex = require('../knex');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = function(file) {
  console.log(process.env.TEST_DATABASE_URL);
  return exec(`psql -f ${file} -d postgres://postgres:@localhost/noteful-test`);
  // return exec(`psql -f ${file} -d postgres://dev:volk0dav@localhost/noteful-test`);
};