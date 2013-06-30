var idast = require('idast'), tern = require('tern'), walk = require('acorn/util/walk'), walkall = require('walkall');

// ast takes a `file` parameter and returns an array of acorn AST node objects augmented with an
// `_id` property from node-idast.
tern.defineQueryType('ast', {
  takesFile: true,
  run: function(server, query, file) {
    var nodes = [];
    idast.assignIds(file.ast);
    walk.simple(file.ast, walkall.makeVisitors(function(node) {
      nodes.unshift(node);
    }), walkall.traversers);
    return nodes;
  }
});


// sourcegraph:ast takes a `file` parameter and returns an array of SourceGraph AST node objects.
tern.defineQueryType('sourcegraph:ast', {
  takesFile: true,
  run: function(server, query, file) {
    var res = [];
    server.request({query: {type: 'ast', file: file.name}}, function(err, res2) {
      if (err) throw err;
      for (var i = 0; i < res2.length; i++) {
        var node = res2[i];
        res.push({
          id: node._id,
          type: node.type,
          start: node.start,
          end: node.end,
          obj: node.type == 'CallExpression' ? {
            args: node.arguments.map(function(arg) {
              return arg._id;
            })
          } : undefined,
        });
      }
    });
    return res;
  }
});