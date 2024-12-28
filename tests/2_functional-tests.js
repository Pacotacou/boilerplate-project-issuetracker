const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  let issueId;

  // POST Tests
  test('Create an issue with every field', function (done) {
    chai
      .request(server)
      .post('/api/issues/testproject')
      .send({
        issue_title: 'Test Issue',
        issue_text: 'This is a test issue',
        created_by: 'Tester',
        assigned_to: 'Developer',
        status_text: 'In Progress'
      })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, '_id');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'updated_on');
        assert.equal(res.body.issue_title, 'Test Issue');
        assert.equal(res.body.open, true);
        issueId = res.body._id; // Save issue ID for later tests
        done();
      });
  });

  test('Create an issue with only required fields', function (done) {
    chai
      .request(server)
      .post('/api/issues/testproject')
      .send({
        issue_title: 'Required Fields Test',
        issue_text: 'This issue only has required fields',
        created_by: 'Tester'
      })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isObject(res.body);
        assert.property(res.body, '_id');
        assert.equal(res.body.issue_title, 'Required Fields Test');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.equal(res.body.open, true);
        done();
      });
  });

  test('Create an issue with missing required fields', function (done) {
    chai
      .request(server)
      .post('/api/issues/testproject')
      .send({
        issue_text: 'Missing required fields'
      })
      .end(function (err, res) {
        if (err) return done(err);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
  });

  // GET Tests
  test('View issues on a project', function (done) {
    chai
      .request(server)
      .get('/api/issues/testproject')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtLeast(res.body.length, 1);
        done();
      });
  });

  test('View issues on a project with one filter', function (done) {
    chai
      .request(server)
      .get('/api/issues/testproject?open=true')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => assert.equal(issue.open, true));
        done();
      });
  });

  test('View issues on a project with multiple filters', function (done) {
    chai
      .request(server)
      .get('/api/issues/testproject?open=true&assigned_to=Developer')
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        res.body.forEach(issue => {
          assert.equal(issue.open, true);
          assert.equal(issue.assigned_to, 'Developer');
        });
        done();
      });
  });

  // PUT Tests
  test('Update one field on an issue', function (done) {
    chai
      .request(server)
      .put('/api/issues/testproject')
      .send({
        _id: issueId,
        issue_text: 'Updated text'
      })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: issueId });
        done();
      });
  });

  test('Update multiple fields on an issue', function (done) {
    chai
      .request(server)
      .put('/api/issues/testproject')
      .send({
        _id: issueId,
        issue_text: 'Updated text',
        assigned_to: 'New Developer'
      })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: issueId });
        done();
      });
  });

  test('Update an issue with missing _id', function (done) {
    chai
      .request(server)
      .put('/api/issues/testproject')
      .send({
        issue_text: 'Should fail'
      })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  test('Update an issue with no fields to update', function (done) {
    chai
      .request(server)
      .put('/api/issues/testproject')
      .send({ _id: issueId })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: issueId });
        done();
      });
  });

  test('Update an issue with an invalid _id', function (done) {
    chai
      .request(server)
      .put('/api/issues/testproject')
      .send({ _id: 'invalidid', issue_text: 'Should fail' })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not update', _id: 'invalidid' });
        done();
      });
  });

  // DELETE Tests
  test('Delete an issue', function (done) {
    chai
      .request(server)
      .delete('/api/issues/testproject')
      .send({ _id: issueId })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', _id: issueId });
        done();
      });
  });

  test('Delete an issue with an invalid _id', function (done) {
    chai
      .request(server)
      .delete('/api/issues/testproject')
      .send({ _id: 'invalidid' })
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalidid' });
        done();
      });
  });

  test('Delete an issue with missing _id', function (done) {
    chai
      .request(server)
      .delete('/api/issues/testproject')
      .send({})
      .end(function (err, res) {
        if (err) return done(err);
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

});
