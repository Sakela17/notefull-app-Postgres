'use strict';

const express = require('express');

const router = express.Router();

const knex = require('../knex');


// Get All tags
router.get('/tags', (req, res, next) => {
  knex
    .select('id', 'name')
    .from('tags')
    .then(result => {
      res.json(result);
    })
    .catch(next);
});

// Get a single tag
router.get('/tags/:id', (req, res, next) => {
  const id = req.params.id;
  knex
    .first('id', 'name')
    .from('tags')
    .where('id', id)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

// Put update a tag
router.put('/tags/:id', (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('tags')
    .update({name})
    .where('id', id)
    .returning(['id', 'name'])
    .then(([result]) => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});


/* ========== POST/CREATE ITEM ========== */
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

// Delete a tag
router.delete('/tags/:id', (req, res, next) => {
  const id = req.params.id;
  knex('tags')
    .where('id', id)
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;