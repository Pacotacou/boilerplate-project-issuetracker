'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  project: { type: String, required: true },
  assigned_to: { type: String },
  status_text: { type: String },
  open: { type: Boolean, default: true },
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now }
})

const Issue = mongoose.model("Issue",issueSchema);

module.exports = function (app) {

  
  app.route('/api/issues/:project')
    // Create a new issue
    .post(async (req, res) => {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;
    
      if (!issue_title || !issue_text || !created_by ) {
        res.status(200).json({ error: 'required field(s) missing' });
        return
      }
    
      try {
        const issue = new Issue({
          project,
          issue_title,
          issue_text,
          created_by,
          assigned_to: assigned_to || '', // Set to empty string if not provided
          status_text: status_text || '', // Set to empty string if not provided
          created_on: new Date(),
          updated_on: new Date(),
          open: true, // Default value
        });
    
        const savedIssue = await issue.save();
    
        res.json({
          _id: savedIssue._id,
          issue_title: savedIssue.issue_title,
          issue_text: savedIssue.issue_text,
          created_by: savedIssue.created_by,
          assigned_to: savedIssue.assigned_to,
          status_text: savedIssue.status_text,
          created_on: savedIssue.created_on,
          updated_on: savedIssue.updated_on,
          open: savedIssue.open,
        });
      } catch (err) {
        res.status(500).send(err);
      }
    })
    // Retrieve all issues for a project
    .get(async (req, res) => {
      const project = req.params.project;
      const query = req.query;

      try {
        const issues = await Issue.find({project, ...query});
        res.json(issues);
      } catch (err) {
        res.status(500).send(err);
      }
    })
    // Update an existing issue
    .put(async (req, res) => {
      const { _id, ...updateFields } = req.body;

      if (!_id) {
        res.json({ error: 'missing _id' });
        return
      }

      if (Object.keys(updateFields).length === 0) {
        res.json({ error: 'no update field(s) sent', _id });
        return
      }

      updateFields.updated_on = new Date();

      try {
        const updatedIssue = await Issue.findByIdAndUpdate(_id, updateFields, { new: true });
        if (!updatedIssue) {
          res.json({ error: 'could not update', _id });
          return
        }
        res.json({ result: 'successfully updated', _id });
      } catch (err) {
        res.json({ error: 'could not update', _id });
      }
    })
    // Delete an issue
    .delete(async (req, res) => {
      const { _id } = req.body;

      if (!_id) {
        res.json({ error: 'missing _id' });
        return
      }

      try {
        const deletedIssue = await Issue.findByIdAndDelete(_id);
        if (!deletedIssue) {
          res.json({ error: 'could not delete', _id });
          return
        }
        res.json({ result: 'successfully deleted', _id });
      } catch (err) {
        res.json({ error: 'could not delete', _id });
      }
    });

  mongoose.connect(process.env.MONGO_URI)
    .then(function(){
      console.log('successfull connection!');
    })
    .catch(function(err){
      console.log('error on connection');
    });
    
};
