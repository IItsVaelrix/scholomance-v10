// src/pages/Read/nodes/WordNode.jsx
import { createEditor, DecoratorNode } from 'lexical';
import * as React from 'react';

function WordComponent({ school, word }) {
  const className = `editor-word school--${school.toLowerCase()}`;
  return <span className={className}>{word}</span>;
}

export class WordNode extends DecoratorNode {
  __word;
  __school;

  static getType() {
    return 'word';
  }

  static clone(node) {
    return new WordNode(node.__word, node.__school, node.__key);
  }

  constructor(word, school, key) {
    super(key);
    this.__word = word;
    this.__school = school;
  }

  createDOM(config) {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.word;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    return <WordComponent school={this.__school} word={this.__word} />;
  }
}

export function $createWordNode(word, school) {
  return new WordNode(word, school);
}

export function $isWordNode(node) {
  return node instanceof WordNode;
}
