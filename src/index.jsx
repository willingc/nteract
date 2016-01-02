import React from 'react';
import ReactDOM from 'react-dom';
import Immutable from 'immutable';

import Notebook from './components/Notebook';

const fakeNotebook = Immutable.fromJS({
  'cells': [
    {
      'cell_type': 'code',
      'execution_count': 1,
      'metadata': {
        'collapsed': false,
      },
      'outputs': [
        {
          'name': 'stdout',
          'output_type': 'stream',
          'text': [
            'The Zen of Python, by Tim Peters\n',
            '\n',
            'Beautiful is better than ugly.\n',
            'Explicit is better than implicit.\n',
            'Simple is better than complex.\n',
            'Complex is better than complicated.\n',
            'Flat is better than nested.\n',
            'Sparse is better than dense.\n',
            'Readability counts.\n',
            'Special cases aren\'t special enough to break the rules.\n',
            'Although practicality beats purity.\n',
            'Errors should never pass silently.\n',
            'Unless explicitly silenced.\n',
            'In the face of ambiguity, refuse the temptation to guess.\n',
            'There should be one-- and preferably only one --obvious way to do it.\n',
            'Although that way may not be obvious at first unless you\'re Dutch.\n',
            'Now is better than never.\n',
            'Although never is often better than *right* now.\n',
            'If the implementation is hard to explain, it\'s a bad idea.\n',
            'If the implementation is easy to explain, it may be a good idea.\n',
            'Namespaces are one honking great idea -- let\'s do more of those!\n',
          ],
        },
      ],
      'source': [
        'import this',
      ],
    },
    {
      'cell_type': 'code',
      'execution_count': 2,
      'metadata': {
        'collapsed': false,
      },
      'outputs': [
        {
          'data': {
            'text/plain': [
              '4294967296',
            ],
          },
          'execution_count': 2,
          'metadata': {},
          'output_type': 'execute_result',
        },
      ],
      'source': [
        '2**32',
      ],
    },
    {
      'cell_type': 'code',
      'execution_count': null,
      'metadata': {
        'collapsed': true,
      },
      'outputs': [],
      'source': [],
    },
  ],
  'metadata': {
    'kernelspec': {
      'display_name': 'Python 3',
      'language': 'python',
      'name': 'python3',
    },
    'language_info': {
      'codemirror_mode': {
        'name': 'ipython',
        'version': 3,
      },
      'file_extension': '.py',
      'mimetype': 'text/x-python',
      'name': 'python',
      'nbconvert_exporter': 'python',
      'pygments_lexer': 'ipython3',
      'version': '3.5.1',
    },
  },
  'nbformat': 4,
  'nbformat_minor': 0,
});

ReactDOM.render(
  <Notebook cells={fakeNotebook.get('cells')}
            language={fakeNotebook.getIn(['metadata', 'language_info', 'name'])} />
, document.querySelector('#app'));
