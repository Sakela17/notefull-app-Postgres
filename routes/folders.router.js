'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');


// Get All folders
router.get('/folders', (req, res, next) => {
  knex
    .select('id', 'name')
    .from('folders')
    .then(folders => {
      res.json(folders);
    })
    .catch(next);
});

// Get a single folder
router.get('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  knex
    .first('id', 'name')
    .from('folders')
    .where('id', id)
    .then(folder => {
      if (folder) {
        res.json(folder);
      } else {
        next();
      }
    })
    .catch(next);
});

// Put update a folder
router.put('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
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

// Post (insert) a folder
router.post('/folders', (req, res, next) => {
  const { name } = req.body;
  const newFolder = { name };

  /***** Never trust users - validate input *****/
  if (!newFolder.name) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('folders')
    .insert(newFolder)
    .returning('*')
    .then(newFolder => {
      res.location(`http://${req.headers.host}/folders/${newFolder[0].id}`).status(201).json(newFolder[0]);
    })
    .catch(next);
});

// Delete a folder
router.delete('/folders/:id', (req, res, next) => {
  const id = req.params.id;
  knex('folders')
    .where('id', id)
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;