const Note = require('../models/Note')
const asyncHandler = require('../middleware/async')


// @desc      Get all notes
// @route     GET /api/v1/notes
// @access    public
exports.getNotes = asyncHandler(async (req, res, next) => {

    res.status(200).json(res.advancedResults);
  });

// @desc      create new notes
// @route     POST /api/v1/notes
// @access    Private
exports.createNote = asyncHandler(async (req, res, next) => {     
   
    const note = await Note.create(req.body);
  
    res.status(201).json({ success: true, data: note });
  });

// @desc      Update note
// @route     PUT /api/v1/notes/:id
// @access    Private
exports.updateNote = asyncHandler(async (req, res, next) => {
    let note = await Note.findById(req.params.id);
    
    note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
  
    res.status(200).json({ success: true, data: note });
  });

// @desc      Delete  note
// @route     DELETE /api/v1/notes/:id
// @access    Private
exports.deleteNote = asyncHandler(async (req, res, next) => {
    const note = await Note.findById(req.params.id);  
     
    note.remove();
  
    res.status(200).json({ success: true, data: {} });
  });
  