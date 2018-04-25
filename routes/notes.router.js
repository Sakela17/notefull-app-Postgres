'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');


// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
  const { searchTerm } = req.query;

  knex
    .select('notes.id', 'title', 'content')
    .from('notes')
    .modify(queryBuilder => {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .orderBy('notes.id')
    .then(list => {
      res.json(list);
      // console.log(JSON.stringify(results, null, 2));
    })
    .catch(next);
});

// Get a single item
router.get('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex
    .first('notes.id', 'title', 'content')
    .from('notes')
    .where('notes.id', id)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

// Put update an item
router.put('/notes/:id', (req, res, next) => {
  // const id = req.params.id;
  //
  // /***** Never trust users - validate input *****/
  // const updateObj = {};
  // const updateableFields = ['title', 'content'];
  //
  // updateableFields.forEach(field => {
  //   if (field in req.body) {
  //     updateObj[field] = req.body[field];
  //   }
  // });
  //
  // /***** Never trust users - validate input *****/
  // if (!updateObj.title) {
  //   const err = new Error('Missing `title` in request body');
  //   err.status = 400;
  //   return next(err);
  // }
  //
  // console.log('PUT REQUEST PUT PUT', updateObj);

  const noteId = req.params.id;
  const { title, content } = req.body;

  console.log('REQUEST BODY BODY', title, content);

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content
  };

  console.log('REQUEST BODY BODY', updateItem);

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning(['id', 'title', 'content'])
    .then(([result]) => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));

  // knex('notes')
  //   .modify(queryBuilder => {
  //     if (updateObj.content) {
  //       queryBuilder.update( {title: `${updateObj.title}`, content:`${updateObj.content}` });
  //       // queryBuilder.where('title', 'like', `%${searchTerm}%`);
  //     } else {
  //       queryBuilder.update( {title: `${updateObj.title}`} );
  //     }
  //   })
  //   .where( 'notes.id', `${id}`)
  //   .returning('*')
  //   .then(item => {
  //     res.json(item[0]);
  //     console.log(JSON.stringify(item, null, 2));
  //   })
  //   .catch(next);
});

// Post (insert) an item
router.post('/notes', (req, res, next) => {
  const { title, content } = req.body;

  const newItem = { title, content };
  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .insert(newItem)
    .returning('*')
    .then(item => {
      res.location(`http://${req.headers.host}/notes/${item[0].id}`).status(201).json(item[0]);
    })
    .catch(next);
});

// Delete an item
router.delete('/notes/:id', (req, res, next) => {
  const id = req.params.id;

  knex('notes')
    .where('notes.id', id)
    .del()
    .then(() => {
      res.sendStatus(204);
    })
    .catch(next);
});

module.exports = router;
