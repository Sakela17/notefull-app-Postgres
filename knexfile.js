'use strict';

module.exports = {
  development: {
    client: 'pg',
    // remove dev:volk0dav@ when testing on Travis
    connection: process.env.DATABASE_URL || 'postgres://dev:volk0dav@localhost/noteful-app',
    debug: true, // http://knexjs.org/#Installation-debug
    pool: { min: 1, max: 2 }
  },
  test: {
    client: 'pg',
    // remove dev:volk0dav@ when testing on Travis
    connection: process.env.TEST_DATABASE_URL || 'postgres://dev:volk0dav@localhost/noteful-test',
    pool: { min: 1, max: 2 }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
  }
};
