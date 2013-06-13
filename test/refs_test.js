var assert = require('assert');

var server = require('./helpers').startTernServer('.', {doc_comment: true, node: true, refs: true, symbols: true});

describe('Refs', function() {
  function requestRefs(src, test) {
    server.addFile('a.js', src);
    server.request({
      query: {type: "symbols", file: 'a.js'}}, function(err) {
      if (err) throw err;
    });
    server.request({
      query: {type: 'sourcegraph:refs', file: 'a.js'},
    }, function(err, res) {
      assert.ifError(err);
      test(res);
    });
  }

  it('returns a ref to an external symbol', function(done) {
    requestRefs('require("./test/testdata/b").x', function(res) {
      assert.deepEqual(
        res.refs,
        [
          {
            astNode: '/Program/body/0/ExpressionStatement/expression/MemberExpression/object/CallExpression/callee',
            kind: 'ident',
            symbol: '@node/require'
          },
          {
            astNode: '/Program/body/0/ExpressionStatement/expression/MemberExpression/property',
            kind: 'ident',
            symbol: 'test/testdata/b.js/x'
          }
        ]
      );
      done();
    });
  });
  it('returns a ref to a predef symbol', function(done) {
    requestRefs('require("fs").readFile', function(res) {
      assert.deepEqual(
        res.refs,
        [
          {
            astNode: '/Program/body/0/ExpressionStatement/expression/MemberExpression/object/CallExpression/callee',
            kind: 'ident',
            symbol: '@node/require'
          },
          {
            astNode: '/Program/body/0/ExpressionStatement/expression/MemberExpression/property',
            kind: 'ident',
            symbol: '@node/readFile'
          }
        ]
      );
      done();
    });
  });
  it('returns a ref to an exported symbol defined in the same file', function(done) {
    requestRefs('module.exports.x=function(){};var y = module.exports.x;', function(res) {
      assert.deepEqual(
        res.refs,
        [
          {
            astNode: '/Program/body/0/ExpressionStatement/expression/AssignmentExpression/left/MemberExpression/property',
            kind: 'ident',
            symbol: 'a.js/x'
          },
          {
            astNode: '/Program/body/1/VariableDeclaration/declarations/0:y/init/MemberExpression/property',
            kind: 'ident',
            symbol: 'a.js/x'
          }
        ]
      );
      done();
    });
  });
});
