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
  const { searchTerm, folderId } = req.query;

  knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .modify(function (queryBuilder) {
      if (searchTerm) {
        queryBuilder.where('title', 'like', `%${searchTerm}%`);
      }
    })
    .modify(function (queryBuilder) {
      if (folderId) {
        queryBuilder.where('folder_id', folderId);
      }
    })
    .orderBy('notes.id')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));

});

// Get a single item
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex.first('notes.id', 'title', 'content', 'folder_id', 'folders.name as folderName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .where('notes.id', noteId)
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);
});

// Update an item
router.put('/notes/:id', (req, res, next) => {

  const noteId = req.params.id;
  const { title, content, folderId } = req.body;

  console.log('REQUEST BODY BODY', title, content);

  // /***** Never trust users - validate input *****/
  // const updateItem = {};
  // const updateableFields = ['title', 'content', 'folder_id'];
  //
  // updateableFields.forEach(field => {
  //   if (field in req.body) {
  //     updateItem[field] = req.body[field];
  //   }
  // });

  /***** Never trust users. Validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  const updateItem = {
    title: title,
    content: content,
    folder_id: folderId
  };

  console.log('**************************', updateItem);

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning('id')
    .then(() => {
      console.log('***********HELLO*************');
      return knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(([result]) => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(next);

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

// Post (insert) a note
router.post('/notes', (req, res, next) => {
  const { title, content, folder_id } = req.body;

  const newItem = {
    title: title,
    content: content,
    folder_id: folder_id
  };

  console.log('NEW ITEM', newItem);

  /***** Never trust users - validate input *****/
  if (!newItem.title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }

  knex('notes')
    .insert(newItem)
    .returning('id')
    .then(([noteId]) => {
      console.log('***********HELLO*************');
      return knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .where('notes.id', noteId);
    })
    .then(note => {
      console.log('ITEM ITEM', note);
      // res.location(`http://${req.headers.host}/notes/${note[0].id}`).status(201).json(note[0]);
      res.location(`${req.originalUrl}/${note[0].id}`).status(201).json(note[0]);
    })
    .catch(next);
});

// Delete an item
router.delete('/notes/:id', (req, res, next) => {

  knex('notes')
    .where('notes.id', req.params.id)
    .del()
    .then(() => {
      res.sendStatus(204);
      res.status(204).end();
    })
    .catch(next);
});

module.exports = router;
