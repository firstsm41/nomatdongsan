import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppInit } from './components/AppInit'
import { Layout } from './components/Layout'
import { BUILTIN_WORDBOOK_ID } from './data/builtin'
import { HomePage } from './pages/HomePage'
import { QuizPlayPage } from './pages/QuizPlayPage'
import { QuizSetupPage } from './pages/QuizSetupPage'
import { StudyPage } from './pages/StudyPage'
import { WordbookDetailPage } from './pages/WordbookDetailPage'
import { WordbooksPage } from './pages/WordbooksPage'
import { StatsPage } from './pages/StatsPage'
import { WrongNotesPage } from './pages/WrongNotesPage'

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <AppInit />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="wordbooks" element={<WordbooksPage />} />
          <Route path="wordbooks/:id" element={<WordbookDetailPage />} />
          <Route path="wordbooks/:id/study" element={<StudyPage />} />
          <Route path="wordbooks/:id/quiz" element={<QuizSetupPage />} />
          <Route path="wordbooks/:id/quiz/play" element={<QuizPlayPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="wrong" element={<WrongNotesPage />} />
          <Route
            path="*"
            element={<Navigate to={`/wordbooks/${BUILTIN_WORDBOOK_ID}`} replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
