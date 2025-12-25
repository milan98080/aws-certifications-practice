export interface DiscussionComment {
  content: string;
  poster: string;
  comment_id?: string;
  upvote_count?: string;
  timestamp?: string;
  comments?: DiscussionComment[];
}

export interface Discussion {
  upvote_count?: string;
  poster: string;
  content?: string;
  timestamp?: string;
  comment_id?: string;
  comments?: DiscussionComment[];
}

export interface Question {
  question_id: string;
  question_number: number;
  question_text: string;
  choices: Record<string, string>;
  correct_answer: string;
  is_multiple_choice: boolean;
  question_images?: string[];
  answer_images?: string[];
  discussion?: Discussion[];
  discussion_count?: number;
}

export interface QuizData {
  questions: Question[];
  total_questions: number;
}

export interface TestMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  filename: string;
  totalQuestions: number;
  timeLimit: number;
  passingScore: number;
}

export interface TestsConfig {
  tests: TestMetadata[];
}