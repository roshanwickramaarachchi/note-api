const express = require('express');

const {
    getNotes,
    createNote,
    updateNote,
    deleteNote
} = require('../controllers/notes')

const Note = require('../models/Note')

const advancedResults = require('../middleware/advancedResults')

const router = express.Router();

router
  .route('/')
  .get(advancedResults(Note), getNotes)
  .post(createNote);  

router
  .route('/:id')
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;

