import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContextAPI';
import App from '../app/App';

const renderApp = () =>
  renderToString(
    <AuthProvider>
      <DataProvider>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </DataProvider>
    </AuthProvider>
  );

describe('frontend smoke', () => {
  it('renders app without crashing', () => {
    const html = renderApp();
    expect(html.length).toBeGreaterThan(0);
  });
});
