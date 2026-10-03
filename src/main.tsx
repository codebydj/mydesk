import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AccountRoot from './account';
createRoot(document.getElementById('root')!).render(<BrowserRouter><AccountRoot/></BrowserRouter>);
