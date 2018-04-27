'use strict';

const express = require('express');

// Create an router instance (aka "mini-app")
const router = express.Router();

const knex = require('../knex');
const hydrateNotes = require('../utils/hydrateNotes');


// TEMP: Simple In-Memory Database
// const data = require('../db/notes');
// const simDB = require('../db/simDB');
// const notes = simDB.initialize(data);

// Get All (and search by query)
router.get('/notes', (req, res, next) => {
  const { searchTerm, folderId, tagId } = req.query;

  knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName',
    'notes_tags.tag_id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
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
    .modify( queryBuilder => {
      if (tagId) {
        queryBuilder.where('tag_id', tagId)
      }
    })
    .orderBy('notes.id')
    .then(results => {
      if (results) {
        const hydrated = hydrateNotes(results);
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(next);

});

// Get a single item
router.get('/notes/:id', (req, res, next) => {
  const noteId = req.params.id;

  knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName',
    'notes_tags.tag_id as tagId', 'tags.name as tagName')
    .from('notes')
    .leftJoin('folders', 'notes.folder_id', 'folders.id')
    .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
    .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
    .where('notes.id', noteId)
    .then(result => {
      if (result) {
        const hydrated = hydrateNotes(result)[0];
        res.json(hydrated);
      } else {
        next();
      }
    })
    .catch(next);
});

// Update an item
router.put('/notes/:id', (req, res, next) => {

  const noteId = req.params.id;
  const { title, content, folderId, tags } = req.body;

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

  // let noteId =

  knex('notes')
    .update(updateItem)
    .where('id', noteId)
    .returning('id')
    .then(([id]) => {
      return knex('notes_tags').del().where({'note_id': id});
    })
    .then(() => {
      if(!tags) return;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));
      return knex.insert(tagsInsert).into('notes_tags');
    })
    .then(() => {
      return knex.select('notes.id', 'title', 'content', 'folders.id as folder_id', 'folders.name as folderName',
        'notes_tags.tag_id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'notes_tags.tag_id', 'tags.id')
        .where('notes.id', noteId);
    })
    .then(result => {
      if (result) {
        const [hydrated] = hydrateNotes(result);
        res.json(hydrated);
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
  const { title, content, folder_id, tags = [] } = req.body;

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

  let noteId;

  knex('notes')
    .insert(newItem)
    .returning('id')
    .then(([id]) => {
      // if(!tags) return;
      noteId = id;
      const tagsInsert = tags.map(tagId => ({ note_id: noteId, tag_id: tagId }));

      return knex.insert(tagsInsert).into('notes_tags');
      })
    .then(() => {
      return knex.select('notes.id', 'title', 'content',
        'folders.id as folder_id', 'folders.name as folderName',
        'tags.id as tagId', 'tags.name as tagName')
        .from('notes')
        .leftJoin('folders', 'notes.folder_id', 'folders.id')
        .leftJoin('notes_tags', 'notes.id', 'notes_tags.note_id')
        .leftJoin('tags', 'tags.id', 'notes_tags.tag_id')
        .where('notes.id', noteId);
    })
    .then(note => {
      if (note) {
        const hydrated = hydrateNotes(note)[0];
        // res.location(`http://${req.headers.host}/notes/${note[0].id}`).status(201).json(note[0]);
        res.location(`${req.originalUrl}/${hydrated.id}`).status(201).json(hydrated);
      }
      console.log('ITEM ITEM', note);
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
