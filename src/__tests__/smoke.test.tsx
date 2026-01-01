import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../app/App';

const renderApp = () => renderToString(<App />);

describe('frontend smoke', () => {
  it('renders app without crashing', () => {
    const html = renderApp();
    expect(html.length).toBeGreaterThan(0);
  });
});
