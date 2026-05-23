import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { NewWordbookPage } from './pages/NewWordbookPage'
import { QuizPlayPage } from './pages/QuizPlayPage'
import { QuizSetupPage } from './pages/QuizSetupPage'
import { WordbookDetailPage } from './pages/WordbookDetailPage'
import { WordbooksPage } from './pages/WordbooksPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="wordbooks" element={<WordbooksPage />} />
          <Route path="wordbooks/new" element={<NewWordbookPage />} />
          <Route path="wordbooks/:id" element={<WordbookDetailPage />} />
          <Route path="wordbooks/:id/quiz" element={<QuizSetupPage />} />
          <Route path="wordbooks/:id/quiz/play" element={<QuizPlayPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
