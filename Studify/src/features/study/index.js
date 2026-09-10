/**
 * Studify - features/study
 *
 * Tudo que é "estudar" num lugar só: quiz pós-sessão, revisão FSRS e planner.
 * Componentes moram aqui; serviços continuam em services/ e são re-exportados
 * para conveniência (paths antigos seguem funcionando).
 */
export { default as QuizModal } from './QuizModal';
export { gerarQuiz } from '../chat/aiService';
export * from './studyCoachService';
export {
  registrarQuizAttempt,
  carregarQuizAttempts,
} from '../../services/subjectsDb';
export { aplicarResultadoQuiz } from '../../shared/utils/fsrs';
export { buildStudyQueue, buildWeeklyPlan } from '../../shared/utils/studyPlan';
