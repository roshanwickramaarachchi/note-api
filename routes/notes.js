const express = require('express');

const {
  getNotes,
  createNote,
  updateNote,
  deleteNote
} = require('../controllers/notes')

const Note = require('../models/Note')

const advancedResults = require('../middleware/advancedResults')

const router = express.Router()

const { protect } = require('../middleware/auth')

router
  .route('/')
  .get(advancedResults(Note), getNotes)
  .post(protect, createNote)

router
  .route('/:id')
  .put(protect, updateNote)
  .delete(protect, deleteNote)

module.exports = router

