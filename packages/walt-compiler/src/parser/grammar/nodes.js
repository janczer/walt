// Node Types
const { extendNode } = require('../../utils/extend-node');
const Syntax = require('walt-syntax');
const { nonEmpty, drop } = require('./helpers');

const marker = lexer => {
  const { col, line } = lexer;

  if (!lexer.lines.length) {
    return { col, line, sourceLine: '' };
  }

  return {
    col,
    line,
    sourceLine: lexer.lines[lexer.line - 1],
  };
};

function factory(lexer) {
  const node = (Type, seed = {}) => d => {
    const params = d.filter(nonEmpty);
    const { value = '', meta = {} } = seed;
    const start = marker(lexer);
    const end =
      params[params.length - 1] && params[params.length - 1].range
        ? params[params.length - 1].range[1]
        : { ...start, col: start.col + value.length };

    return {
      value,
      type: null,
      Type,
      toString() {},
      meta,
      range: [start, end],
      params,
    };
  };

  const binary = d => {
    const [lhs, operator, rhs] = d.filter(nonEmpty);
    let Type = Syntax.BinaryExpression;
    if (operator.value === '||' || operator.value === '&&') {
      Type = Syntax.Select;
    }
    return node(Type, { value: operator.value })([lhs, rhs]);
  };

  const constant = d => {
    const value = d[0].value;
    return extendNode(
      {
        value,
        type: value.toString().indexOf('.') !== -1 ? 'f32' : 'i32',
      },
      node(Syntax.Constant)([])
    );
  };

  const identifier = d => node('Identifier', { value: d.join('') })([]);

  const declaration = Type => d => {
    const [pair, ...init] = drop(d);
    const [id, type] = pair.params;
    return extendNode(
      {
        value: id.value,
        type: type.value,
      },
      node(Type)(init)
    );
  };

  const statement = d => {
    return d.filter(nonEmpty);
  };

  const unary = ([operator, target]) => {
    let params = [target];

    if (operator.value === '-') {
      params = [
        {
          ...target,
          value: '0',
          Type: Syntax.Constant,
          params: [],
          meta: {},
        },
        target,
      ];
    }

    return extendNode(
      {
        Type: 'UnaryExpression',
        value: operator.value,
        params,
      },
      node(Syntax.UnaryExpression)([operator, target])
    );
  };

  const ternary = d => {
    return {
      Type: 'TernaryExpression',
      value: '?',
      meta: [],
      params: d.filter(t => nonEmpty(t) && t !== '?' && t !== ':'),
    };
  };

  const subscript = d => {
    const [id, field] = d.filter(nonEmpty);
    return extendNode(
      {
        value: id.value,
        params: [id, field],
      },
      node(Syntax.ArraySubscript)([id, field])
    );
  };

  const fun = d => {
    const [name, args, result, block] = d.filter(nonEmpty);
    return {
      ...name,
      Type: Syntax.FunctionDeclaration,
      meta: [],
      params: [args, result, block],
    };
  };

  const voidFun = d => {
    const params = drop(d);
    const [name, args, block] = params;
    const result = extendNode({ type: null }, node(Syntax.FunctionResult)([]));
    return extendNode(
      {
        value: name.value,
        params: [args, result, block],
      },
      node(Syntax.FunctionDeclaration)(params)
    );
  };

  const result = d => {
    const [type] = drop(d);

    return extendNode(
      {
        type: type != null && type.value !== 'void' ? type.value : null,
      },
      node(Syntax.FunctionResult)(d)
    );
  };

  const call = d => {
    const [id, ...params] = drop(d);
    return extendNode(
      {
        value: id.value,
      },
      node(Syntax.FunctionCall)(params)
    );
  };

  const struct = d => {
    const [id, ...params] = drop(d);
    return extendNode(
      {
        value: id.value,
      },
      node(Syntax.Struct)(params)
    );
  };

  const _type = d => {
    return extendNode(
      {
        value: d[0].value,
        type: d[0].value,
        params: [],
      },
      node(Syntax.Type)(d)
    );
  };

  const typedef = d => {
    const [id, args, res] = drop(d);

    return extendNode(
      {
        value: id.value,
        params: [
          node(Syntax.FunctionArguments)(args),
          extendNode(
            {
              type: res.value,
            },
            node(Syntax.FunctionResult)([res])
          ),
        ],
        type: res.type,
      },
      node(Syntax.Typedef)([id, args, result])
    );
  };

  const string = d => {
    return extendNode(
      {
        value: d[0].value,
        type: 'i32',
      },
      node(Syntax.StringLiteral)([])
    );
  };

  const comment = d => {
    return extendNode(
      {
        value: d[0].value,
        params: [],
      },
      node(Syntax.Comment)(d)
    );
  };

  const boolean = d => {
    return extendNode(
      {
        value: d[0].value,
        type: 'i32',
        params: [],
      },
      node(Syntax.Boolean)(d)
    );
  };

  return {
    node,
    binary,
    constant,
    identifier,
    statement,
    unary,
    ternary,
    subscript,
    fun,
    declaration,
    call,
    struct,
    result,
    string,
    type: _type,
    typedef,
    comment,
    voidFun,
    boolean,
    assignment(d, value) {
      let Type = Syntax.Assignment;
      if (d[0] && d[0].Type === Syntax.ArraySubscript) {
        Type = Syntax.MemoryAssignment;
      }

      return node(Type, { value })(d);
    },
    forLoop(d) {
      const [initializer, condition, afterthought, ...body] = drop(d);
      return node(Syntax.Loop)([initializer, condition, ...body, afterthought]);
    },
    whileLoop(d) {
      const noop = node(Syntax.Noop)([]);
      return node(Syntax.Loop)([noop, ...d]);
    },
  };
}
module.exports = factory;