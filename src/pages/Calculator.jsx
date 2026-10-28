import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';

const buttons = [
  { label: 'C', value: 'clear', className: 'calculator-key--muted' },
  { label: 'DEL', value: 'delete', className: 'calculator-key--muted' },
  { label: '/', value: '/', className: 'calculator-key--operator' },
  { label: '*', value: '*', className: 'calculator-key--operator' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '-', value: '-', className: 'calculator-key--operator' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '+', value: '+', className: 'calculator-key--operator' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '.', value: '.' },
  { label: '0', value: '0' },
  { label: '=', value: 'equals', className: 'calculator-key--equals' }
];

function calculate(expression) {
  const tokens = expression.match(/\d*\.?\d+|[+\-*/]/g);
  if (!tokens || tokens.join('') !== expression || /[+\-*/]$/.test(expression)) return null;
  const values = [];
  const operators = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const applyTop = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (left === undefined || right === undefined || (operator === '/' && right === 0)) return false;
    values.push(operator === '+' ? left + right : operator === '-' ? left - right : operator === '*' ? left * right : left / right);
    return true;
  };
  for (const token of tokens) {
    if (/^\d/.test(token) || token.startsWith('.')) values.push(Number(token));
    else {
      while (operators.length && precedence[operators[operators.length - 1]] >= precedence[token] && !applyTop()) return null;
      operators.push(token);
    }
  }
  while (operators.length && !applyTop()) return null;
  return values.length === 1 && Number.isFinite(values[0]) ? String(Number(values[0].toFixed(10))) : null;
}

export default function Calculator() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  function press(value) {
    if (value === 'clear') return setExpression('');
    if (value === 'delete') return setExpression((current) => current.slice(0, -1));
    if (value === 'equals') {
      const nextResult = calculate(expression);
      if (nextResult !== null) { setExpression(nextResult); setResult(nextResult); }
      return;
    }
    setResult('');
    setExpression((current) => {
      if (/[+\-*/.]$/.test(current) && /[+\-*/.]/.test(value)) return `${current.slice(0, -1)}${value}`;
      if (value === '.' && current.split(/[+\-*/]/).pop().includes('.')) return current;
      return `${current}${value}`;
    });
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (/^[0-9.+\-*/]$/.test(event.key)) press(event.key);
      else if (event.key === 'Enter' || event.key === '=') press('equals');
      else if (event.key === 'Backspace') press('delete');
      else if (event.key === 'Escape') press('clear');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return <div className="calculator-page">
    <PageHeader eyebrow="Workspace utility" title="Calculator" />
    <section className="calculator-card" aria-label="Calculator">
      <div className="calculator-display"><span>{expression || '0'}</span><strong>{result && `= ${result}`}</strong></div>
      <div className="calculator-keys">{buttons.map((button) => <button key={button.label} type="button" className={`calculator-key ${button.className || ''}`} onClick={() => press(button.value)}>{button.label}</button>)}</div>
    </section>
  </div>;
}
